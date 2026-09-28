"use server";

import { isAdminRole } from "@/lib/admin/team/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Finalize an accepted invitation for the CURRENTLY authenticated user.
 * Called from the accept-invite page after the invited user has established a
 * session (via the Supabase invite link) and set a password. Deliberately does
 * NOT require team.manage — the invitee authorizes themselves by proving they
 * control the invited email (they're signed in as it) AND a matching pending,
 * unexpired invitation exists. Creates the admin_members row + flips
 * profiles.role so the auth gate grants access.
 */
export async function finalizeInvite(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "You're not signed in — open the link from your invitation email." };

  const sb = createSupabaseAdminClient();
  const { data: inv, error } = await sb
    .from("admin_invitations")
    .select("id,role,status,expires_at")
    .ilike("email", user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: "Team management isn't set up yet (migration pending)." };
  if (!inv) return { ok: false, error: "No pending invitation was found for this email." };
  if (!isAdminRole(inv.role)) return { ok: false, error: "This invitation is invalid." };
  if (inv.expires_at && inv.expires_at < new Date().toISOString()) {
    await sb.from("admin_invitations").update({ status: "expired" }).eq("id", inv.id);
    return { ok: false, error: "This invitation has expired — ask an admin to resend it." };
  }

  const { error: memberErr } = await sb.from("admin_members").upsert({
    user_id: user.id,
    role: inv.role,
    status: "active",
    updated_at: new Date().toISOString(),
  });
  if (memberErr) return { ok: false, error: memberErr.message };

  // Coarse gate + defensive profile upsert (invited users get a profiles row
  // from the handle_new_user trigger, but upsert covers any gap).
  await sb.from("profiles").upsert({ id: user.id, role: "admin" });
  await sb
    .from("admin_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", inv.id);
  await sb.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "team.invite_accepted",
    target_user_id: user.id,
    metadata: { role: inv.role },
  });
  return { ok: true };
}
