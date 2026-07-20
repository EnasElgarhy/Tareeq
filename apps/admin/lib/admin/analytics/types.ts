/** Shared types for the admin Analytics surface (lib/admin/analytics/*). */

export type AgeBand = "under-16" | "16-17" | "18-19" | "20-21" | "22+" | "unknown";

export type FlaggedFilterMode = "include" | "only" | "exclude";

export type AssessmentType = "core" | "custom";

export interface AnalyticsFilters {
  /** Inclusive ISO date (yyyy-mm-dd), or null for no lower bound. */
  from: string | null;
  /** Inclusive ISO date (yyyy-mm-dd), or null for no upper bound. */
  to: string | null;
  /** Exact country value, or null for "all countries". */
  country: string | null;
  ageBand: AgeBand | null;
  /** Exact gender value, or null for "all genders". */
  gender: string | null;
  /**
   * `null` = all assessments, `"legacy-core"` = versions with no
   * `assessments_catalog` link, otherwise a catalog id.
   */
  catalogId: string | null;
  flagged: FlaggedFilterMode;
  /** Only rows with completed_at set. */
  completedOnly: boolean;
  /** Only rows with consent_research = true. */
  researchOnly: boolean;
}

export const DEFAULT_FILTERS: AnalyticsFilters = {
  from: null,
  to: null,
  country: null,
  ageBand: null,
  gender: null,
  catalogId: null,
  flagged: "include",
  completedOnly: false,
  researchOnly: false,
};

export type TimeRange = "7d" | "30d" | "90d" | "12m";

export interface TimeSeriesPoint {
  /** ISO date (yyyy-mm-dd) — the bucket's start. */
  date: string;
  value: number;
}

export interface TrendSeries {
  key: string;
  label: string;
  points: TimeSeriesPoint[];
}

export type TrendDirection = "up" | "down" | "flat" | "new" | "none";

export interface PeriodComparison {
  current: number;
  previous: number;
  /** null when there's no previous-period baseline to compare against. */
  deltaPct: number | null;
  direction: TrendDirection;
}

export type InsightSeverity = "positive" | "info" | "warning";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  text: string;
}

export type AlertSeverity = "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  text: string;
}

/** Raw `assessments` row as selected from Supabase (snake_case). */
export interface RawAssessmentRow {
  id: string;
  user_id: string | null;
  anon_session_id: string | null;
  respondent_email: string | null;
  version_id: string;
  locale: string | null;
  started_at: string;
  completed_at: string | null;
  answers: unknown;
  result: unknown;
  consent_research?: boolean | null;
}

/** Raw `profiles` row, the parts analytics needs. */
export interface RawProfileRow {
  id: string;
  country: string | null;
  birth_year: number | null;
  gender: string | null;
  education_level?: string | null;
}

/** The fields of CompassResult (consumer `lib/scoring/types.ts`) analytics reads. */
export interface CoreResultSummary {
  topCluster: string | null;
  archetype: string | null;
  primaryDriver: string | null;
  secondaryDriver: string | null;
  ecosystemFit: string | null;
}

export interface CatalogOption {
  id: string;
  label: string;
  assessmentType: AssessmentType;
}

/** One `assessments` row joined and enriched for analytics. */
export interface DerivedRow {
  id: string;
  /** Stable identity for retake grouping: user_id, else respondent_email. */
  identityKey: string | null;
  versionId: string;
  catalogId: string | null;
  catalogLabel: string;
  assessmentType: AssessmentType;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  answeredCount: number;
  /** Total questions in this version, or null if unknown (no content rows). */
  expectedCount: number | null;
  missingCount: number | null;
  isRushed: boolean;
  isVeryLong: boolean;
  isAllSameAnswer: boolean;
  isFlagged: boolean;
  country: string | null;
  ageBand: AgeBand;
  gender: string | null;
  educationLevel: string | null;
  consentResearch: boolean | null;
  coreResult: CoreResultSummary | null;
}

export interface OverviewMetrics {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalStarted: number;
  totalCompleted: number;
  completionRatePct: number | null;
  avgCompletionSeconds: number | null;
  retakeRatePct: number | null;
  /** null when no row has consent_research set (i.e. never collected). */
  researchConsentRatePct: number | null;
  consentCollectedCount: number;
}

export interface FunnelStage {
  key: "started" | "completed" | "viewed_results" | "downloaded_or_shared";
  label: string;
  count: number;
}

export interface DataQualityMetrics {
  rushedCount: number;
  veryLongCount: number;
  allSameAnswerCount: number;
  missingAnswersCount: number;
  suspiciousCount: number;
  cleanCount: number;
  totalCount: number;
}

export interface BreakdownEntry {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export interface DemographicsBreakdown {
  byCountry: BreakdownEntry[];
  byAgeBand: BreakdownEntry[];
  byGender: BreakdownEntry[];
  byEducationLevel: BreakdownEntry[];
}

export interface ResultsDistribution {
  /** Of rows shaped like a CORE result; custom-assessment rows are excluded. */
  coreRowCount: number;
  byCluster: BreakdownEntry[];
  byArchetype: BreakdownEntry[];
  byPrimaryDriver: BreakdownEntry[];
  byEcosystemFit: BreakdownEntry[];
}

/** Plain value arrays (no dates) for the small sparklines on Overview KPI heroes. */
export interface HeroSparklines {
  totalCompleted: number[];
  completionRatePct: number[];
  avgCompletionSeconds: number[];
  researchConsentRatePct: number[];
  qualityScorePct: number[];
}

export interface AnalyticsViewModel {
  generatedAt: string;
  filters: AnalyticsFilters;
  range: TimeRange;
  catalogOptions: CatalogOption[];
  countryOptions: string[];
  genderOptions: string[];
  /** Rows matched before pagination/row caps — drives "N matched" copy. */
  totalRowsMatched: number;
  /** True if fetchAnalyticsRows hit ANALYTICS_ROW_LIMIT and truncated. */
  truncated: boolean;
  overview: OverviewMetrics;
  comparisons: {
    totalCompleted: PeriodComparison;
    completionRatePct: PeriodComparison;
    avgCompletionSeconds: PeriodComparison;
    researchConsentRatePct: PeriodComparison;
    qualityScorePct: PeriodComparison;
  };
  growth: TrendSeries[];
  heroSparklines: HeroSparklines;
  insights: Insight[];
  alerts: Alert[];
  funnel: FunnelStage[];
  dataQuality: DataQualityMetrics;
  qualityScorePct: number | null;
  demographics: DemographicsBreakdown;
  resultsDistribution: ResultsDistribution;
  flaggedRows: DerivedRow[];
  rows: DerivedRow[];
}
