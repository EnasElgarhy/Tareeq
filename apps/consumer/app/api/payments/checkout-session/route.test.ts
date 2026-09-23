import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createSession: vi.fn(),
  getStripeClient: vi.fn(),
  getStripePriceId: vi.fn(),
  getStripeCouponId: vi.fn(),
  getUser: vi.fn(),
  ownerMaybeSingle: vi.fn(),
  entitlementMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/payments/stripe-server", () => ({
  getStripeClient: mocks.getStripeClient,
  getStripePriceId: mocks.getStripePriceId,
  getStripeCouponId: mocks.getStripeCouponId,
}));

import { POST } from "@/app/api/payments/checkout-session/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const ASSESSMENT_ID = "33333333-3333-4333-8333-333333333333";
const SERVER_PRICE_ID = "price_server_authoritative";

function createAdminClient() {
  return {
    from: vi.fn((table: string) => {
      if (table === "assessments") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mocks.ownerMaybeSingle })),
          })),
        };
      }
      if (table === "report_entitlements") {
        const query = {
          eq: vi.fn(() => query),
          maybeSingle: mocks.entitlementMaybeSingle,
        };
        return { select: vi.fn(() => query) };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function checkoutRequest(body: unknown): Request {
  return new Request("http://localhost/api/payments/checkout-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/payments/checkout-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockImplementation(createAdminClient);
    mocks.getStripeClient.mockReturnValue({
      checkout: { sessions: { create: mocks.createSession } },
    });
    mocks.getStripePriceId.mockReturnValue(SERVER_PRICE_ID);
    mocks.getStripeCouponId.mockReturnValue(null);
    mocks.getUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: "sara@example.com" } },
    });
    mocks.ownerMaybeSingle.mockResolvedValue({
      data: { id: ASSESSMENT_ID, user_id: USER_ID },
      error: null,
    });
    mocks.entitlementMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    mocks.createSession.mockResolvedValue({
      client_secret: "cs_test_123_secret_abc",
    });
  });

  it("returns 401 when the caller is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      checkoutRequest({ assessmentId: ASSESSMENT_ID }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "not_authenticated",
    });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it.each([
    ["belongs to another user", { id: ASSESSMENT_ID, user_id: OTHER_USER_ID }],
    ["does not exist", null],
  ])("returns the same 403 when the assessment %s", async (_, owner) => {
    mocks.ownerMaybeSingle.mockResolvedValue({ data: owner, error: null });

    const response = await POST(
      checkoutRequest({ assessmentId: ASSESSMENT_ID }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns already_owned instead of charging for an active entitlement", async () => {
    mocks.entitlementMaybeSingle.mockResolvedValue({
      data: {
        id: "44444444-4444-4444-8444-444444444444",
        created_at: "2026-09-01T10:00:00.000Z",
      },
      error: null,
    });

    const response = await POST(
      checkoutRequest({ assessmentId: ASSESSMENT_ID }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "already_owned" });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates checkout with the server price and ignores client-supplied pricing", async () => {
    const response = await POST(
      checkoutRequest({
        assessmentId: ASSESSMENT_ID,
        amount: 3_141_592,
        amountMinor: 3_141_592,
        currency: "CLIENT_CURRENCY",
        price: "price_client_should_be_ignored",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      clientSecret: "cs_test_123_secret_abc",
    });
    expect(mocks.getStripePriceId).toHaveBeenCalledOnce();
    expect(mocks.createSession).toHaveBeenCalledOnce();

    const sessionParams = mocks.createSession.mock.calls[0]?.[0];
    expect(sessionParams).toMatchObject({
      mode: "payment",
      // `embedded` is rejected by the pinned Stripe API version; the session
      // must be created as an embedded_page session.
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      line_items: [{ price: SERVER_PRICE_ID, quantity: 1 }],
      client_reference_id: ASSESSMENT_ID,
      metadata: { user_id: USER_ID, assessment_id: ASSESSMENT_ID },
      customer_email: "sara@example.com",
    });
    expect(sessionParams).not.toHaveProperty("amount");
    expect(sessionParams).not.toHaveProperty("amountMinor");
    expect(sessionParams).not.toHaveProperty("currency");
    expect(sessionParams).not.toHaveProperty("price");
    expect(JSON.stringify(sessionParams)).not.toContain("3141592");
    expect(JSON.stringify(sessionParams)).not.toContain(
      "price_client_should_be_ignored",
    );
  });

  it("applies the configured offer coupon to the session, and nothing else", async () => {
    mocks.getStripeCouponId.mockReturnValue("coupon_launch_20");

    const response = await POST(
      checkoutRequest({ assessmentId: ASSESSMENT_ID }),
    );

    expect(response.status).toBe(200);
    const sessionParams = mocks.createSession.mock.calls[0]?.[0];
    expect(sessionParams).toMatchObject({
      line_items: [{ price: SERVER_PRICE_ID, quantity: 1 }],
      discounts: [{ coupon: "coupon_launch_20" }],
    });
  });

  it("sends no discounts when no coupon is configured", async () => {
    await POST(checkoutRequest({ assessmentId: ASSESSMENT_ID }));

    const sessionParams = mocks.createSession.mock.calls[0]?.[0];
    expect(sessionParams).not.toHaveProperty("discounts");
  });
});
