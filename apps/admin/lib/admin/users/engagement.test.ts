import { describe, expect, it } from "vitest";
import { computeEngagement } from "@/lib/admin/users/engagement";
import type { UserAggregate } from "@/lib/admin/users/types";

const NOW = "2026-07-15T00:00:00.000Z";

function agg(over: Partial<UserAggregate> = {}): UserAggregate {
  return {
    registeredAt: "2026-07-14T00:00:00.000Z",
    lastActiveAt: null,
    assessmentsStarted: 0,
    assessmentsCompleted: 0,
    hasCompassResult: false,
    resultsViewed: false,
    kaiOpened: false,
    kaiSessions: 0,
    kaiMessages: 0,
    plansSaved: 0,
    tasksCompleted: 0,
    isDeleted: false,
    ...over,
  };
}

describe("computeEngagement", () => {
  it("a user with nothing recorded is low engagement", () => {
    const r = computeEngagement(agg(), NOW);
    expect(r.level).toBe("low");
    expect(r.score).toBe(0);
    expect(r.factors).toEqual([]);
  });

  it("rewards completions, Kai use and recency additively", () => {
    const r = computeEngagement(
      agg({
        assessmentsCompleted: 2,
        resultsViewed: true,
        kaiSessions: 3,
        lastActiveAt: "2026-07-14T00:00:00.000Z", // 1 day ago
      }),
      NOW,
    );
    expect(r.level).toBe("high");
    expect(r.factors.map((f) => f.code)).toEqual(
      expect.arrayContaining(["completed_assessments", "viewed_results", "kai_sessions", "recent_7d"]),
    );
  });

  it("caps per-factor points so one metric can't dominate", () => {
    const r = computeEngagement(agg({ kaiSessions: 999 }), NOW);
    const kai = r.factors.find((f) => f.code === "kai_sessions");
    expect(kai?.points).toBe(3);
  });

  it("distinguishes 7-day from 30-day recency", () => {
    const week = computeEngagement(agg({ lastActiveAt: "2026-07-10T00:00:00.000Z" }), NOW);
    expect(week.factors.some((f) => f.code === "recent_7d")).toBe(true);
    const month = computeEngagement(agg({ lastActiveAt: "2026-06-25T00:00:00.000Z" }), NOW);
    expect(month.factors.some((f) => f.code === "recent_30d")).toBe(true);
  });

  it("engagement is independent of risk — dormant-but-once-active still scores factors it earned", () => {
    // Completed assessments but inactive 90 days: still low/medium engagement,
    // never negative, and no crash on the stale timestamp.
    const r = computeEngagement(agg({ assessmentsCompleted: 1, lastActiveAt: "2026-01-01T00:00:00.000Z" }), NOW);
    expect(r.score).toBeGreaterThanOrEqual(1);
    expect(["low", "medium", "high"]).toContain(r.level);
  });
});
