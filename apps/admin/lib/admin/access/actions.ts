"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken } from "@/lib/admin/access/invite-token";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const grantSchema = z.object({
  userId: z.string().uuid(),
  assessmentId: z.string().uuid(),
});

function consumerOrigin(): string {
  const fromEnv =
    process.env.CONSUMER_ORIGIN ??
    process.env.NEXT_PUBLIC_CONSUMER_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, "");
  // Staging fallback so a missing env never produces a broken admin link.
  return "https://staging.tareek.me";
}

type Sb = ReturnType<typeof createSupabaseAdminClient>;

async function audit(
  sb: Sb,
  actorId: string,
  action: string,
  targetId: string | null,
  metadata: Record<string, unknown>,
) {
  // Best-effort — never let audit failure block the operation.
  await sb.from("admin_audit_log").insert({
    actor_user_id: actorId,
    action,
    target_user_id: targetId,
    metadata,
  });
}

export interface ReportInviteResult {
  /** Full consumer link to share with the student (shown once). */
  link: string;
  expiresAt: string;
  /** True when the student already had active access — no new invite minted. */
  alreadyOwned: boolean;
}

/**
 * Mint a single-use free-access invite for one (user, assessment) pair.
 *
 * Gated by `users.manage`. Verifies the assessment belongs to the user and is
 * complete, and that no active entitlement already exists — in which case the
 * existing access is reported instead of minting a redundant invite.
 */
export async function createReportInvite(
  userId: string,
  assessmentId: string,
): Promise<ReportInviteResult> {
  const actor = await requirePermission("users.manage");
  const input = grantSchema.parse({ userId, assessmentId });
  const sb = createSupabaseAdminClient();

  // The assessment must belong to the grantee and be complete — a free grant
  // unlocks a finished report, never an in-progress attempt.
  const { data: asmt, error: asmtErr } = await sb
    .from("assessments")
    .select("id,user_id,completed_at")
    .eq("id", input.assessmentId)
    .maybeSingle();
  if (asmtErr) throw new Error(asmtErr.message);
  if (!asmt) throw new Error("Assessment not found.");
  if ((asmt.user_id as string | null) !== input.userId) {
    throw new Error("That assessment does not belong to this student.");
  }
  if (!asmt.completed_at) {
    throw new Error("Only a completed assessment can be unlocked.");
  }

  // Already unlocked → report it instead of minting a redundant invite.
  const { data: existing, error: entErr } = await sb
    .from("report_entitlements")
    .select("id")
    .eq("user_id", input.userId)
    .eq("assessment_id", input.assessmentId)
    .eq("status", "active")
    .maybeSingle();
  if (entErr) throw new Error(entErr.message);
  if (existing) {
    return { link: "", expiresAt: "", alreadyOwned: true };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  const { data: inserted, error: invErr } = await sb
    .from("report_access_invites")
    .insert({
      token_hash: hashInviteToken(token),
      user_id: input.userId,
      assessment_id: input.assessmentId,
      created_by: actor.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (invErr) throw new Error(invErr.message);

  await audit(sb, actor.id, "report_access.invite_created", input.userId, {
    assessmentId: input.assessmentId,
    inviteId: (inserted as { id: string }).id,
  });
  revalidatePath(`/admin/users/${input.userId}`);

  return {
    link: `${consumerOrigin()}/invite/${token}`,
    expiresAt,
    alreadyOwned: false,
  };
}

export type InviteKind = "free" | "paid";

const kindSchema = z.enum(["free", "paid"]);

export interface ReportInviteRow {
  id: string;
  assessmentId: string | null;
  email: string | null;
  kind: InviteKind;
  expiresAt: string;
  redeemedAt: string | null;
  status: "pending" | "redeemed" | "revoked";
}

/** Pending + recently-resolved bound invites for one student (admin view). */
export async function listReportInvites(
  userId: string,
): Promise<ReportInviteRow[]> {
  await requirePermission("users.manage");
  const id = z.string().uuid().parse(userId);
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("report_access_invites")
    .select("id,assessment_id,email,kind,expires_at,redeemed_at,status")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    assessmentId: r.assessment_id ? String(r.assessment_id) : null,
    email: typeof r.email === "string" ? r.email : null,
    kind: r.kind === "paid" ? "paid" : "free",
    expiresAt: String(r.expires_at),
    redeemedAt: r.redeemed_at ? String(r.redeemed_at) : null,
    status: (r.status as ReportInviteRow["status"]) ?? "pending",
  }));
}

/**
 * Mint an email-bound invite for someone who may not have signed up yet. The
 * link works once they authenticate with this exact address. `free` unlocks
 * their latest completed assessment without payment; `paid` grants nothing
 * and routes them into the normal take-and-pay flow instead.
 */
export async function createEmailInvite(
  email: string,
  kind: string = "free",
): Promise<ReportInviteResult> {
  const actor = await requirePermission("users.manage");
  const address = z.string().trim().toLowerCase().email().max(320).parse(email);
  const inviteKind = kindSchema.parse(kind);
  const sb = createSupabaseAdminClient();

  // One pending invite per address: the full link is shown only at creation,
  // so a second row would orphan the first beyond revocation.
  const { data: pending, error: readErr } = await sb
    .from("report_access_invites")
    .select("id")
    .eq("email", address)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (pending) {
    throw new Error(
      `${address} already has a pending invite. Revoke it first to issue a new link.`,
    );
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  const { data: inserted, error: invErr } = await sb
    .from("report_access_invites")
    .insert({
      token_hash: hashInviteToken(token),
      user_id: null,
      assessment_id: null,
      email: address,
      kind: inviteKind,
      created_by: actor.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (invErr) throw new Error(invErr.message);

  await audit(sb, actor.id, "report_access.email_invite_created", null, {
    email: address,
    kind: inviteKind,
    inviteId: (inserted as { id: string }).id,
  });

  return {
    link: `${consumerOrigin()}/invite/${token}`,
    expiresAt,
    alreadyOwned: false,
  };
}

/** Recent email-bound invites across students (admin view). */
export async function listEmailInvites(): Promise<ReportInviteRow[]> {
  await requirePermission("users.manage");
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("report_access_invites")
    .select("id,assessment_id,email,kind,expires_at,redeemed_at,status")
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    assessmentId: r.assessment_id ? String(r.assessment_id) : null,
    email: typeof r.email === "string" ? r.email : null,
    kind: r.kind === "paid" ? "paid" : "free",
    expiresAt: String(r.expires_at),
    redeemedAt: r.redeemed_at ? String(r.redeemed_at) : null,
    status: (r.status as ReportInviteRow["status"]) ?? "pending",
  }));
}

export async function revokeReportInvite(invitationId: string): Promise<void> {
  const actor = await requirePermission("users.manage");
  const id = z.string().uuid().parse(invitationId);
  const sb = createSupabaseAdminClient();
  const { data: inv, error: readErr } = await sb
    .from("report_access_invites")
    .select("id,user_id,status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!inv) throw new Error("Invitation not found.");
  if ((inv.status as string) !== "pending") {
    throw new Error("Only a pending invitation can be revoked.");
  }
  const { error } = await sb
    .from("report_access_invites")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  await audit(
    sb,
    actor.id,
    "report_access.invite_revoked",
    (inv.user_id as string) ?? null,
    {
      invitationId: id,
    },
  );
  if (typeof inv.user_id === "string")
    revalidatePath(`/admin/users/${inv.user_id}`);
}
