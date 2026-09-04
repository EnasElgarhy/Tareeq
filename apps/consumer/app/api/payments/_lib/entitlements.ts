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
