// Plain-data fixtures for e2e localStorage seeding — kept dependency-free
// (no runtime imports from the app) so the e2e suite never binds to
// internal module structure, only the public localStorage contract in
// lib/results/storage.ts. Shape mirrors the fixture in lib/kai/context.test.ts.

export const resultRegistrationStorageKey = "tareeq.result.registration.v1";
export const generatedReportStorageKey = "tareeq.result.report.v1";
export const localeStorageKey = "tareeq.locale";

export function makeResultRegistration(overrides: Record<string, unknown> = {}) {
  return {
    name: "Sara",
    email: "sara@example.com",
    verifiedAt: "2026-07-01T00:00:00.000Z",
    consent: {
      generalResearch: false,
      longitudinalFollowup: false,
      universitySharing: false,
      ageGate: "adult",
      recordedAt: "2026-07-01T00:00:00.000Z",
      consentVersion: "v1",
      language: "en",
    },
    ...overrides,
  };
}

export function makeCompassResult(overrides: Record<string, unknown> = {}) {
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
    archetype: "Catalyst",
    archetypeDesc: "Energizes and mobilizes the people around them.",
    driver: { REC: 1, IMP: 6, AUT: 1, MAS: 2, STA: 0 },
    driverRanked: [
      ["IMP", 6],
      ["MAS", 2],
    ],
    primaryDriver: "IMP",
    secondaryDriver: "MAS",
    primaryDrivers: ["IMP"],
    secondaryDrivers: ["MAS"],
    motivationLabel: "Impact",
    driverNames: {
      REC: "Recognition",
      IMP: "Impact",
      AUT: "Autonomy",
      MAS: "Mastery",
      STA: "Stability",
    },
    ecosystemFit: "High-Energy Team Player",
    socialPos: 70,
    envPos: 60,
    procPos: 40,
    scopePos: 70,
    axes: {
      processing: "FLEX",
      scope: "BROAD",
      social: { collaborative: 2, independent: 1 },
      environment: { dynamic: 2, predictable: 1 },
    },
    ...overrides,
  };
}

export function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: "2026-07-01T00:00:00.000Z",
    source: "claude",
    model: "claude-sonnet-4-20250514",
    clusterCode: "BUS",
    clusterName: "Business",
    isMultiCurious: false,
    multiCuriousClusters: [],
    archetype: "Catalyst",
    primaryDriver: "Impact",
    secondaryDriver: "Mastery",
    ecosystemFit: "High-Energy Team Player",
    headline: "Your curiosity points toward Business.",
    summary: "A direction to test, not a box to live inside.",
    academicPath: "Academic path text.",
    careerLandscape: "Career landscape text.",
    integration: "Integration text.",
    realityCheck: "Reality check text.",
    nextSteps: "Next steps text.",
    highSchoolSubjects: ["Business Studies", "Economics"],
    universityMajors: ["Business Administration", "Marketing"],
    careerExamples: ["Product Manager", "Growth Lead"],
    nonObviousPaths: ["Community Builder"],
    score: makeCompassResult(),
    ...overrides,
  };
}
