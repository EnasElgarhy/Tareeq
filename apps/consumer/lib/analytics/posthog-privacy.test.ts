import { describe, expect, it } from "vitest";
import {
  maskReplayText,
  sanitizeReplayUrl,
  shouldMaskReplayText,
} from "./posthog-privacy";

describe("PostHog replay privacy", () => {
  it.each([
    "/q/12",
    "/kai",
    "/kai/thread/abc",
    "/results",
    "/share/example",
    "/home",
    "/signin",
  ])("masks sensitive route %s", (pathname) => {
    expect(shouldMaskReplayText(pathname)).toBe(true);
    expect(maskReplayText("Private answer", pathname)).not.toContain("Private");
  });

  it("keeps ordinary staging copy visible but strips email and token-like text", () => {
    expect(
      maskReplayText(
        "Welcome tester@example.com abcdefghijklmnopqrstuvwxyz123456",
        "/start",
      ),
    ).toBe("Welcome [email hidden] [token hidden]");
  });

  it("removes query strings and fragments from captured URLs", () => {
    expect(
      sanitizeReplayUrl(
        "https://staging.tareek.me/signin?email=test@example.com#access_token=secret",
      ),
    ).toBe("https://staging.tareek.me/signin");
  });
});
