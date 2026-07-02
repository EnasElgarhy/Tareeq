import type { DerivedRow } from "@/lib/admin/analytics/types";

/** Shared DerivedRow builder for analytics unit tests. */
export function makeRow(overrides: Partial<DerivedRow> = {}): DerivedRow {
  return {
    id: "row-1",
    identityKey: "user-1",
    versionId: "version-1",
    catalogId: "catalog-1",
    catalogLabel: "CORE Assessment",
    assessmentType: "core",
    startedAt: "2026-06-01T10:00:00Z",
    completedAt: "2026-06-01T10:10:00Z",
    durationSeconds: 600,
    answeredCount: 40,
    expectedCount: 40,
    missingCount: 0,
    isRushed: false,
    isVeryLong: false,
    isAllSameAnswer: false,
    isFlagged: false,
    country: "UAE",
    ageBand: "18-19",
    gender: "F",
    educationLevel: null,
    consentResearch: null,
    coreResult: null,
    ...overrides,
  };
}
