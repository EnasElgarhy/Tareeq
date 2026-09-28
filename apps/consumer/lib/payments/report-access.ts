export type ReportAccessStatus =
  | "preview"
  | "checkout"
  | "payment_pending"
  | "payment_failed"
  | "unlocked";

export interface ReportAccess {
  reportId: string;
  status: ReportAccessStatus;
  isPaid: boolean;
  paymentId?: string;
  unlockedAt?: string;
  updatedAt: string;
}

export interface ReportOffer {
  productId: string;
  name: string;
  /** What the customer pays, in minor units: the list price less the offer. */
  amountMinor: number;
  /** The full price the offer is taken from; equals `amountMinor` without one. */
  listAmountMinor: number;
  /** Whole percentage taken off the list price; 0 when there is no offer. */
  discountPercent: number;
  currency: string;
}

export type PaymentProvider = "mock" | "stripe";

export interface CheckoutSessionInput {
  reportId: string;
  assessmentId: string;
  /**
   * Used only by the mock adapter. The Stripe adapter never sends it: the
   * checkout route reads the authenticated user's email server-side, so a
   * client-supplied address could not change who is billed anyway.
   */
  email: string;
  offer: ReportOffer;
}

/**
 * The outcome of asking the server to open a checkout session.
 *
 * `already_owned` is not an error — it is the server reporting an existing
 * entitlement (a webhook that landed first, a second tab, a repeat visit).
 * The only correct response is to unlock, never to charge again.
 */
export type CheckoutSessionResult =
  | { status: "ready"; provider: PaymentProvider; clientSecret: string }
  | { status: "already_owned"; provider: PaymentProvider };

/** Identity for a server-confirmed unlock. */
export interface ConfirmPaymentInput {
  reportId: string;
  assessmentId: string;
}

export interface RestorePurchaseInput {
  reportId: string;
  /**
   * `null` while the assessment id is still being resolved. Without it the
   * server cannot be asked, and the local cache is all there is to render.
   */
  assessmentId: string | null;
}

export interface PaymentResult {
  /**
   * A local reference recorded in the access cache. The authoritative
   * payment intent lives on `report_entitlements` server-side and is never
   * exposed to the browser.
   */
  paymentId: string;
  status: "succeeded";
  /** `created_at` of the entitlement row, as reported by the server. */
  unlockedAt?: string;
}

/** AED 450 list price and a 20% offer unless the environment says otherwise. */
const DEFAULT_LIST_PRICE_MINOR = 45_000;
const DEFAULT_OFFER_PERCENT = 20;
const DEFAULT_CURRENCY = "AED";

function readIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * The offer as shown to the customer. The charge itself is a Stripe Price
 * (plus an optional coupon) resolved server-side, so these two must be
 * kept in step with the Stripe dashboard — see docs/STRIPE_CONTRACTS.md.
 */
export function getReportOffer(): ReportOffer {
  const listAmountMinor = readIntegerEnv(
    process.env.NEXT_PUBLIC_REPORT_LIST_PRICE_MINOR,
    DEFAULT_LIST_PRICE_MINOR,
  );
  const discountPercent = Math.min(
    100,
    readIntegerEnv(
      process.env.NEXT_PUBLIC_REPORT_OFFER_PERCENT,
      DEFAULT_OFFER_PERCENT,
    ),
  );
  return {
    productId: "tareeq-deep-dive-v1",
    name: "Tareeq Complete Report",
    amountMinor: Math.round((listAmountMinor * (100 - discountPercent)) / 100),
    listAmountMinor,
    discountPercent,
    currency:
      process.env.NEXT_PUBLIC_REPORT_CURRENCY?.trim() || DEFAULT_CURRENCY,
  };
}

export function reportIdFromGeneratedAt(generatedAt: string): string {
  const safeTimestamp = generatedAt.replace(/[^a-zA-Z0-9]/g, "");
  return `core-${safeTimestamp || "current"}`;
}

export function createPreviewAccess(reportId: string): ReportAccess {
  return {
    reportId,
    status: "preview",
    isPaid: false,
    updatedAt: new Date().toISOString(),
  };
}
