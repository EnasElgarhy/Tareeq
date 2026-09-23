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
 * Stripe webhook receiver — the writer of *paid* `report_entitlements`.
 * (Free grants are written by `redeem_report_access_invite`; this handler
 * reconciles with those rows but never deletes them.)
 *
 * Three rules govern everything below.
 *
 * 1. **Trust nothing until the signature verifies.** The raw request body is
 *    read with `request.text()` (any parsing would change the bytes and break
 *    the HMAC) and passed straight to `constructEvent`.
 * 2. **Idempotency is enforced by the database, not by bookkeeping here.**
 *    Stripe retries on any non-2xx and can deliver the same event more than
 *    once even on success. Grants insert with `ON CONFLICT (stripe_session_id)
 *    DO NOTHING` and reconcile a `(user_id, assessment_id)` conflict by row
 *    state (reactivate, upgrade a free grant, or acknowledge a genuinely
 *    different paid transaction); revocations filter on `status = 'active'`.
 *    Replaying any event any number of times therefore lands on the same row
 *    state.
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
 * A completed payment must always be recorded — even when an admin-grant
 * redemption created the entitlement first (the redemption wins that race and
 * the session insert fails on the `(user_id, assessment_id)` key). The
 * conflicting row is therefore read and reconciled by state:
 *
 * - revoked (any source) → reactivated as paid;
 * - active `admin_grant` → upgraded to paid, keeping `granted_by` /
 *   `granted_invite_id` as first-touch provenance;
 * - active `stripe` with the same session → replay, no write;
 * - active `stripe` with a different session → a genuinely different paid
 *   transaction: never overwritten, acknowledged for manual reconciliation.
 *
 * Idempotency: replays land on `duplicate_session` (same session key) or on
 * the already-reconciled row (same upgrade outcome). Conditional updates
 * (`status`/`source` in the filter) make concurrent redeliveries safe: a
 * branch that no longer matches updates zero rows, which is answered 500 so
 * Stripe redelivers into the now-current state.
 *
 * @throws when the write fails for any reason other than a reconciled
 *   conflict, so the caller can answer 500 and let Stripe redeliver.
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
        source: "stripe",
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
  // a row — an admin grant that won the race, a revoked row awaiting a
  // repurchase, or an earlier paid transaction.
  const { data: existing, error: readError } = await admin
    .from(ENTITLEMENTS_TABLE)
    .select("id,status,source,stripe_session_id")
    .eq("user_id", userId)
    .eq("assessment_id", assessmentId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Entitlement conflict lookup failed: ${readError.message}`);
  }
  if (!existing) {
    // Only possible if the row was deleted between the conflict and this
    // read. Redelivery re-runs the fast path cleanly — do not invent a row.
    throw new Error(
      `Conflicting entitlement for user ${userId}, assessment ${assessmentId} vanished mid-reconciliation.`,
    );
  }

  const row = existing as {
    id: string;
    status: string;
    source: string | null;
    stripe_session_id: string | null;
  };

  // A paid upgrade always carries the full Stripe record. `granted_by` and
  // `granted_invite_id` are deliberately untouched: they are first-touch
  // provenance (who granted free access first), while `source` names the
  // current paid truth. A completed payment is therefore never represented
  // only as `admin_grant`, and the grant audit trail survives reconciliation.
  const paidUpgrade = {
    status: "active",
    revoked_at: null,
    source: "stripe",
    ...purchase,
  };

  if (row.status === "revoked") {
    const reactivated = await admin
      .from(ENTITLEMENTS_TABLE)
      .update(paidUpgrade)
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
      throw new Error(
        `Entitlement for user ${userId}, assessment ${assessmentId} changed state mid-reconciliation.`,
      );
    }
    return "reactivated";
  }

  if (row.source === "admin_grant") {
    const upgraded = await admin
      .from(ENTITLEMENTS_TABLE)
      .update(paidUpgrade)
      .eq("user_id", userId)
      .eq("assessment_id", assessmentId)
      .eq("status", "active")
      .eq("source", "admin_grant")
      .select("id");
    if (upgraded.error) {
      throw new Error(
        `Entitlement paid upgrade failed: ${upgraded.error.message}`,
      );
    }
    if (!upgraded.data || upgraded.data.length === 0) {
      throw new Error(
        `Entitlement for user ${userId}, assessment ${assessmentId} changed state mid-reconciliation.`,
      );
    }
    return "upgraded_to_paid";
  }

  if (row.stripe_session_id === session.id) {
    // Defensive: the session-keyed fast path normally catches replays, so
    // reaching here with the same session means the row was rewritten
    // between the two reads. Nothing to record.
    return "duplicate_session";
  }

  // A different, still-active paid transaction owns this report. Overwriting
  // its identifiers with the new session would corrupt the payment record
  // (and the invoice it points to). Acknowledge so Stripe stops retrying —
  // retries can never resolve a double charge — and surface it for a manual
  // refund instead of letting it pass silently.
  console.warn(
    `[payments/webhook] Session ${session.id} paid for an already-active paid entitlement (user ${userId}, assessment ${assessmentId}, existing session ${row.stripe_session_id}); possible duplicate charge.`,
  );
  return "conflicting_paid_transaction";
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
