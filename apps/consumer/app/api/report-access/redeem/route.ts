import { NextResponse } from "next/server";
import { paymentError } from "@/app/api/payments/_lib/entitlements";
import { redeemInvite } from "@/app/api/report-access/_lib/redeem";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/report-access/redeem — claim a free-access invite link.
 *
 * Body: `{ token: string }` (the raw token from `/invite/<token>`).
 * The caller must be signed in as the student the invite was minted for;
 * ownership is enforced server-side from the session, never from the body.
 * Success consumes the single-use invite and unlocks the report exactly as
 * a Stripe purchase would (same `report_entitlements` source of truth, with
 * `source: 'admin_grant'`).
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return paymentError("not_authenticated", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return paymentError("invalid_token", 400);
  }
  const token =
    body && typeof body === "object" && "token" in body
      ? (body as { token: unknown }).token
      : null;
  if (typeof token !== "string") {
    return paymentError("invalid_token", 400);
  }

  const admin = createSupabaseAdminClient();
  const result = await redeemInvite(admin, user.id, token, user.email ?? null);
  if (!result.ok) {
    // Paid invites carry their routing hint (the resolved assessment, if the
    // recipient has finished one) alongside the error code.
    if (result.code === "payment_required") {
      return NextResponse.json(
        { error: result.code, assessmentId: result.assessmentId ?? null },
        { status: result.status },
      );
    }
    return paymentError(result.code, result.status);
  }
  return NextResponse.json({
    assessmentId: result.assessmentId,
    alreadyOwned: result.alreadyOwned,
  });
}
