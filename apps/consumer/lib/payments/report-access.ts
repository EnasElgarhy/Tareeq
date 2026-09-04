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
  amountMinor: number;
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

export function getReportOffer(): ReportOffer {
  const configuredAmount = Number.parseInt(
    process.env.NEXT_PUBLIC_REPORT_PRICE_MINOR ?? "999",
    10,
  );
  return {
    productId: "tareeq-deep-dive-v1",
    name: "Tareeq Complete Report",
    amountMinor: Number.isFinite(configuredAmount) ? configuredAmount : 999,
    currency: process.env.NEXT_PUBLIC_REPORT_CURRENCY?.trim() || "USD",
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
