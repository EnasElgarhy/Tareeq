import { NextResponse } from "next/server";
import { deleteAccount, isRecentSignIn, type DeleteAccountResult } from "@/lib/account/delete-account";
import { createRateLimiter } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const limiter = createRateLimiter({ limit: ATTEMPT_LIMIT, windowMs: ATTEMPT_WINDOW_MS });

const FAILURE_STATUS: Record<Exclude<DeleteAccountResult, { ok: true }>["reason"], number> = {
  admin_account: 409,
  check_failed: 503,
  delete_failed: 500,
};

/**
 * POST /api/account/delete
 *
 * Permanently deletes the signed-in student's own account. The route takes
 * no input: the account is always the caller's. It only runs when the
 * emailed code was confirmed in the last few minutes, so an open, unattended
 * session cannot be used to delete an account.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  if (limiter.isLimited(user.id)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }
  if (!isRecentSignIn(user.last_sign_in_at)) {
    return NextResponse.json({ error: "confirm_required" }, { status: 403 });
  }

  const result = await deleteAccount(createSupabaseAdminClient(), user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: FAILURE_STATUS[result.reason] });
  }

  try {
    // Clears the session cookies; the account behind them is already gone.
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[account] Clearing the session failed", error instanceof Error ? error.message : error);
  }
  return NextResponse.json({ deleted: true });
}
