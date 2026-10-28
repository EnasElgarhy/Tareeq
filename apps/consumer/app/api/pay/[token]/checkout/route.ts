import { NextResponse } from "next/server";
import { attributionLabels } from "@/lib/analytics/attribution";
import {
  findActiveEntitlement,
  paymentError,
} from "@/app/api/payments/_lib/entitlements";
import {
  PARENT_CONSENT_WORDING_VERSION,
  PARENT_LINKS_TABLE,
  findParentLinkByToken,
  isParentLinkTokenShape,
  parentLinkState,
} from "@/app/api/payments/_lib/parent-links";
import {
  getStripeClient,
  getStripeCouponId,
  getStripePriceId,
} from "@/lib/payments/stripe-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Opens the parent's embedded Stripe Checkout for one ask-a-parent link.
 *
 * The parent is not signed in: the link token is the only credential, and it
 * can only ever pay for the one (student, assessment) it was minted for. The
 * session metadata names the student, so the existing webhook grants the
 * entitlement to them; `parent_link_id` lets it mark the link paid too.
 * The guardian tick box is required here, not only in the page, and its
 * wording version is stored with the link.
 */

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { token } = await params;
  if (!isParentLinkTokenShape(token)) return paymentError("invalid_link", 404);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return paymentError("invalid_json", 400);
  }
  if (!json || typeof json !== "object" || (json as Record<string, unknown>).consent !== true) {
    return paymentError("consent_required", 400);
  }

  const admin = createSupabaseAdminClient();
  const lookup = await findParentLinkByToken(admin, token);
  if (!lookup.ok) {
    console.error("[pay/checkout] Link lookup failed", lookup.message);
    return paymentError("checkout_unavailable", 500);
  }
  const link = lookup.link;
  if (!link) return paymentError("invalid_link", 404);

  const state = parentLinkState(link);
  if (state === "paid") return paymentError("already_paid", 409);
  if (state !== "pending") return paymentError(`link_${state}`, 410);

  const existing = await findActiveEntitlement(admin, link.user_id, link.assessment_id);
  if (!existing.ok) {
    console.error("[pay/checkout] Entitlement lookup failed", existing.message);
    return paymentError("checkout_unavailable", 500);
  }
  // The student unlocked it themselves meanwhile: never charge twice.
  if (existing.entitlement) return paymentError("already_paid", 409);

  const attribution = link.attribution ?? {};
  let session: { id: string; client_secret: string | null };
  try {
    const stripe = getStripeClient();
    const couponId = getStripeCouponId();
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      client_reference_id: link.assessment_id,
      metadata: {
        user_id: link.user_id,
        assessment_id: link.assessment_id,
        parent_link_id: link.id,
        payer: "parent",
        ...attributionLabels(attribution),
      },
    });
  } catch (error) {
    console.error("[pay/checkout] Stripe session creation failed", error);
    return paymentError("checkout_unavailable", 502);
  }
  if (!session.client_secret) {
    console.error("[pay/checkout] Stripe returned a session without a client secret");
    return paymentError("checkout_unavailable", 502);
  }

  const recorded = await admin
    .from(PARENT_LINKS_TABLE)
    .update({
      consent: {
        consented_at: new Date().toISOString(),
        wording_version: PARENT_CONSENT_WORDING_VERSION,
      },
      stripe_session_id: session.id,
    })
    .eq("id", link.id);
  if (recorded.error) {
    // No consent record means no checkout: the tick box must be provable.
    console.error("[pay/checkout] Recording consent failed", recorded.error);
    return paymentError("checkout_unavailable", 500);
  }

  return NextResponse.json({ clientSecret: session.client_secret });
}
