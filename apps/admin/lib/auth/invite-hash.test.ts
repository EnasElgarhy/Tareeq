import { describe, expect, it } from "vitest";
import { parseInviteHash } from "@/lib/auth/invite-hash";

describe("parseInviteHash", () => {
  it("extracts a complete Supabase invite session", () => {
    expect(
      parseInviteHash(
        "#access_token=access-value&refresh_token=refresh-value&type=invite",
      ),
    ).toEqual({
      kind: "session",
      accessToken: "access-value",
      refreshToken: "refresh-value",
    });
  });

  it("rejects an invite fragment with missing session tokens", () => {
    expect(parseInviteHash("#access_token=access-value&type=invite")).toEqual({
      kind: "error",
    });
  });

  it("recognizes an authentication error fragment", () => {
    expect(
      parseInviteHash("#error=access_denied&error_code=otp_expired&type=invite"),
    ).toEqual({ kind: "error" });
  });

  it("ignores fragments that do not belong to the invite flow", () => {
    expect(parseInviteHash("#section=permissions")).toEqual({ kind: "none" });
    expect(parseInviteHash("")).toEqual({ kind: "none" });
  });
});
