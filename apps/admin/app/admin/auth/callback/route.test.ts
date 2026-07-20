import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { GET } from "@/app/admin/auth/callback/route";

describe("admin invite callback", () => {
  beforeEach(() => {
    mocks.exchangeCodeForSession.mockReset();
    mocks.createSupabaseServerClient.mockReset();
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
    });
  });

  it("redirects relative to the public host behind the staging proxy", async () => {
    const response = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/admin/accept-invite");
  });

  it("exchanges a valid PKCE code before continuing", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?code=invite-code"),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("invite-code");
    expect(response.headers.get("location")).toBe("/admin/accept-invite");
  });

  it("surfaces failed and provider-rejected invitations", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error("expired"),
    });

    const failedExchange = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?code=expired-code"),
    );
    const providerError = await GET(
      new Request(
        "https://0.0.0.0:3000/admin/auth/callback?error=access_denied&error_code=otp_expired",
      ),
    );

    expect(failedExchange.headers.get("location")).toBe(
      "/admin/accept-invite?error=invalid_or_expired",
    );
    expect(providerError.headers.get("location")).toBe(
      "/admin/accept-invite?error=invalid_or_expired",
    );
  });
});
