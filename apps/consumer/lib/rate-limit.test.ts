import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows the limit per window, then refuses until the window ends", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.isLimited("u1", 0)).toBe(false);
    expect(limiter.isLimited("u1", 10)).toBe(false);
    expect(limiter.isLimited("u1", 20)).toBe(true);
    expect(limiter.isLimited("u2", 20)).toBe(false);
    expect(limiter.isLimited("u1", 1001)).toBe(false);
  });
});
