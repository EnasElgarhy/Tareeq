import {
  createPreviewAccess,
  type CheckoutSessionInput,
  type CheckoutSessionResult,
  type ConfirmPaymentInput,
  type PaymentResult,
  type ReportAccess,
  type RestorePurchaseInput,
} from "@/lib/payments/report-access";
import {
  readReportAccess,
  unlockStoredReport,
  writeReportAccess,
} from "@/lib/payments/report-access-storage";

/**
 * The client seam between the report paywall and whatever is collecting
 * money. Two adapters implement it: `stripeReportPaymentService` (the real
 * one, backed by the routes in `app/api/payments/*`) and
 * `mockReportPaymentService` (local development and tests, no network).
 *
 * Contract: docs/STRIPE_CONTRACTS.md.
 *
 * Shape note — this interface changed when Embedded Checkout replaced the
 * mock form. Embedded Checkout reports completion through its own
 * `onComplete` callback rather than handing back a session to verify, so the
 * old `verifyPayment(session)` step became `confirmPayment(identity)`: a poll
 * of the entitlement route, which is the only thing allowed to decide that a
 * report is paid for.
 */
export interface ReportPaymentService {
  /** Opens a checkout session, or reports that the server already owns it. */
  createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
  /**
   * Asks the server whether the payment landed. Never resolves from browser
   * state — the browser saying "done" is a hint, not proof.
   */
  confirmPayment(input: ConfirmPaymentInput): Promise<PaymentResult>;
  /** Writes the unlock into the local cache so a reload renders instantly. */
  unlockReport(reportId: string, paymentId: string): Promise<ReportAccess>;
  /** Reconciles the local cache against the server on page load. */
  restorePurchase(input: RestorePurchaseInput): Promise<ReportAccess>;
}

export type ReportPaymentErrorCode =
  /** 401 — the session cookie is gone or expired. */
  | "not_authenticated"
  /** 403 — the assessment is not the caller's (or does not exist). */
  | "forbidden"
  /** 502, or a missing publishable/price configuration. */
  | "checkout_unavailable"
  /** The charge went through but no entitlement appeared in time. */
  | "entitlement_pending"
  /** The request never reached the server. */
  | "network"
  | "unknown";

/** Carries a stable machine-readable code so the UI never parses prose. */
export class ReportPaymentError extends Error {
  readonly code: ReportPaymentErrorCode;

  constructor(code: ReportPaymentErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ReportPaymentError";
    this.code = code;
    // `target: ES2017` keeps the prototype chain intact when extending
    // built-ins, so no `setPrototypeOf` fixup is needed here.
  }
}

const CHECKOUT_SESSION_ENDPOINT = "/api/payments/checkout-session";
const ENTITLEMENT_ENDPOINT = "/api/payments/entitlement";

/**
 * Delays between entitlement polls after Embedded Checkout reports
 * completion. The unlock is written by the Stripe webhook, which is not
 * ordered against the browser's `onComplete` — it usually lands within a
 * second, but occasionally after. Roughly 11s of patience before the user is
 * told to come back, which is far cheaper than telling a paying customer the
 * payment failed.
 */
const CONFIRM_BACKOFF_MS = [0, 700, 1200, 2000, 3000, 4500] as const;

type EntitlementLookup =
  | { outcome: "active"; unlockedAt?: string }
  | { outcome: "none" }
  | { outcome: "denied"; code: ReportPaymentErrorCode }
  | { outcome: "unavailable" };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Reads the `{ error }` code the payment routes return, never the prose. */
async function readErrorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return "unknown";
    const code = (body as { error?: unknown }).error;
    return typeof code === "string" ? code : "unknown";
  } catch {
    return "unknown";
  }
}

function checkoutErrorFor(status: number, code: string): ReportPaymentError {
  if (status === 401) return new ReportPaymentError("not_authenticated", code);
  if (status === 403) return new ReportPaymentError("forbidden", code);
  if (status === 502) return new ReportPaymentError("checkout_unavailable", code);
  return new ReportPaymentError("unknown", code);
}

/**
 * The single question that decides an unlock. Distinguishes "the server says
 * no" (`none`) from "the server did not answer" (`unavailable`) — collapsing
 * the two would either lock out a paying user on a dropped request or leave a
 * stale cache uncorrected.
 */
async function fetchEntitlement(
  assessmentId: string,
): Promise<EntitlementLookup> {
  let response: Response;
  try {
    response = await fetch(
      `${ENTITLEMENT_ENDPOINT}?${new URLSearchParams({ assessmentId })}`,
      { cache: "no-store" },
    );
  } catch {
    return { outcome: "unavailable" };
  }

  if (response.status === 401) {
    return { outcome: "denied", code: "not_authenticated" };
  }
  // 400 means our own assessment id is malformed; retrying cannot fix it.
  if (response.status === 400) {
    return { outcome: "denied", code: "forbidden" };
  }
  if (!response.ok) return { outcome: "unavailable" };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { outcome: "unavailable" };
  }
  if (!body || typeof body !== "object") return { outcome: "unavailable" };

  const { status, unlockedAt } = body as {
    status?: unknown;
    unlockedAt?: unknown;
  };
  if (status === "active") {
    return {
      outcome: "active",
      ...(typeof unlockedAt === "string" ? { unlockedAt } : {}),
    };
  }
  if (status === "none") return { outcome: "none" };
  return { outcome: "unavailable" };
}

/**
 * The cache's `paymentId` field. It records *why* the local copy is unlocked,
 * not a Stripe identifier — the payment intent stays server-side.
 */
