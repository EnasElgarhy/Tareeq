import { describe, expect, it } from "vitest";
import { computeRisk } from "@/lib/admin/users/risk";
import type { UserAggregate } from "@/lib/admin/users/types";

const NOW = "2026-07-15T00:00:00.000Z";

function agg(over: Partial<UserAggregate> = {}): UserAggregate {
  return {
    registeredAt: "2026-07-14T00:00:00.000Z",
    lastActiveAt: "2026-07-14T00:00:00.000Z",
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

describe("computeRisk", () => {
  it("a brand-new user with no data is healthy (absence of data is not risk)", () => {
    const r = computeRisk(agg(), NOW);
    expect(r.level).toBe("healthy");
    expect(r.score).toBe(0);
    expect(r.reasons).toEqual([]);
  });

  it("flags an abandoned assessment (medium)", () => {
    const r = computeRisk(agg({ assessmentsStarted: 1, assessmentsCompleted: 0 }), NOW);
    expect(r.reasons.map((x) => x.code)).toContain("assessment_abandoned");
    expect(r.level).toBe("needs_attention");
  });

  it("flags compass completed but results never viewed", () => {
    const r = computeRisk(agg({ assessmentsStarted: 1, assessmentsCompleted: 1, hasCompassResult: true }), NOW);
    expect(r.reasons.map((x) => x.code)).toContain("results_never_viewed");
  });

  it("flags results viewed but Kai never opened (low)", () => {
    const r = computeRisk(agg({ hasCompassResult: true, resultsViewed: true, kaiOpened: false }), NOW);
    expect(r.reasons.map((x) => x.code)).toContain("kai_never_opened");
  });

  it("flags a saved plan with no task progress", () => {
    const r = computeRisk(agg({ plansSaved: 1, tasksCompleted: 0 }), NOW);
    expect(r.reasons.map((x) => x.code)).toContain("plan_no_progress");
  });

  it("escalates to high_risk on 90+ day inactivity", () => {
    const r = computeRisk(agg({ lastActiveAt: "2026-01-01T00:00:00.000Z" }), NOW);
    expect(r.reasons.map((x) => x.code)).toContain("inactive_90_days");
    expect(r.level).toBe("high_risk");
  });

  it("flags 30-day inactivity as needs_attention (not high)", () => {
    const r = computeRisk(agg({ lastActiveAt: "2026-06-01T00:00:00.000Z" }), NOW);
    expect(r.reasons.map((x) => x.code)).toContain("inactive_30_days");
    expect(r.level).toBe("needs_attention");
  });

  it("does not treat a recently-registered inactive user as risky", () => {
    // Registered 2 days ago, no activity yet — healthy, not flagged.
    const r = computeRisk(agg({ registeredAt: "2026-07-13T00:00:00.000Z", lastActiveAt: null }), NOW);
    expect(r.level).toBe("healthy");
  });

  it("null timestamps never produce an inactivity reason", () => {
    const r = computeRisk(agg({ registeredAt: null, lastActiveAt: null }), NOW);
    expect(r.reasons.some((x) => x.code.startsWith("inactive"))).toBe(false);
  });
});
