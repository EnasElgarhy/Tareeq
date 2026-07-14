import { beforeEach, describe, expect, it } from "vitest";
import { daysSince, markSeenNow, readLastSeenAt } from "@/lib/kai/proactive/last-seen";

describe("last-seen", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has no last-seen timestamp before the first visit", () => {
    expect(readLastSeenAt()).toBeNull();
  });

  it("stores the timestamp markSeenNow was called with", () => {
    const now = new Date(2026, 5, 15, 10);
    markSeenNow(now);
    expect(readLastSeenAt()).toBe(now.toISOString());
  });
});

describe("daysSince", () => {
  it("returns null when there's no prior timestamp", () => {
    expect(daysSince(null, new Date(2026, 5, 15))).toBeNull();
  });

  it("returns null for an unparseable timestamp rather than throwing", () => {
    expect(daysSince("not-a-date", new Date(2026, 5, 15))).toBeNull();
  });

  it("returns 0 for the same day", () => {
    const now = new Date(2026, 5, 15, 10);
    expect(daysSince(now.toISOString(), now)).toBe(0);
  });

  it("returns whole days elapsed", () => {
    const then = new Date(2026, 5, 10, 10);
    const now = new Date(2026, 5, 15, 10);
    expect(daysSince(then.toISOString(), now)).toBe(5);
  });
});
