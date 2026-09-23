import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  adminFrom: vi.fn(),
  getStripeClient: vi.fn(),
  sessionsRetrieve: vi.fn(),
  invoicesRetrieve: vi.fn(),
  paymentIntentsRetrieve: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({ from: mocks.adminFrom })),
}));

vi.mock("@/lib/payments/stripe-server", () => ({
  getStripeClient: mocks.getStripeClient,
}));

import { GET } from "@/app/api/payments/history/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function createAdminQuery(result: { data: unknown[] | null; error: unknown }) {
  const query: Record<string, unknown> & {
    then?: (resolve: (value: unknown) => void) => void;
  } = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
  };
  // supabase-js queries are thenables; `await` resolves through `then`.
  query.then = (resolve) => resolve(result);
  mocks.adminFrom.mockReturnValue(query);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: "sara@example.com" } },
  });
});

describe("GET /api/payments/history", () => {
  it("returns 401 when the caller is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "not_authenticated",
    });
    expect(mocks.adminFrom).not.toHaveBeenCalled();
  });

  it("returns an empty list when the user has no purchases", async () => {
    createAdminQuery({ data: [], error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ purchases: [] });
    expect(mocks.getStripeClient).not.toHaveBeenCalled();
  });

  it("resolves a Checkout receipt URL and never exposes Stripe ids", async () => {
    createAdminQuery({ data: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        status: "active",
        source: "stripe",
        amount_minor: 999,
        currency: "eur",
        created_at: "2026-09-21T10:00:00.000Z",
        stripe_session_id: "cs_test_session",
        stripe_payment_intent_id: "pi_test_intent",
      },
    ], error: null });

    mocks.getStripeClient.mockReturnValue({
      checkout: { sessions: { retrieve: mocks.sessionsRetrieve } },
      invoices: { retrieve: mocks.invoicesRetrieve },
      paymentIntents: { retrieve: mocks.paymentIntentsRetrieve },
    });
    mocks.sessionsRetrieve.mockResolvedValue({
      invoice: null,
      payment_intent: "pi_test_intent",
    });
    mocks.paymentIntentsRetrieve.mockResolvedValue({
      latest_charge: {
        receipt_url: "https://pay.stripe.com/receipts/pa_test_receipt",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as { purchases: unknown[] };
    expect(body.purchases).toEqual([
      {
        id: "44444444-4444-4444-8444-444444444444",
        kind: "report_unlock",
        status: "paid",
        source: "paid",
        amountMinor: 999,
        currency: "eur",
        paidAt: "2026-09-21T10:00:00.000Z",
        documentUrl: "https://pay.stripe.com/receipts/pa_test_receipt",
      },
    ]);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("cs_test_session");
    expect(serialized).not.toContain("pi_test_intent");
  });

  it("prefers the hosted invoice URL when the session has an invoice", async () => {
    createAdminQuery({ data: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        status: "active",
        amount_minor: 999,
        currency: "eur",
        created_at: "2026-09-21T10:00:00.000Z",
        stripe_session_id: "cs_test_session",
        stripe_payment_intent_id: null,
      },
    ], error: null });

    mocks.getStripeClient.mockReturnValue({
      checkout: { sessions: { retrieve: mocks.sessionsRetrieve } },
      invoices: { retrieve: mocks.invoicesRetrieve },
      paymentIntents: { retrieve: mocks.paymentIntentsRetrieve },
    });
    mocks.sessionsRetrieve.mockResolvedValue({
      invoice: "in_test_invoice",
      payment_intent: null,
    });
    mocks.invoicesRetrieve.mockResolvedValue({
      hosted_invoice_url: "https://invoice.stripe.com/i/in_test_invoice",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      purchases: { documentUrl: string | null }[];
    };
    expect(body.purchases[0]?.documentUrl).toBe(
      "https://invoice.stripe.com/i/in_test_invoice",
    );
    expect(mocks.paymentIntentsRetrieve).not.toHaveBeenCalled();
  });

  it("marks revoked purchases as refunded", async () => {
    createAdminQuery({ data: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        status: "revoked",
        source: "stripe",
        amount_minor: 999,
        currency: "eur",
        created_at: "2026-09-21T10:00:00.000Z",
        stripe_session_id: null,
        stripe_payment_intent_id: null,
      },
    ], error: null });

    const response = await GET();

    const body = (await response.json()) as { purchases: unknown[] };
    expect(body.purchases).toEqual([
      {
        id: "44444444-4444-4444-8444-444444444444",
        kind: "report_unlock",
        status: "refunded",
        source: "paid",
        amountMinor: 999,
        currency: "eur",
        paidAt: "2026-09-21T10:00:00.000Z",
        documentUrl: null,
      },
    ]);
  });

  it("keeps the purchase when the Stripe document cannot be resolved", async () => {
    createAdminQuery({ data: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        status: "active",
        amount_minor: 999,
        currency: "eur",
        created_at: "2026-09-21T10:00:00.000Z",
        stripe_session_id: "cs_test_session",
        stripe_payment_intent_id: null,
      },
    ], error: null });

    mocks.getStripeClient.mockReturnValue({
      checkout: { sessions: { retrieve: mocks.sessionsRetrieve } },
      invoices: { retrieve: mocks.invoicesRetrieve },
      paymentIntents: { retrieve: mocks.paymentIntentsRetrieve },
    });
    mocks.sessionsRetrieve.mockRejectedValue(
      new Error("No such checkout session"),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      purchases: { documentUrl: string | null }[];
    };
    expect(body.purchases).toHaveLength(1);
    expect(body.purchases[0]?.documentUrl).toBeNull();
  });

  it("returns history_unavailable when the database read fails", async () => {
    createAdminQuery({ data: null, error: { message: "connection refused" } });

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "history_unavailable",
    });
  });

  it("labels admin grants as free access without touching Stripe", async () => {
    createAdminQuery({ data: [
      {
        id: "55555555-5555-4555-8555-555555555555",
        status: "active",
        source: "admin_grant",
        amount_minor: null,
        currency: null,
        created_at: "2026-09-21T10:00:00.000Z",
        stripe_session_id: null,
        stripe_payment_intent_id: null,
      },
    ], error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as { purchases: unknown[] };
    expect(body.purchases).toEqual([
      {
        id: "55555555-5555-4555-8555-555555555555",
        kind: "report_unlock",
        status: "paid",
        source: "free",
        amountMinor: null,
        currency: null,
        paidAt: "2026-09-21T10:00:00.000Z",
        documentUrl: null,
      },
    ]);
    expect(mocks.getStripeClient).not.toHaveBeenCalled();
  });
});
