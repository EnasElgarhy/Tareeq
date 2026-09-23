import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helpers shared by the three payment route handlers. Not a route itself:
 * Next only maps `route.ts` files, and the `_lib` prefix marks the folder
 * private so it can never be mistaken for one.
 */

export const ENTITLEMENTS_TABLE = "report_entitlements";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guards every id before it reaches Postgres. `assessments.id` and
 * `auth.users.id` are `uuid` columns, so a malformed value would come back as
 * a Postgres cast error (22P02) that reads like an internal fault instead of
 * the client error it is — and, in the webhook, would be retried forever.
 */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Payment errors are returned as stable machine-readable codes rather than
 * prose, matching the one code the frozen contract names (`already_owned`).
 * The client branches on these; it must never have to parse a sentence.
 */
export function paymentError(code: string, status: number): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

export interface ActiveEntitlement {
  id: string;
  /** `created_at` — when the report was unlocked. */
  createdAt: string;
}

export type EntitlementLookup =
  | { ok: true; entitlement: ActiveEntitlement | null }
  | { ok: false; message: string };

/**
 * Looks up the caller's active entitlement for one assessment.
 *
 * Deliberately explicit about `user_id` rather than leaning on RLS: this runs
 * on the service-role client, so ownership is enforced here by the filter.
 * Using the service role (instead of the user-scoped client) means an unlock
 * cannot silently disappear because a row-level policy was written slightly
 * differently — a paid user locked out of their report is the worst failure
 * mode this route has.
 *
 * Returns `ok: false` on a database fault instead of a null entitlement, so
 * callers can answer 500 rather than reporting a paid report as unowned.
 */
export async function findActiveEntitlement(
  admin: SupabaseClient,
  userId: string,
  assessmentId: string,
): Promise<EntitlementLookup> {
  const { data, error } = await admin
    .from(ENTITLEMENTS_TABLE)
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("assessment_id", assessmentId)
    .eq("status", "active")
    // `unique (user_id, assessment_id)` guarantees at most one row.
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: true, entitlement: null };

  return {
    ok: true,
    entitlement: {
      id: String(data.id),
      createdAt: String(data.created_at),
    },
  };
}

/** Why a paid surface was refused, so callers never conflate the two. */
export type PaidReportAccess =
  | { paid: true; assessmentId: string }
  | {
      paid: false;
      reason: "no_assessment" | "not_entitled" | "lookup_failed";
      message?: string;
    };

/**
 * Whether this user owns an active entitlement for their current report.
 *
 * Used by the paid surfaces outside the Compass tab (Kai chat and threads),
 * which cannot be gated by the browser alone — they spend AI credits on every
 * call. The assessment is resolved from the session's user, never from the
 * request, so a caller cannot point the check at someone else's report.
 */
export async function hasPaidReportAccess(
  admin: SupabaseClient,
  userId: string,
): Promise<PaidReportAccess> {
  const { data, error } = await admin
    .from("assessments")
    .select("id")
    .eq("user_id", userId)
    // A row only counts once it is complete; `completed_at` is null while the
    // visitor is still answering, and nulls sort first on a descending order.
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { paid: false, reason: "lookup_failed", message: error.message };
  if (!data) return { paid: false, reason: "no_assessment" };

  const assessmentId = String(data.id);
  const lookup = await findActiveEntitlement(admin, userId, assessmentId);
  if (!lookup.ok) {
    return { paid: false, reason: "lookup_failed", message: lookup.message };
  }

  return lookup.entitlement
    ? { paid: true, assessmentId }
    : { paid: false, reason: "not_entitled" };
}

/**
 * The one response every paid route returns when the check fails.
 *
 * `upgrade_required` (402) means the answer is "not paid" — a product state,
 * so the client shows the lock rather than an error. `access_check_unavailable`
 * (503) means we could not tell, and is deliberately distinct: answering 402
 * on a database fault would tell a paying customer to buy something they
 * already own.
 */
export function paidAccessError(access: PaidReportAccess): NextResponse | null {
  if (access.paid) return null;
  if (access.reason === "lookup_failed") {
    return paymentError("access_check_unavailable", 503);
  }
  return paymentError("upgrade_required", 402);
}
