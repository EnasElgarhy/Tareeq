import { describe, expect, it } from "vitest";
import {
  deriveAchievements,
  deriveMinutesRemaining,
  deriveNextMilestone,
  deriveRecentActivity,
} from "@/lib/profile/activity";
import type { ProfileSnapshot } from "@/lib/profile/journey";

function makeSnapshot(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  const modules: ProfileSnapshot["modules"] = [
    {
      id: "core-compass",
      name: "CORE Compass",
      tagline: "Your career direction in 40 questions.",
      description: "desc",
      durationLabel: "12 min",
      icon: "compass",
      status: "available",
      completedAt: null,
      route: "/start",
    },
    {
      id: "deep-dive",
      name: "Deep Dive Interview",
      tagline: "A 1-on-1 conversation with Kai, voiced.",
      description: "desc",
      durationLabel: "~25 min",
      icon: "interview",
      status: "locked",
      completedAt: null,
      route: undefined,
    },
    {
      id: "skills-audit",
      name: "Skills Audit",
      tagline: "What you already have, what you're missing.",
      description: "desc",
      durationLabel: "~15 min",
      icon: "skills",
      status: "locked",
      completedAt: null,
      route: undefined,
    },
  ];

  return {
    registration: null,
    coreReport: null,
    modules,
    completedCount: 0,
    totalCount: modules.length,
    completionPct: 0,
    hasAnyResult: false,
    ...overrides,
  };
}

describe("deriveRecentActivity", () => {
  it("returns an empty list for a brand-new user", () => {
    expect(deriveRecentActivity(makeSnapshot())).toEqual([]);
  });

  it("includes CORE completion when a report exists", () => {
    const snapshot = makeSnapshot({
      coreReport: { generatedAt: "2026-06-01T00:00:00.000Z" } as ProfileSnapshot["coreReport"],
    });
    const activity = deriveRecentActivity(snapshot);
    expect(activity.map((a) => a.labelKey)).toContain("profile.activity.core_complete");
  });

  it("sorts newest first when both entries exist", () => {
    const snapshot = makeSnapshot({
      coreReport: { generatedAt: "2026-06-01T00:00:00.000Z" } as ProfileSnapshot["coreReport"],
      registration: {
        name: "Ahmed",
        email: "ahmed@example.com",
        verifiedAt: "2026-06-15T00:00:00.000Z",
        consent: {},
      } as unknown as ProfileSnapshot["registration"],
    });
    const activity = deriveRecentActivity(snapshot);
    expect(activity[0]?.labelKey).toBe("profile.activity.profile_created");
  });
});

describe("deriveNextMilestone", () => {
  it("returns the CORE Compass as the next milestone for a brand-new user", () => {
    expect(deriveNextMilestone(makeSnapshot())?.name).toBe("CORE Compass");
  });

  it("returns the first non-completed module after CORE is done", () => {
    const snapshot = makeSnapshot({
      modules: [
        { ...makeSnapshot().modules[0]!, status: "completed" },
        makeSnapshot().modules[1]!,
        makeSnapshot().modules[2]!,
      ],
    });
    expect(deriveNextMilestone(snapshot)?.name).toBe("Deep Dive Interview");
  });

  it("returns null once every module is completed", () => {
    const snapshot = makeSnapshot({
      modules: makeSnapshot().modules.map((m) => ({ ...m, status: "completed" as const })),
    });
    expect(deriveNextMilestone(snapshot)).toBeNull();
  });
});

describe("deriveAchievements", () => {
  it("marks everything unearned for a brand-new user, but still lists it", () => {
    const achievements = deriveAchievements(makeSnapshot());
    expect(achievements).toHaveLength(5);
    expect(achievements.every((a) => a.achieved === false)).toBe(true);
  });

  it("marks 'consistent' achieved only when the streak badge flag is passed", () => {
    const snapshot = makeSnapshot();
    expect(deriveAchievements(snapshot).find((a) => a.id === "consistent")?.achieved).toBe(false);
    expect(deriveAchievements(snapshot, true).find((a) => a.id === "consistent")?.achieved).toBe(true);
  });

  it("gives every achievement a subtitle key", () => {
    const achievements = deriveAchievements(makeSnapshot());
    expect(achievements.every((a) => typeof a.subLabelKey === "string")).toBe(true);
  });

  it("marks 'joined' achieved once registration is verified", () => {
    const snapshot = makeSnapshot({
      registration: {
        name: "Ahmed",
        email: "ahmed@example.com",
        verifiedAt: "2026-06-01T00:00:00.000Z",
        consent: {},
      } as unknown as ProfileSnapshot["registration"],
    });
    const joined = deriveAchievements(snapshot).find((a) => a.id === "joined");
    expect(joined?.achieved).toBe(true);
  });

  it("marks 'core_complete' achieved once a report exists", () => {
    const snapshot = makeSnapshot({
      coreReport: { generatedAt: "2026-06-01T00:00:00.000Z" } as ProfileSnapshot["coreReport"],
    });
    const core = deriveAchievements(snapshot).find((a) => a.id === "core_complete");
    expect(core?.achieved).toBe(true);
  });

  it("marks module-specific achievements only when that module is completed", () => {
    const snapshot = makeSnapshot({
      modules: [
        makeSnapshot().modules[0]!,
        { ...makeSnapshot().modules[1]!, status: "completed" },
        makeSnapshot().modules[2]!,
      ],
    });
    const achievements = deriveAchievements(snapshot);
    expect(achievements.find((a) => a.id === "deep_dive")?.achieved).toBe(true);
    expect(achievements.find((a) => a.id === "skills_audit")?.achieved).toBe(false);
  });
});

describe("deriveMinutesRemaining", () => {
  it("sums the leading number out of every not-yet-completed module's duration", () => {
    // 12 (core-compass, available) + 25 (deep-dive, locked) + 15 (skills-audit, locked)
    expect(deriveMinutesRemaining(makeSnapshot())).toBe(52);
  });

  it("excludes completed modules from the total", () => {
    const snapshot = makeSnapshot({
      modules: [
        { ...makeSnapshot().modules[0]!, status: "completed" },
        makeSnapshot().modules[1]!,
        makeSnapshot().modules[2]!,
      ],
    });
    // 25 (deep-dive) + 15 (skills-audit) — core-compass's 12 is excluded
    expect(deriveMinutesRemaining(snapshot)).toBe(40);
  });

  it("returns 0 once every module is completed", () => {
    const snapshot = makeSnapshot({
      modules: makeSnapshot().modules.map((m) => ({ ...m, status: "completed" as const })),
    });
    expect(deriveMinutesRemaining(snapshot)).toBe(0);
  });
});
