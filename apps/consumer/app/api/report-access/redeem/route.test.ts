import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  redeemInvite: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/app/api/report-access/_lib/redeem", () => ({
  redeemInvite: mocks.redeemInvite,
}));

import { POST } from "@/app/api/report-access/redeem/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function requestWithBody(body: unknown) {
  return new Request("https://staging.tareek.me/api/report-access/redeem", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: USER_ID, email: "sara@example.com" } },
  });
});

describe("POST /api/report-access/redeem", () => {
  it("returns 401 when the caller is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(
      requestWithBody({ token: "some-token-value-here" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "not_authenticated",
    });
    expect(mocks.redeemInvite).not.toHaveBeenCalled();
  });

  it("returns 400 when the token is missing or malformed", async () => {
    for (const body of [{}, { token: 42 }, { token: null }]) {
      const response = await POST(requestWithBody(body));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "invalid_token",
      });
    }
    expect(mocks.redeemInvite).not.toHaveBeenCalled();
  });

  it("returns the assessment on a successful redeem", async () => {
    mocks.redeemInvite.mockResolvedValue({
      ok: true,
      assessmentId: "33333333-3333-4333-8333-333333333333",
      alreadyOwned: false,
    });

    const response = await POST(
      requestWithBody({ token: "free-access-token" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      assessmentId: "33333333-3333-4333-8333-333333333333",
      alreadyOwned: false,
    });
    expect(mocks.redeemInvite).toHaveBeenCalledWith(
      expect.anything(),
      USER_ID,
      "free-access-token",
      "sara@example.com",
    );
  });

  it("forwards a null email when the session has none", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: null } },
    });
    mocks.redeemInvite.mockResolvedValue({
      ok: false,
      code: "invalid_token",
      status: 400,
    });

    const response = await POST(
      requestWithBody({ token: "free-access-token" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.redeemInvite).toHaveBeenCalledWith(
      expect.anything(),
      USER_ID,
      "free-access-token",
      null,
    );
  });

  it("maps redeem failures to their status codes", async () => {
    mocks.redeemInvite.mockResolvedValue({
      ok: false,
      code: "invite_expired",
      status: 410,
    });

    const response = await POST(
      requestWithBody({ token: "free-access-token" }),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({ error: "invite_expired" });
  });

  it("returns the routing hint for paid invites", async () => {
    mocks.redeemInvite.mockResolvedValue({
      ok: false,
      code: "payment_required",
      status: 402,
      assessmentId: "33333333-3333-4333-8333-333333333333",
    });

    const response = await POST(
      requestWithBody({ token: "paid-access-token" }),
    );

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: "payment_required",
      assessmentId: "33333333-3333-4333-8333-333333333333",
    });
  });
});
