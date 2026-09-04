import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ENTITLEMENTS_TABLE,
  isUuid,
} from "@/app/api/payments/_lib/entitlements";
import {
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/payments/stripe-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Stripe webhook receiver — the only writer of `report_entitlements`.
 *
 * Three rules govern everything below.
 *
 * 1. **Trust nothing until the signature verifies.** The raw request body is
 *    read with `request.text()` (any parsing would change the bytes and break
 *    the HMAC) and passed straight to `constructEvent`.
 * 2. **Idempotency is enforced by the database, not by bookkeeping here.**
 *    Stripe retries on any non-2xx and can deliver the same event more than
 *    once even on success. Grants insert with `ON CONFLICT (stripe_session_id)
 *    DO NOTHING`; revocations filter on `status = 'active'`. Replaying any
 *    event any number of times therefore lands on the same row state.
 * 3. **Ignored is a success; failed is not.** An event type we do not handle,
 *    or one that is not ours, returns 200 so Stripe stops retrying. A database
 *    fault while handling an event we *do* care about returns 500 so Stripe
 *    retries — a paid customer with no entitlement must not be papered over.
 *
 * Contract: docs/STRIPE_CONTRACTS.md.
 */

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Stripe fields are `string | <expanded object> | null` depending on whether
 * the object was expanded. We never expand, but read both shapes defensively.
 */
function toStripeId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const { id } = value as { id: unknown };
    if (typeof id === "string") return id;
  }
  return null;
}

/**
 * Grants the entitlement for a completed, paid Checkout Session.
 *
 * Idempotency: `stripe_session_id` is unique, and the insert resolves a
 * conflict on it by doing nothing. PostgREST returns the rows it actually
 * inserted, so an empty result is precisely "we have seen this session
 * before" — no read-then-write race, the database decides.
 *
 * @throws when the write fails for any reason other than a known conflict,
 *   so the caller can answer 500 and let Stripe redeliver.
 */
async function grantEntitlement(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<string> {
  if (session.payment_status !== "paid") {
    // Async payment methods complete later via `checkout.session.async_
    // payment_succeeded`; a `no_payment_required` session was never charged.
    return "ignored_unpaid";
  }

  const userId = session.metadata?.user_id;
  const assessmentId =
    session.metadata?.assessment_id ?? session.client_reference_id;

  if (!isUuid(userId) || !isUuid(assessmentId)) {
    // Not a session this app created (or one created before the metadata
    // contract existed). Retrying cannot fix it, so acknowledge and move on.
    console.warn(
      `[payments/webhook] Session ${session.id} has no usable user_id/assessment_id metadata; ignoring.`,
    );
    return "ignored_unrecognized";
  }

  const paymentIntentId = toStripeId(session.payment_intent);
  const purchase = {
    stripe_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    amount_minor: session.amount_total,
    currency: session.currency,
  };

  const { data, error } = await admin
    .from(ENTITLEMENTS_TABLE)
    .upsert(
      {
        user_id: userId,
        assessment_id: assessmentId,
        status: "active",
        ...purchase,
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    )
    .select("id");

  if (!error) {
    return data && data.length > 0 ? "granted" : "duplicate_session";
  }

  if (error.code !== UNIQUE_VIOLATION) {
    throw new Error(`Entitlement insert failed: ${error.message}`);
  }

  // The other unique constraint fired: `(user_id, assessment_id)` already has
  // a row from an earlier purchase of this same report. If that row was
  // revoked (refund, then a repurchase) bring it back and attach the new
  // payment. If it is still active the customer already owns the report and
  // there is nothing to do — which also makes this branch replay-safe.
  const reactivated = await admin
    .from(ENTITLEMENTS_TABLE)
    .update({ status: "active", revoked_at: null, ...purchase })
    .eq("user_id", userId)
    .eq("assessment_id", assessmentId)
    .eq("status", "revoked")
    .select("id");

  if (reactivated.error) {
    throw new Error(
      `Entitlement reactivation failed: ${reactivated.error.message}`,
    );
  }
  if (!reactivated.data || reactivated.data.length === 0) {
    // Still active under an earlier session, so this is a second successful
    // charge for a report the customer already owned. The 409 in
    // /checkout-session normally prevents it; surface it for a manual refund
    // rather than letting a double charge pass silently.
    console.warn(
      `[payments/webhook] Session ${session.id} paid for an already-active entitlement (user ${userId}, assessment ${assessmentId}); possible duplicate charge.`,
    );
  }
  return reactivated.data && reactivated.data.length > 0
    ? "reactivated"
    : "already_active";
}

/**
 * Revokes every active entitlement bought with a given payment intent.
 *
 * Idempotency: the `status = 'active'` filter means a redelivered refund or a
 * dispute that follows a refund updates zero rows and still succeeds. The
 * `revoked_at` timestamp is therefore only ever written once.
 *
 * @throws on a database fault, so the caller can answer 500.
 */
async function revokeByPaymentIntent(
  admin: SupabaseClient,
  paymentIntentId: string | null,
  reason: string,
): Promise<string> {
  if (!paymentIntentId) {
    console.warn(
      `[payments/webhook] ${reason} arrived without a payment intent; nothing to revoke.`,
    );
    return "ignored_no_payment_intent";
  }

  const { data, error } = await admin
    .from(ENTITLEMENTS_TABLE)
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "active")
    .select("id");

  if (error) {
    throw new Error(`Entitlement revocation failed: ${error.message}`);
  }
  // Zero rows is normal: a charge unrelated to a report, or an already-
  // revoked entitlement being told a second time.
  return data && data.length > 0
    ? `revoked_${data.length}`
    : "nothing_to_revoke";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let stripe: Stripe;
  let webhookSecret: string;
  try {
    stripe = getStripeClient();
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    // Misconfiguration on our side, not a bad request. 500 keeps Stripe
    // retrying, so events are not lost while the secret is being set.
    console.error("[payments/webhook] Stripe is not configured", error);
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Must be the untouched bytes — the signature covers the exact payload.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(
      "[payments/webhook] Signature verification failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    let outcome: string;
    switch (event.type) {
      case "checkout.session.completed":
        outcome = await grantEntitlement(admin, event.data.object);
        break;
      case "charge.refunded":
        // Fires for partial refunds too. Per the frozen contract any refund
        // on the charge revokes access; a partial refund of a single-item
        // one-time purchase is not a case this product supports.
        outcome = await revokeByPaymentIntent(
          admin,
          toStripeId(event.data.object.payment_intent),
          event.type,
        );
        break;
      case "charge.dispute.created":
        outcome = await revokeByPaymentIntent(
          admin,
          toStripeId(event.data.object.payment_intent),
          event.type,
        );
        break;
      default:
        // Every other event type is acknowledged untouched. Stripe accounts
        // emit far more than the three types above, and a 500 here would
        // put unrelated events into an endless retry loop.
        outcome = "ignored_event_type";
        break;
    }
    return NextResponse.json({ received: true, outcome });
  } catch (error) {
    // A handled event that could not be recorded. 500 asks Stripe to
    // redeliver; the handlers above make that redelivery safe.
    console.error(
      `[payments/webhook] Failed to process ${event.type} (${event.id})`,
      error,
    );
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
