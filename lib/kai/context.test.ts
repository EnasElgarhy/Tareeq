import { describe, expect, it } from "vitest";
import { assertNoExcludedFields, buildKaiContext } from "./context";
import type { ProfileSnapshot } from "@/lib/profile/journey";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import type { CompassResult } from "@/lib/scoring";

function makeCompassResult(overrides: Partial<CompassResult> = {}): CompassResult {
  return {
    cluster: { TECH: 8, ENG: 2, SCI: 1, ART: 0, BUS: 0, LAW: 0, PPL: 1, ENV: 0 },
    clusterRaw: { TECH: 8, ENG: 2, SCI: 1, ART: 0, BUS: 0, LAW: 0, PPL: 1, ENV: 0 },
    clusterBonus: { TECH: 1, ENG: 0, SCI: 0, ART: 0, BUS: 0, LAW: 0, PPL: 0, ENV: 0 },
    clusterFinal: { TECH: 9, ENG: 2, SCI: 1, ART: 0, BUS: 0, LAW: 0, PPL: 1, ENV: 0 },
    clusterRankedRaw: [
      ["TECH", 8],
      ["ENG", 2],
      ["PPL", 1],
    ],
    clusterRanked: [
      ["TECH", 9],
      ["ENG", 2],
      ["PPL", 1],
    ],
    topCluster: "TECH",
    primaryClusterScore: 9,
    confidencePercentage: 82,
    confidenceLabel: "High",
    isMultiCurious: false,
    multiCuriousClusters: [],
    archetype: "Explorer",
    archetypeDesc: "Flexible and broad-scoped.",
    driver: { REC: 1, IMP: 1, AUT: 6, MAS: 2, STA: 0 },
    driverRanked: [
      ["AUT", 6],
      ["MAS", 2],
    ],
    primaryDriver: "AUT",
    secondaryDriver: "MAS",
    primaryDrivers: ["AUT"],
    secondaryDrivers: ["MAS"],
    motivationLabel: "Autonomy",
    driverNames: {
      REC: "Recognition",
      IMP: "Impact",
      AUT: "Autonomy",
      MAS: "Mastery",
      STA: "Stability",
    },
    ecosystemFit: "Solo Sprinter",
    socialPos: 30,
    envPos: 60,
    procPos: 40,
    scopePos: 70,
    axes: {
      processing: "FLEX",
      scope: "BROAD",
      social: { collaborative: 1, independent: 2 },
      environment: { dynamic: 2, predictable: 1 },
    },
    ...overrides,
  } as CompassResult;
}

function makeReport(
  overrides: Partial<PersonalizedCompassReport> = {},
): PersonalizedCompassReport {
  return {
    generatedAt: "2026-07-01T00:00:00.000Z",
    source: "claude",
    model: "claude-sonnet-4-20250514",
    clusterCode: "TECH",
    clusterName: "Technology",
    isMultiCurious: false,
    multiCuriousClusters: [],
    archetype: "Explorer",
    primaryDriver: "Autonomy",
    secondaryDriver: "Mastery",
    ecosystemFit: "Solo Sprinter",
    headline: "Your curiosity points toward Technology.",
    summary: "A direction to test, not a box to live inside.",
    academicPath: "Academic path text.",
    careerLandscape: "Career landscape text.",
    integration: "Integration text.",
    realityCheck: "Reality check text.",
    nextSteps: "Next steps text.",
    highSchoolSubjects: ["Computer Science", "Mathematics"],
    universityMajors: ["Computer Science", "Software Engineering"],
    careerExamples: ["Software Engineer", "Data Engineer"],
    nonObviousPaths: ["Technical Product Manager"],
    score: makeCompassResult(),
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  // Distinguish "not provided" (default to a fixture report) from an
  // explicit `coreReport: null` override (the no-result-yet test cases) —
  // `overrides.coreReport ?? makeReport()` would incorrectly treat an
  // explicit null the same as "not provided".
  const coreReport = "coreReport" in overrides ? overrides.coreReport! : makeReport();
  const modules: ProfileSnapshot["modules"] = [
    {
      id: "core-compass",
      name: "CORE Compass",
      tagline: "Your career direction in 40 questions.",
      description: "desc",
      durationLabel: "12 min",
      icon: "compass",
      status: coreReport ? "completed" : "available",
      completedAt: coreReport?.generatedAt ?? null,
      route: "/results",
    },
    {
      id: "deep-dive",
      name: "Deep Dive Interview",
      tagline: "tagline",
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
      tagline: "tagline",
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
    coreReport,
    modules,
    completedCount: coreReport ? 1 : 0,
    totalCount: modules.length,
    completionPct: coreReport ? Math.round((1 / modules.length) * 100) : 0,
    hasAnyResult: Boolean(coreReport),
    ...overrides,
  };
}

describe("buildKaiContext — with a completed assessment", () => {
  it("maps the deterministic assessment fields the user already sees", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot(),
    });

    expect(context.assessment).toEqual({
      primaryCluster: "Technology",
      confidence: 82,
      archetype: "Explorer",
      rewardDriver: "Autonomy",
      ecosystemFit: "Solo Sprinter",
      topClusters: ["Technology", "Engineering", "People and Psychology"],
    });
  });

  it("maps the report's already-published narrative fields", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot(),
    });

    expect(context.report).toEqual({
      headline: "Your curiosity points toward Technology.",
      summary: "A direction to test, not a box to live inside.",
      recommendedMajors: ["Computer Science", "Software Engineering"],
      recommendedCareers: ["Software Engineer", "Data Engineer"],
    });
  });

  it("caps topClusters at 3 even when more are ranked", () => {
    const report = makeReport({
      score: makeCompassResult({
        clusterRanked: [
          ["TECH", 9],
          ["ENG", 5],
          ["SCI", 4],
          ["PPL", 3],
          ["ART", 1],
        ],
      }),
    });
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot({ coreReport: report }),
    });

    expect(context.assessment?.topClusters).toHaveLength(3);
  });

  it("splits journey modules into completed vs locked by name", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot(),
    });

    expect(context.journey).toEqual({
      completedAssessments: ["CORE Compass"],
      lockedModules: ["Deep Dive Interview", "Skills Audit"],
    });
  });

  it("includes the user's display name and locale", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "ar",
      snapshot: makeSnapshot(),
    });

    expect(context.user).toEqual({ displayName: "Ahmed", locale: "ar" });
  });
});

