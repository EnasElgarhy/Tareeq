import { NextResponse } from "next/server";
import {
  findActiveEntitlement,
  isUuid,
  paymentError,
} from "@/app/api/payments/_lib/entitlements";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * The single source of truth for whether a report is unlocked.
 *
 * The browser's `localStorage` copy is a cache; this route is what decides.
 * It answers only about the caller's own entitlements — `user_id` is taken
 * from the session cookie, never from the query string.
 *
 * Contract: docs/STRIPE_CONTRACTS.md.
 */

export interface EntitlementResponse {
  status: "active" | "none";
  unlockedAt?: string;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return paymentError("not_authenticated", 401);
  }

  const assessmentId = new URL(request.url).searchParams.get("assessmentId");
  if (!isUuid(assessmentId)) {
    return paymentError("invalid_assessment_id", 400);
  }

  const admin = createSupabaseAdminClient();
  const lookup = await findActiveEntitlement(admin, user.id, assessmentId);
  if (!lookup.ok) {
    // Never downgrade a database fault into `status: "none"` — that would
    // lock a paying user out of a report they own and look like a legitimate
    // answer to the client.
    console.error(
      "[payments/entitlement] Entitlement lookup failed",
      lookup.message,
    );
    return paymentError("entitlement_lookup_failed", 500);
  }

  const body: EntitlementResponse = lookup.entitlement
    ? { status: "active", unlockedAt: lookup.entitlement.createdAt }
    : { status: "none" };

  return NextResponse.json(body);
}
