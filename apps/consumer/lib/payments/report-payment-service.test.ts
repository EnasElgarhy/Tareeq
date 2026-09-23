import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readReportAccess,
  unlockStoredReport,
} from "@/lib/payments/report-access-storage";
import {
  mockReportPaymentService,
  ReportPaymentError,
  stripeReportPaymentService,
} from "@/lib/payments/report-payment-service";

const assessmentId = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";
const reportId = "core-2026-07-28T120000000Z";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function mockFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra fetch call");
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  window.localStorage.clear();
  // Collapses the confirmation backoff so the polling tests stay fast and
  // deterministic. The service sleeps through `window.setTimeout`.
  vi.spyOn(window, "setTimeout").mockImplementation(((
    handler: TimerHandler,
  ) => {
    if (typeof handler === "function") handler();
    return 0;
  }) as typeof window.setTimeout);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("stripeReportPaymentService.createCheckoutSession", () => {
  it("returns the client secret and sends only the assessment id", async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, { clientSecret: "cs_test_123_secret_abc" }),
    );

    const result = await stripeReportPaymentService.createCheckoutSession({
      reportId,
      assessmentId,
      email: "sara@example.com",
      offer: {
        productId: "p",
        name: "n",
        amountMinor: 999,
        listAmountMinor: 999,
        discountPercent: 0,
        currency: "USD",
      },
    });

    expect(result).toEqual({
      status: "ready",
      provider: "stripe",
      clientSecret: "cs_test_123_secret_abc",
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    // The price is server-authoritative — nothing about the amount, and no
    // email, may travel with the request.
    expect(JSON.parse(String(init.body))).toEqual({ assessmentId });
  });

  it("treats 409 already_owned as an unlock, not a failure", async () => {
    mockFetch(jsonResponse(409, { error: "already_owned" }));

    await expect(
      stripeReportPaymentService.createCheckoutSession({
        reportId,
        assessmentId,
        email: "sara@example.com",
        offer: {
          productId: "p",
          name: "n",
          amountMinor: 999,
          listAmountMinor: 999,
          discountPercent: 0,
          currency: "USD",
        },
      }),
    ).resolves.toEqual({ status: "already_owned", provider: "stripe" });
  });

  it.each([
    [401, "not_authenticated"],
    [403, "forbidden"],
    [502, "checkout_unavailable"],
  ])("maps a %i response onto the %s code", async (status, code) => {
    mockFetch(jsonResponse(status, { error: code }));

    await expect(
      stripeReportPaymentService.createCheckoutSession({
        reportId,
        assessmentId,
        email: "sara@example.com",
        offer: {
          productId: "p",
          name: "n",
          amountMinor: 999,
          listAmountMinor: 999,
          discountPercent: 0,
          currency: "USD",
        },
      }),
    ).rejects.toMatchObject({ code });
  });

  it("reports a transport failure as a network error", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    await expect(
      stripeReportPaymentService.createCheckoutSession({
        reportId,
        assessmentId,
        email: "sara@example.com",
        offer: {
          productId: "p",
          name: "n",
          amountMinor: 999,
          listAmountMinor: 999,
          discountPercent: 0,
          currency: "USD",
        },
      }),
    ).rejects.toMatchObject({ code: "network" });
  });

  it("rejects a 200 that carries no client secret", async () => {
    mockFetch(jsonResponse(200, {}));

    await expect(
      stripeReportPaymentService.createCheckoutSession({
        reportId,
        assessmentId,
        email: "sara@example.com",
        offer: {
          productId: "p",
          name: "n",
          amountMinor: 999,
          listAmountMinor: 999,
          discountPercent: 0,
          currency: "USD",
        },
      }),
    ).rejects.toMatchObject({ code: "checkout_unavailable" });
  });
});

