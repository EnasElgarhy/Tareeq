import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  ENTITLEMENTS_TABLE,
  paymentError,
} from "@/app/api/payments/_lib/entitlements";
import { getStripeClient } from "@/lib/payments/stripe-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/payments/history
 *
 * The authenticated user's payment history, for the Payments & Invoices page.
 *
 * The route takes no client input at all — no payment id, no assessment id,
 * nothing. Every row is read with `user_id = auth.getUser().id`, so a caller
 * can only ever see their own purchases. Stripe document URLs are resolved
 * here from ids stored on those same rows (`stripe_session_id` /
 * `stripe_payment_intent_id`), and only the resulting hosted URL is returned.
 * Stripe's own ids never cross the wire in either direction.
 *
 * URL priority, per the frozen contract:
 *   1. If the Checkout Session has an Invoice → `invoice.hosted_invoice_url`.
 *   2. Otherwise → the PaymentIntent's charge → `charge.receipt_url`.
 * Nothing is constructed manually; if Stripe does not hand us a URL, the
 * purchase still appears with `documentUrl: null` and the UI hides the action.
 */

type PurchaseStatus = "paid" | "refunded";

interface PurchaseRecord {
  id: string;
  /** One product today; kept extensible for subscriptions/renewals later. */
  kind: "report_unlock";
  status: PurchaseStatus;
  /** 'paid' for Stripe purchases, 'free' for admin-granted access. */
  source: "paid" | "free";
  amountMinor: number | null;
  currency: string | null;
  paidAt: string;
  documentUrl: string | null;
}

interface HistoryRow {
  id: unknown;
  status: unknown;
  source: unknown;
  amount_minor: unknown;
  currency: unknown;
  created_at: unknown;
  stripe_session_id: unknown;
  stripe_payment_intent_id: unknown;
}

/** Stripe fields are `string | <expanded object> | null`; read both shapes. */
function toStripeId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const { id } = value as { id: unknown };
    if (typeof id === "string") return id;
  }
  return null;
}

/** The hosted receipt for a paid charge, if Stripe generated one. */
async function receiptUrlForPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
): Promise<string | null> {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  const charge = intent.latest_charge;
  if (
    charge &&
    typeof charge !== "string" &&
    typeof charge.receipt_url === "string" &&
    charge.receipt_url.length > 0
  ) {
    return charge.receipt_url;
  }
  return null;
}

/**
 * Resolves the Stripe-hosted invoice/receipt URL for one purchase row.
 * A missing or unreadable document is not an error for the list: the
 * purchase still appears, only the "View invoice" action is hidden.
 */
async function resolveStripeDocumentUrl(
  stripe: Stripe,
  row: HistoryRow,
): Promise<string | null> {
  try {
    const sessionId =
      typeof row.stripe_session_id === "string" ? row.stripe_session_id : null;
    const storedIntentId =
      typeof row.stripe_payment_intent_id === "string"
        ? row.stripe_payment_intent_id
        : null;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // 1. Invoice-backed payments (subscriptions, invoice-created sessions).
      const invoiceId = toStripeId(session.invoice);
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        if (
          typeof invoice.hosted_invoice_url === "string" &&
          invoice.hosted_invoice_url.length > 0
        ) {
          return invoice.hosted_invoice_url;
        }
      }

      // 2. One-time Checkout without an invoice → the charge's receipt.
      const intentId = toStripeId(session.payment_intent) ?? storedIntentId;
      if (intentId) return await receiptUrlForPaymentIntent(stripe, intentId);
    }

    if (storedIntentId) {
      return await receiptUrlForPaymentIntent(stripe, storedIntentId);
    }
  } catch (error) {
    // A deleted session, an expired object, or a transient Stripe fault: the
    // history list is still valid without the document action.
    console.error(
      "[payments/history] Stripe document lookup failed",
      error instanceof Error ? error.message : error,
    );
  }
  return null;
}

function basePurchaseRecord(
  row: HistoryRow,
): Omit<PurchaseRecord, "documentUrl"> {
  return {
    id: String(row.id),
    kind: "report_unlock",
    status: row.status === "revoked" ? "refunded" : "paid",
    source: row.source === "admin_grant" ? "free" : "paid",
    amountMinor: typeof row.amount_minor === "number" ? row.amount_minor : null,
    currency: typeof row.currency === "string" ? row.currency : null,
    paidAt: String(row.created_at),
  };
}

async function toPurchaseRecord(
  stripe: Stripe,
  row: HistoryRow,
): Promise<PurchaseRecord> {
  const base = basePurchaseRecord(row);
  // Free grants have no Stripe objects behind them — no lookup to perform.
  if (base.source === "free") return { ...base, documentUrl: null };
  const documentUrl = await resolveStripeDocumentUrl(stripe, row);
  return { ...base, documentUrl };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return paymentError("not_authenticated", 401);
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from(ENTITLEMENTS_TABLE)
    .select(
      "id, status, source, amount_minor, currency, created_at, stripe_session_id, stripe_payment_intent_id",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[payments/history] Payment history lookup failed",
      error,
    );
    return paymentError("history_unavailable", 500);
  }

  const rows = (data ?? []) as unknown as HistoryRow[];

  // Free grants carry no Stripe objects, so a free-only list never initializes
  // the Stripe client at all. Pre-migration rows have source='stripe' (or a
  // null select when the column is missing) and keep the old behavior.
  const needsStripe = rows.some((row) => row.source !== "admin_grant");
  let stripe: Stripe | null = null;
  if (needsStripe) {
    try {
      stripe = getStripeClient();
    } catch (stripeError) {
      // Stripe is not configured (e.g. a preview build). The purchases are
      // still shown; only the hosted document actions are missing.
      console.error("[payments/history] Stripe is not configured", stripeError);
    }
  }

  const purchases: PurchaseRecord[] = stripe
    ? await Promise.all(rows.map((row) => toPurchaseRecord(stripe, row)))
    : rows.map((row) => ({ ...basePurchaseRecord(row), documentUrl: null }));

  return NextResponse.json({ purchases });
}
