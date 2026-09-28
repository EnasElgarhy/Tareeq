"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/require-admin";
import {
  ADMIN_ROLES,
  type AdminRole,
  canManageTargetRole,
  isLastOwner,
  ROLE_LABELS,
} from "@/lib/admin/team/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const roleSchema = z.enum(ADMIN_ROLES);
const inviteSchema = z.object({ email: z.string().trim().email(), role: roleSchema });

type Sb = ReturnType<typeof createSupabaseAdminClient>;

async function audit(sb: Sb, actorId: string, action: string, targetId: string | null, metadata: Record<string, unknown>) {
  // Best-effort — never let audit failure block the operation.
  await sb.from("admin_audit_log").insert({ actor_user_id: actorId, action, target_user_id: targetId, metadata });
}

/** All ACTIVE member roles — used for the last-owner guard. */
async function activeRoles(sb: Sb): Promise<AdminRole[]> {
  const { data } = await sb.from("admin_members").select("role,status").eq("status", "active");
  return ((data ?? []) as Array<{ role: AdminRole }>).map((r) => r.role);
}

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** What actually happened when we tried to invite someone. */
export type InviteOutcome = "emailed" | "existing_account";

export interface InviteResult {
  outcome: InviteOutcome;
  /** Human-readable, admin-facing summary — surfaced verbatim in the UI toast. */
  message: string;
}

/**
 * Resolve an email to its auth user, if one exists. Admins aren't mirrored into
 * `user_accounts` (that table is consumer-only), so we ask GoTrue's admin API
 * directly rather than joining app tables. Exact (case-insensitive) match — the
 * `filter` param is a partial match, so we re-check in code.
 */
async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> };
  const match = (body.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
  );
  return match ? { id: match.id } : null;
}

/** Admin-facing note for an invite that can't be emailed (account exists). */
function existingAccountMessage(email: string, origin: string, roleLabel: string): string {
  return `${email} already has an account, so no invite email was sent. Ask them to sign in to the admin and open ${origin}/admin/accept-invite to take the ${roleLabel} role.`;
}