describe("stripeReportPaymentService.confirmPayment", () => {
  it("succeeds once the server reports an active entitlement", async () => {
    mockFetch(
      jsonResponse(200, {
        status: "active",
        unlockedAt: "2026-07-28T12:05:00.000Z",
      }),
    );

    await expect(
      stripeReportPaymentService.confirmPayment({ reportId, assessmentId }),
    ).resolves.toMatchObject({
      status: "succeeded",
      unlockedAt: "2026-07-28T12:05:00.000Z",
    });
  });

  it("keeps polling while the webhook has not landed yet", async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, { status: "none" }),
      jsonResponse(500, { error: "entitlement_lookup_failed" }),
      jsonResponse(200, { status: "active" }),
    );

    await expect(
      stripeReportPaymentService.confirmPayment({ reportId, assessmentId }),
    ).resolves.toMatchObject({ status: "succeeded" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up as pending when the entitlement never appears", async () => {
    mockFetch(
      ...Array.from({ length: 6 }, () => jsonResponse(200, { status: "none" })),
    );

    await expect(
      stripeReportPaymentService.confirmPayment({ reportId, assessmentId }),
    ).rejects.toMatchObject({ code: "entitlement_pending" });
  });

  it("stops immediately when the caller is not authenticated", async () => {
    const fetchMock = mockFetch(
      jsonResponse(401, { error: "not_authenticated" }),
    );

    await expect(
      stripeReportPaymentService.confirmPayment({ reportId, assessmentId }),
    ).rejects.toMatchObject({ code: "not_authenticated" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("stripeReportPaymentService.restorePurchase", () => {
  it("unlocks when the server holds an entitlement the cache does not know", async () => {
    mockFetch(
      jsonResponse(200, {
        status: "active",
        unlockedAt: "2026-07-28T12:05:00.000Z",
      }),
    );

    const restored = await stripeReportPaymentService.restorePurchase({
      reportId,
      assessmentId,
    });

    expect(restored).toMatchObject({
      status: "unlocked",
      isPaid: true,
      unlockedAt: "2026-07-28T12:05:00.000Z",
    });
    expect(readReportAccess(reportId).isPaid).toBe(true);
  });

  it("corrects a cache that claims a report the server does not own", async () => {
    unlockStoredReport(reportId, "forged-payment");
    mockFetch(jsonResponse(200, { status: "none" }));

    const restored = await stripeReportPaymentService.restorePurchase({
      reportId,
      assessmentId,
    });

    expect(restored.isPaid).toBe(false);
    expect(restored.status).toBe("preview");
    // The correction is persisted, so a reload cannot resurrect the claim.
    expect(readReportAccess(reportId).isPaid).toBe(false);
  });

  it("keeps the cache when the server does not answer", async () => {
    unlockStoredReport(reportId, "payment-1");
    mockFetch(new TypeError("Failed to fetch"));

    const restored = await stripeReportPaymentService.restorePurchase({
      reportId,
      assessmentId,
    });

    expect(restored.isPaid).toBe(true);
    expect(readReportAccess(reportId).isPaid).toBe(true);
  });

  it("does not call the server without an assessment id", async () => {
    const fetchMock = mockFetch();

    const restored = await stripeReportPaymentService.restorePurchase({
      reportId,
      assessmentId: null,
    });

    expect(restored.status).toBe("preview");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("mockReportPaymentService", () => {
  it("opens a session and unlocks without touching the network", async () => {
    const fetchMock = mockFetch();

    const session = await mockReportPaymentService.createCheckoutSession({
      reportId,
      assessmentId,
      email: "sara@example.com",
      offer: {
        productId: "p",
        name: "n",
        amountMinor: 999,
        listAmountMinor: 999,
        discountPercent: 0,
        currency: "USD",
      },
    });
    expect(session).toMatchObject({ status: "ready", provider: "mock" });

    const payment = await mockReportPaymentService.confirmPayment({
      reportId,
      assessmentId,
    });
    await mockReportPaymentService.unlockReport(reportId, payment.paymentId);

    expect(
      (
        await mockReportPaymentService.restorePurchase({
          reportId,
          assessmentId,
        })
      ).isPaid,
    ).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the seeded failure address as a payment error", async () => {
    await expect(
      mockReportPaymentService.createCheckoutSession({
        reportId,
        assessmentId,
        email: "sara+fail@example.com",
        offer: {
          productId: "p",
          name: "n",
          amountMinor: 999,
          listAmountMinor: 999,
          discountPercent: 0,
          currency: "USD",
        },
      }),
    ).rejects.toBeInstanceOf(ReportPaymentError);
  });
});
