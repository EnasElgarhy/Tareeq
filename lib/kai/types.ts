/**
 * Kai context — the shaped, privacy-scrubbed bundle of already-computed,
 * already-user-facing facts Kai is allowed to reason from. Nothing in this
 * shape is a "hidden" score the user hasn't already seen somewhere in their
 * Career Compass — see lib/kai/context.ts's doc comment for the exact rule.
 *
 * Phase 1 note: this type is used purely to build the deterministic Kai
 * Landing UI (greeting, opening insight, grounding card). No Gemini call
 * exists yet — see CONSUMER_2_ARCHITECTURE.md §4 for where this plugs in
 * once the chat surface is built.
 */

export interface KaiUserContext {
  displayName: string;
  locale: string;
}

export interface KaiAssessmentContext {
  primaryCluster: string;
  confidence: number;
  archetype: string;
  rewardDriver: string;
  ecosystemFit: string;
  /** Ranked cluster names, top cluster first (names only — no raw scores). */
  topClusters: string[];
}

export interface KaiReportContext {
  headline: string;
  summary: string;
  recommendedMajors: string[];
  recommendedCareers: string[];
}

export interface KaiJourneyContext {
  completedAssessments: string[];
  lockedModules: string[];
}

export interface KaiContext {
  user: KaiUserContext;
  /** Null when the user hasn't completed CORE yet — see the Phase 1 empty state. */
  assessment: KaiAssessmentContext | null;
  report: KaiReportContext | null;
  journey: KaiJourneyContext;
}