function entitlementReference(assessmentId: string): string {
  return `stripe:entitlement:${assessmentId}`;
}

function cacheUnlocked(
  reportId: string,
  assessmentId: string,
  unlockedAt: string | undefined,
  cached: ReportAccess,
): ReportAccess {
  return writeReportAccess({
    reportId,
    status: "unlocked",
    isPaid: true,
    paymentId: cached.paymentId ?? entitlementReference(assessmentId),
    unlockedAt: unlockedAt ?? cached.unlockedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Stripe Embedded Checkout adapter.
 *
 * Every unlock decision in here comes from `GET /api/payments/entitlement`.
 * `localStorage` is a render cache: it makes a reload instant, and it is
 * overwritten the moment the server disagrees with it.
 */
export const stripeReportPaymentService: ReportPaymentService = {
  async createCheckoutSession(input) {
    let response: Response;
    try {
      response = await fetch(CHECKOUT_SESSION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only the assessment id crosses the wire. The price is resolved
        // from `STRIPE_PRICE_ID` server-side, so there is nothing here for a
        // tampered request to change.
        body: JSON.stringify({ assessmentId: input.assessmentId }),
      });
    } catch {
      throw new ReportPaymentError("network", "checkout_request_failed");
    }

    if (response.status === 409) {
      const code = await readErrorCode(response);
      // Documented as `already_owned`: an entitlement already exists, so the
      // report should unlock rather than the user being charged twice.
      if (code === "already_owned") {
        return { status: "already_owned", provider: "stripe" };
      }
      throw new ReportPaymentError("unknown", code);
    }

    if (!response.ok) {
      throw checkoutErrorFor(response.status, await readErrorCode(response));
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ReportPaymentError("checkout_unavailable", "invalid_response");
    }
    const clientSecret =
      body && typeof body === "object"
        ? (body as { clientSecret?: unknown }).clientSecret
        : undefined;
    if (typeof clientSecret !== "string" || clientSecret.length === 0) {
      throw new ReportPaymentError("checkout_unavailable", "missing_secret");
    }

    return { status: "ready", provider: "stripe", clientSecret };
  },

  async confirmPayment(input) {
    // The browser has told us the payment completed. That claim is worth
    // exactly one thing: it is a reason to start asking the server.
    let lastFailure: ReportPaymentErrorCode = "entitlement_pending";

    for (const wait of CONFIRM_BACKOFF_MS) {
      if (wait > 0) await delay(wait);
      const lookup = await fetchEntitlement(input.assessmentId);

      if (lookup.outcome === "active") {
        return {
          paymentId: entitlementReference(input.assessmentId),
          status: "succeeded",
          ...(lookup.unlockedAt ? { unlockedAt: lookup.unlockedAt } : {}),
        };
      }
      // A refused request will be refused again — stop rather than spend the
      // whole budget on it.
      if (lookup.outcome === "denied") {
        throw new ReportPaymentError(lookup.code, "entitlement_denied");
      }
      lastFailure =
        lookup.outcome === "unavailable" ? "network" : "entitlement_pending";
    }

    throw new ReportPaymentError(lastFailure, "entitlement_not_confirmed");
  },

  async unlockReport(reportId, paymentId) {
    return unlockStoredReport(reportId, paymentId);
  },

  async restorePurchase(input) {
    const cached = readReportAccess(input.reportId);

    // Nothing to ask yet. The cached value renders, and the next call — once
    // the assessment id resolves — reconciles it against the server.
    if (!input.assessmentId) return cached;

    const lookup = await fetchEntitlement(input.assessmentId);

    if (lookup.outcome === "active") {
      if (cached.isPaid && cached.status === "unlocked") return cached;
      return cacheUnlocked(
        input.reportId,
        input.assessmentId,
        lookup.unlockedAt,
        cached,
      );
    }

    if (lookup.outcome === "none") {
      // The server is the only source of truth. A cache claiming a paid
      // report the server has no entitlement for is wrong — correct it.
      if (cached.isPaid || cached.status === "unlocked") {
        return writeReportAccess(createPreviewAccess(input.reportId));
      }
      return cached;
    }

    // `denied` / `unavailable`: the server did not answer the question, so
    // there is nothing to reconcile against. Keeping the cache means a paid
    // user who is briefly offline still sees the report they bought; it is
    // corrected on the first request that does get through.
    return cached;
  },
};

/**
 * Development payment adapter. It exercises the real UI, persistence, and
 * entitlement lifecycle without collecting card details or reaching the
 * network. It never mounts Stripe — its `clientSecret` is a placeholder — so
 * it is for tests and offline work on the surrounding flow only.
 */
export const mockReportPaymentService: ReportPaymentService = {
  async createCheckoutSession(input) {
    await delay(450);
    if (!input.email.includes("@")) throw new ReportPaymentError("forbidden");
    // The failure hook moved here from `verifyPayment`: with Embedded
    // Checkout there is no second round-trip left to fail in.
    if (input.email.includes("+fail@")) {
      throw new ReportPaymentError("checkout_unavailable", "mock_payment_failed");
    }
    return {
      status: "ready",
      provider: "mock",
      clientSecret: `mock_cs_${crypto.randomUUID()}`,
    };
  },

  async confirmPayment(input) {
    await delay(850);
    return {
      paymentId: `pay_mock_${input.assessmentId}`,
      status: "succeeded",
    };
  },

  async unlockReport(reportId, paymentId) {
    return unlockStoredReport(reportId, paymentId);
  },

  async restorePurchase(input) {
    return readReportAccess(input.reportId);
  },
};
