import { createHash } from "node:crypto";
import type { AnalyticsViewModel, DerivedRow } from "@/lib/admin/analytics/types";

/**
 * CSV export for the admin Analytics surface. Anonymized exports use a
 * one-way hash of `user_id` instead of the raw id, name, or email — per the
 * privacy rule that research-facing exports must not expose identity.
 */

export type CsvValue = string | number | boolean | null;

export interface CsvColumn<T> {
  key: string;
  header: string;
  value: (row: T) => CsvValue;
}

function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(c.value(row))).join(","),
  );
  return [header, ...lines].join("\r\n") + "\r\n";
}

/**
 * One-way pseudonymous id for research exports. Requires ANALYTICS_HASH_SALT
 * so the mapping can't be brute-forced from a known user_id list — fails
 * fast rather than silently exporting with a weak/guessable default.
 */
export function hashUserId(userId: string): string {
  const salt = process.env.ANALYTICS_HASH_SALT;
  if (!salt) {
    throw new Error(
      "ANALYTICS_HASH_SALT is not set. Set it in the environment before exporting anonymized data.",
    );
  }
  return createHash("sha256").update(`${salt}:${userId}`).digest("hex").slice(0, 16);
}

function anonymizedIdentity(row: DerivedRow): string {
  return row.identityKey ? hashUserId(row.identityKey) : "anonymous";
}

const ANONYMIZED_COLUMNS: CsvColumn<DerivedRow>[] = [
  { key: "user_id_hash", header: "user_id_hash", value: anonymizedIdentity },
  { key: "catalog_label", header: "assessment", value: (r) => r.catalogLabel },
  { key: "assessment_type", header: "assessment_type", value: (r) => r.assessmentType },
  { key: "completed_at", header: "completed_at", value: (r) => r.completedAt },
  { key: "duration_seconds", header: "duration_seconds", value: (r) => r.durationSeconds },
  { key: "country", header: "country", value: (r) => r.country },
  { key: "age_band", header: "age_band", value: (r) => r.ageBand },
  { key: "gender", header: "gender", value: (r) => r.gender },
  { key: "education_level", header: "education_level", value: (r) => r.educationLevel },
  { key: "top_cluster", header: "top_cluster", value: (r) => r.coreResult?.topCluster ?? null },
  { key: "archetype", header: "archetype", value: (r) => r.coreResult?.archetype ?? null },
  {
    key: "primary_driver",
    header: "primary_driver",
    value: (r) => r.coreResult?.primaryDriver ?? null,
  },
  {
    key: "ecosystem_fit",
    header: "ecosystem_fit",
    value: (r) => r.coreResult?.ecosystemFit ?? null,
  },
  { key: "is_flagged", header: "is_flagged", value: (r) => r.isFlagged },
];

const FLAGGED_COLUMNS: CsvColumn<DerivedRow>[] = [
  ...ANONYMIZED_COLUMNS,
  { key: "is_rushed", header: "is_rushed", value: (r) => r.isRushed },
  { key: "is_very_long", header: "is_very_long", value: (r) => r.isVeryLong },
  {
    key: "is_all_same_answer",
    header: "is_all_same_answer",
    value: (r) => r.isAllSameAnswer,
  },
  { key: "missing_count", header: "missing_answer_count", value: (r) => r.missingCount },
];

export function buildAnonymizedRowsCsv(rows: DerivedRow[]): string {
  return rowsToCsv(rows, ANONYMIZED_COLUMNS);
}

export function buildFlaggedRowsCsv(rows: DerivedRow[]): string {
  return rowsToCsv(
    rows.filter((r) => r.isFlagged),
    FLAGGED_COLUMNS,
  );
}

interface SummaryRow {
  section: string;
  metric: string;
  value: CsvValue;
}

export function buildSummaryCsv(vm: AnalyticsViewModel): string {
  const rows: SummaryRow[] = [
    { section: "overview", metric: "total_users", value: vm.overview.totalUsers },
    {
      section: "overview",
      metric: "new_users_this_week",
      value: vm.overview.newUsersThisWeek,
    },
    {
      section: "overview",
      metric: "new_users_this_month",
      value: vm.overview.newUsersThisMonth,
    },
    { section: "overview", metric: "total_started", value: vm.overview.totalStarted },
    { section: "overview", metric: "total_completed", value: vm.overview.totalCompleted },
    {
      section: "overview",
      metric: "completion_rate_pct",
      value: vm.overview.completionRatePct,
    },
    {
      section: "overview",
      metric: "avg_completion_seconds",
      value: vm.overview.avgCompletionSeconds,
    },
    { section: "overview", metric: "retake_rate_pct", value: vm.overview.retakeRatePct },
    {
      section: "overview",
      metric: "research_consent_rate_pct",
      value: vm.overview.researchConsentRatePct,
    },
    ...vm.funnel.map((stage) => ({
      section: "funnel",
      metric: stage.key,
      value: stage.count,
    })),
    { section: "data_quality", metric: "rushed_count", value: vm.dataQuality.rushedCount },
    {
      section: "data_quality",
      metric: "very_long_count",
      value: vm.dataQuality.veryLongCount,
    },
    {
      section: "data_quality",
      metric: "all_same_answer_count",
      value: vm.dataQuality.allSameAnswerCount,
    },
    {
      section: "data_quality",
      metric: "missing_answers_count",
      value: vm.dataQuality.missingAnswersCount,
    },
    {
      section: "data_quality",
      metric: "suspicious_count",
      value: vm.dataQuality.suspiciousCount,
    },
    { section: "data_quality", metric: "clean_count", value: vm.dataQuality.cleanCount },
    ...vm.demographics.byCountry.map((e) => ({
      section: "demographics_country",
      metric: e.label,
      value: e.count,
    })),
    ...vm.demographics.byAgeBand.map((e) => ({
      section: "demographics_age_band",
      metric: e.label,
      value: e.count,
    })),
    ...vm.demographics.byGender.map((e) => ({
      section: "demographics_gender",
      metric: e.label,
      value: e.count,
    })),
    ...vm.demographics.byEducationLevel.map((e) => ({
      section: "demographics_education_level",
      metric: e.label,
      value: e.count,
    })),
    ...vm.resultsDistribution.byCluster.map((e) => ({
      section: "results_cluster",
      metric: e.label,
      value: e.count,
    })),
    ...vm.resultsDistribution.byArchetype.map((e) => ({
      section: "results_archetype",
      metric: e.label,
      value: e.count,
    })),
    ...vm.resultsDistribution.byPrimaryDriver.map((e) => ({
      section: "results_primary_driver",
      metric: e.label,
      value: e.count,
    })),
    ...vm.resultsDistribution.byEcosystemFit.map((e) => ({
      section: "results_ecosystem_fit",
      metric: e.label,
      value: e.count,
    })),
  ];

  return rowsToCsv<SummaryRow>(rows, [
    { key: "section", header: "section", value: (r) => r.section },
    { key: "metric", header: "metric", value: (r) => r.metric },
    { key: "value", header: "value", value: (r) => r.value },
  ]);
}
