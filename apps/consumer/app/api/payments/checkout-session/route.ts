import { NextResponse } from "next/server";
import {
  findActiveEntitlement,
  isUuid,
  paymentError,
} from "@/app/api/payments/_lib/entitlements";
import {
  getStripeClient,
  getStripePriceId,
} from "@/lib/payments/stripe-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Opens an embedded Stripe Checkout Session for one report unlock.
 *
 * The only thing the client sends is which assessment it wants — the price is
 * resolved from `STRIPE_PRICE_ID` on this side, so a tampered request cannot
 * change what is charged. Ownership of the assessment row is verified before
 * a session is created, and an existing entitlement short-circuits with 409
 * so nobody is charged twice for the same report.
 *
 * Contract: docs/STRIPE_CONTRACTS.md.
 */

interface CheckoutSessionBody {
  assessmentId: string;
}

function parseBody(json: unknown): CheckoutSessionBody | null {
  if (!json || typeof json !== "object") return null;
  const { assessmentId } = json as Record<string, unknown>;
  if (!isUuid(assessmentId)) return null;
  return { assessmentId };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return paymentError("not_authenticated", 401);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return paymentError("invalid_json", 400);
  }
  const body = parseBody(json);
  if (!body) {
    return paymentError("invalid_body", 400);
  }

  const admin = createSupabaseAdminClient();

  // Ownership. A missing row and someone else's row both answer 403: the
  // caller is equally not entitled to buy against either, and a distinct 404
  // would confirm which assessment ids exist.
  const owner = await admin
    .from("assessments")
    .select("id, user_id")
    .eq("id", body.assessmentId)
    .maybeSingle();
  if (owner.error) {
    console.error(
      "[payments/checkout-session] Assessment lookup failed",
      owner.error,
    );
    return paymentError("assessment_lookup_failed", 500);
  }
  if (!owner.data || owner.data.user_id !== user.id) {
    return paymentError("forbidden", 403);
  }

  const existing = await findActiveEntitlement(
    admin,
    user.id,
    body.assessmentId,
  );
  if (!existing.ok) {
    // Fail closed. Treating an unreadable entitlement table as "not owned"
    // would send an already-paying user back through checkout.
    console.error(
      "[payments/checkout-session] Entitlement lookup failed",
      existing.message,
    );
    return paymentError("entitlement_lookup_failed", 500);
  }
  if (existing.entitlement) {
    return paymentError("already_owned", 409);
  }

  let clientSecret: string | null;
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      // No `return_url`: the embedded component reports completion through
      // its own event and the client then re-reads /api/payments/entitlement.
      // Stripe only allows the URL to be omitted when redirect is disabled.
      redirect_on_completion: "never",
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      client_reference_id: body.assessmentId,
      // The webhook's only link back to our records — it is signed by Stripe
      // and echoed verbatim on `checkout.session.completed`.
      metadata: { user_id: user.id, assessment_id: body.assessmentId },
      ...(user.email ? { customer_email: user.email } : {}),
    });
    clientSecret = session.client_secret;
  } catch (error) {
    // Stripe error messages are safe to log (they never contain the secret
    // key) but are not safe to echo to the client, which would leak account
    // and price configuration detail.
    console.error(
      "[payments/checkout-session] Stripe session creation failed",
      error,
    );
    return paymentError("checkout_unavailable", 502);
  }

  if (!clientSecret) {
    // Embedded sessions always carry one; if that ever changes, surface it
    // rather than handing the client an unusable `null`.
    console.error(
      "[payments/checkout-session] Stripe returned a session without a client secret",
    );
    return paymentError("checkout_unavailable", 502);
  }

  return NextResponse.json({ clientSecret });
}