export async function inviteMember(email: string, role: string): Promise<InviteResult> {
  const actor = await requirePermission("team.manage");
  const input = inviteSchema.parse({ email, role });
  if (!canManageTargetRole(actor.role, input.role)) {
    throw new Error("You can't invite someone at that role.");
  }
  const sb = createSupabaseAdminClient();
  const roleLabel = ROLE_LABELS[input.role] ?? input.role;

  // Does this email already have an account? Supabase refuses to email an invite
  // to an existing user, so we branch on this up front instead of firing a doomed
  // send and swallowing the error (the bug this replaces).
  const existing = await findAuthUserByEmail(input.email);

  // Already an active team member → nothing to do. Fail loudly rather than
  // create a dangling "pending" invitation that can never produce an email.
  if (existing) {
    const { data: member } = await sb
      .from("admin_members")
      .select("role,status")
      .eq("user_id", existing.id)
      .maybeSingle();
    if (member && (member.status as string) === "active") {
      const memberLabel = ROLE_LABELS[member.role as AdminRole] ?? (member.role as string);
      throw new Error(`${input.email} is already on the team (${memberLabel}).`);
    }
  }

  const origin = await originFromHeaders();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const { data: inserted, error: invErr } = await sb
    .from("admin_invitations")
    .insert({
      email: input.email,
      role: input.role,
      invited_by: actor.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (invErr) throw new Error(invErr.message);

  // Existing account (not yet a member): the invite row stands, but there's no
  // email to send. They accept by signing in and opening the accept page. Report
  // this honestly instead of claiming an email went out.
  if (existing) {
    await audit(sb, actor.id, "team.invite_created", null, {
      email: input.email,
      role: input.role,
      emailed: false,
      reason: "existing_account",
    });
    revalidatePath("/admin/team");
    return {
      outcome: "existing_account",
      message: existingAccountMessage(input.email, origin, roleLabel),
    };
  }

  // New user: Supabase creates the unconfirmed auth user and sends the invite.
  const { error: mailErr } = await sb.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${origin}/admin/auth/callback`,
  });
  if (mailErr) {
    // Fallback: the up-front lookup can miss (transient API hiccup). If Supabase
    // itself says the account exists, treat it as the existing-account path — the
    // invite row is valid, they accept by signing in — instead of failing hard.
    if (/already.*(registered|exists)|exists/i.test(mailErr.message)) {
      await audit(sb, actor.id, "team.invite_created", null, {
        email: input.email,
        role: input.role,
        emailed: false,
        reason: "existing_account_late",
      });
      revalidatePath("/admin/team");
      return {
        outcome: "existing_account",
        message: existingAccountMessage(input.email, origin, roleLabel),
      };
    }
    // Genuine send failure: roll back the row so no phantom invite lingers.
    await sb.from("admin_invitations").delete().eq("id", inserted.id);
    throw new Error(`Couldn't send the invite email: ${mailErr.message}`);
  }

  await audit(sb, actor.id, "team.invite_sent", null, {
    email: input.email,
    role: input.role,
    emailed: true,
  });
  revalidatePath("/admin/team");
  return { outcome: "emailed", message: `Invitation email sent to ${input.email}.` };
}

export async function changeRole(userId: string, role: string): Promise<void> {
  const actor = await requirePermission("team.manage");
  const newRole = roleSchema.parse(role);
  const sb = createSupabaseAdminClient();

  const { data: target } = await sb.from("admin_members").select("role,status").eq("user_id", userId).maybeSingle();
  if (!target) throw new Error("Member not found.");
  const currentRole = target.role as AdminRole;

  if (!canManageTargetRole(actor.role, currentRole) || !canManageTargetRole(actor.role, newRole)) {
    throw new Error("You can't change that member's role.");
  }
  if (currentRole === "owner" && newRole !== "owner" && isLastOwner("owner", await activeRoles(sb))) {
    throw new Error("You can't demote the last owner.");
  }

  const { error } = await sb.from("admin_members").update({ role: newRole, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await audit(sb, actor.id, "team.role_changed", userId, { from: currentRole, to: newRole });
  revalidatePath("/admin/team");
}

export async function setMemberStatus(userId: string, status: "active" | "suspended"): Promise<void> {
  const actor = await requirePermission("team.manage");
  const nextStatus = z.enum(["active", "suspended"]).parse(status);
  const sb = createSupabaseAdminClient();

  const { data: target } = await sb.from("admin_members").select("role").eq("user_id", userId).maybeSingle();
  if (!target) throw new Error("Member not found.");
  const targetRole = target.role as AdminRole;
  if (!canManageTargetRole(actor.role, targetRole)) throw new Error("You can't change that member.");
  if (nextStatus === "suspended" && isLastOwner(targetRole, await activeRoles(sb))) {
    throw new Error("You can't suspend the last owner.");
  }

  const { error } = await sb.from("admin_members").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await audit(sb, actor.id, "team.status_changed", userId, { status: nextStatus });
  revalidatePath("/admin/team");
}

export async function removeMember(userId: string): Promise<void> {
  const actor = await requirePermission("team.manage");
  const sb = createSupabaseAdminClient();

  const { data: target } = await sb.from("admin_members").select("role").eq("user_id", userId).maybeSingle();
  if (!target) throw new Error("Member not found.");
  const targetRole = target.role as AdminRole;
  if (!canManageTargetRole(actor.role, targetRole)) throw new Error("You can't remove that member.");
  if (isLastOwner(targetRole, await activeRoles(sb))) throw new Error("You can't remove the last owner.");

  // Remove from the team; also drop the coarse profiles.role so the auth gate
  // stops granting access. (The auth user itself is left intact.)
  const { error } = await sb.from("admin_members").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
  await sb.from("profiles").update({ role: "user" }).eq("id", userId);
  await audit(sb, actor.id, "team.member_removed", userId, { role: targetRole });
  revalidatePath("/admin/team");
}

export async function revokeInvite(invitationId: string): Promise<void> {
  const actor = await requirePermission("team.manage");
  const id = z.string().uuid().parse(invitationId);
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("admin_invitations").update({ status: "revoked" }).eq("id", id).eq("status", "pending");
  if (error) throw new Error(error.message);
  await audit(sb, actor.id, "team.invite_revoked", null, { invitationId: id });
  revalidatePath("/admin/team");
}

export async function resendInvite(invitationId: string): Promise<InviteResult> {
  const actor = await requirePermission("team.manage");
  const id = z.string().uuid().parse(invitationId);
  const sb = createSupabaseAdminClient();
  const { data: inv } = await sb
    .from("admin_invitations")
    .select("email,role,status")
    .eq("id", id)
    .maybeSingle();
  if (!inv || inv.status !== "pending") throw new Error("Invitation is no longer pending.");

  const email = inv.email as string;
  const roleLabel = ROLE_LABELS[inv.role as AdminRole] ?? (inv.role as string);
  const origin = await originFromHeaders();

  // Extend the expiry regardless of whether an email can actually be sent.
  await sb
    .from("admin_invitations")
    .update({ expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString() })
    .eq("id", id);

  // Existing account → no email possible; say so rather than reporting "resent".
  if (await findAuthUserByEmail(email)) {
    await audit(sb, actor.id, "team.invite_resent", null, {
      invitationId: id,
      emailed: false,
      reason: "existing_account",
    });
    revalidatePath("/admin/team");
    return {
      outcome: "existing_account",
      message: existingAccountMessage(email, origin, roleLabel),
    };
  }

  const { error } = await sb.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/admin/auth/callback`,
  });
  if (error) throw new Error(`Couldn't send the invite email: ${error.message}`);
  await audit(sb, actor.id, "team.invite_resent", null, { invitationId: id, emailed: true });
  revalidatePath("/admin/team");
  return { outcome: "emailed", message: `Invitation email re-sent to ${email}.` };
}
