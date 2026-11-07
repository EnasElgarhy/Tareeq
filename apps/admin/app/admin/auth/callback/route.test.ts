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

  it("sends an email-link or Google sign-in to the admin, not the invite page", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?flow=login&code=link-code"),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("link-code");
    expect(response.headers.get("location")).toBe("/admin/content");
  });

  it("lands a forgotten-password sign-in on the new password page", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?flow=login&next=password&code=c"),
    );

    expect(response.headers.get("location")).toBe("/admin/password");
  });

  it("ignores any other destination after sign-in", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "https://0.0.0.0:3000/admin/auth/callback?flow=login&next=https%3A%2F%2Fevil.example&code=c",
      ),
    );

    expect(response.headers.get("location")).toBe("/admin/content");
  });

  it("returns a failed or expired sign-in to the login page", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error("denied") });

    const failed = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?flow=login&code=bad"),
    );
    const cancelled = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?flow=login&error=access_denied"),
    );
    const noCode = await GET(
      new Request("https://0.0.0.0:3000/admin/auth/callback?flow=login"),
    );

    for (const response of [failed, cancelled, noCode]) {
      expect(response.headers.get("location")).toBe("/admin/login?error=signin");
    }
  });
});
