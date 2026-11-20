import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Deleting an account: immediate and permanent (decided 20 Nov 2026).
 *
 * What goes: the sign-in record and, through the database's own cascades,
 * the profile, consent records, Kai threads and messages, parent payment
 * links and report access. The student's attempts are deleted here first,
 * because the database would otherwise keep them with the owner blanked,
 * and each attempt takes its answers, result and report with it.
 *
 * What stays: receipts and invoices, which Stripe holds as the payment
 * record. Nothing about the payment is kept on our side.
 */

/** How recently the emailed code must have been confirmed. */
export const RECENT_SIGN_IN_MS = 10 * 60 * 1000;

export function isRecentSignIn(lastSignInAt: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSignInAt) return false;
  const signedInAt = Date.parse(lastSignInAt);
  if (Number.isNaN(signedInAt)) return false;
  return now - signedInAt <= RECENT_SIGN_IN_MS;
}

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: "admin_account" | "check_failed" | "delete_failed" };

export async function deleteAccount(admin: SupabaseClient, userId: string): Promise<DeleteAccountResult> {
  // An admin's sign-in also opens the admin site; it is never removed from here.
  const member = await admin.from("admin_members").select("user_id").eq("user_id", userId).maybeSingle();
  if (member.error) {
    console.error("[account] Admin check failed", member.error.message);
    return { ok: false, reason: "check_failed" };
  }
  if (member.data) return { ok: false, reason: "admin_account" };

  const attempts = await admin.from("assessments").delete().eq("user_id", userId);
  if (attempts.error) {
    console.error("[account] Deleting attempts failed", attempts.error.message);
    return { ok: false, reason: "delete_failed" };
  }

  // The retired accounts table held a name and email. It may not exist in
  // every database, so a failure here is logged and does not stop the deletion.
  const legacy = await admin.from("user_accounts").delete().eq("auth_user_id", userId);
  if (legacy.error) console.error("[account] Old accounts table not cleaned", legacy.error.message);

  const removed = await admin.auth.admin.deleteUser(userId);
  if (removed.error) {
    console.error("[account] Deleting the sign-in record failed", removed.error.message);
    return { ok: false, reason: "delete_failed" };
  }
  return { ok: true };
}