describe("buildKaiContext — missing result state", () => {
  it("returns null assessment/report when no CORE report exists yet", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot({ coreReport: null, completedCount: 0, hasAnyResult: false }),
    });

    expect(context.assessment).toBeNull();
    expect(context.report).toBeNull();
  });

  it("still returns a journey block (all modules locked/available, none completed)", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot({ coreReport: null, completedCount: 0, hasAnyResult: false }),
    });

    expect(context.journey.completedAssessments).toEqual([]);
  });

  it("falls back to a generic greeting name when displayName is blank", () => {
    const context = buildKaiContext({
      displayName: "   ",
      locale: "en",
      snapshot: makeSnapshot({ coreReport: null, completedCount: 0, hasAnyResult: false }),
    });

    expect(context.user.displayName).toBe("there");
  });
});

describe("buildKaiContext — no PII leakage", () => {
  it("never includes the registration email anywhere in the built context", () => {
    const snapshot = makeSnapshot({
      registration: {
        name: "Ahmed",
        email: "ahmed.secret@example.com",
        verifiedAt: "2026-07-01T00:00:00.000Z",
        consent: {
          generalResearch: true,
          longitudinalFollowup: false,
          universitySharing: false,
          ageGate: "adult",
          recordedAt: "2026-07-01T00:00:00.000Z",
          consentVersion: "v1",
          language: "en",
        },
      },
    });

    const context = buildKaiContext({ displayName: "Ahmed", locale: "en", snapshot });

    expect(JSON.stringify(context)).not.toContain("ahmed.secret@example.com");
  });

  it("never includes raw per-cluster score numbers, only ranked names", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot(),
    });

    const serialized = JSON.stringify(context);
    // clusterRaw/clusterBonus/clusterFinal values from the fixture (e.g. 9, 8)
    // must not leak through — only cluster *names* should appear.
    expect(context.assessment?.topClusters.every((c) => typeof c === "string")).toBe(
      true,
    );
    expect(serialized).not.toMatch(/"clusterRaw"|"clusterBonus"|"clusterFinal"/);
  });

  it("does not include the full raw answer digest", () => {
    const context = buildKaiContext({
      displayName: "Ahmed",
      locale: "en",
      snapshot: makeSnapshot(),
    });

    expect(JSON.stringify(context)).not.toContain('"answers"');
  });
});

describe("assertNoExcludedFields", () => {
  it("throws when an excluded field is present anywhere in the tree", () => {
    expect(() =>
      assertNoExcludedFields({ user: { displayName: "Ahmed", email: "leak@example.com" } }),
    ).toThrow(/excluded field/);
  });

  it("does not throw for a clean object", () => {
    expect(() =>
      assertNoExcludedFields({ user: { displayName: "Ahmed", locale: "en" } }),
    ).not.toThrow();
  });

  it("checks nested objects recursively, not just the top level", () => {
    expect(() =>
      assertNoExcludedFields({
        assessment: { nested: { deeply: { user_agent: "Mozilla/5.0" } } },
      }),
    ).toThrow(/excluded field/);
  });
});
