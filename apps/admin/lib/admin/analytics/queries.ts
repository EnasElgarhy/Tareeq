import {
  AGE_BAND_LABELS,
  ageBandFromAge,
  ageFromBirthYear,
  average,
  comparePointsWithBaseline,
  computeDelta,
  countAnsweredQuestions,
  countMissingAnswers,
  durationSeconds,
  extractCoreResult,
  isAllSameAnswerPattern,
  isFlaggedRecord,
  isRushed,
  isVeryLong,
  percentage,
  qualityScorePct,
  retakeRatePct,
  tally,
} from "@/lib/admin/analytics/aggregate";
import { generateAlerts } from "@/lib/admin/analytics/alerts";
import {
  matchesFilters,
  matchesNonDateFilters,
} from "@/lib/admin/analytics/filters";
import { generateInsights } from "@/lib/admin/analytics/insights";
import { driverLabel } from "@/lib/admin/analytics/labels";
import {
  buildAverageSeries,
  buildCountSeries,
  buildRatioSeries,
} from "@/lib/admin/analytics/trends";
import type {
  AnalyticsFilters,
  AnalyticsViewModel,
  AssessmentType,
  CatalogOption,
  DataQualityMetrics,
  DemographicsBreakdown,
  DerivedRow,
  FunnelStage,
  HeroSparklines,
  OverviewMetrics,
  RawAssessmentRow,
  RawProfileRow,
  ResultsDistribution,
  TimeRange,
  TrendSeries,
} from "@/lib/admin/analytics/types";
import { countQuestionsByVersion } from "@/lib/admin/content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Read layer for /admin/analytics. Uses the service-role client (the admin
 * surface is already gated by requireAdmin), so RLS doesn't block reads.
 * Mirrors lib/admin/responses.ts: `select("*")` so an unapplied migration
 * (e.g. `education_level`, `consent_research` not yet present) degrades to
 * "unknown" instead of crashing the page.
 */

/** Most-recently-completed rows considered per page load. Phase 1 aggregates
 *  in JS (matching the house pattern in lib/admin/responses.ts) rather than
 *  pushing every filter into SQL, so this caps the work per request. */
export const ANALYTICS_ROW_LIMIT = 5000;

/** When no explicit date filter is set, comparisons default to this window. */
const DEFAULT_COMPARISON_WINDOW_DAYS = 30;

interface VersionMeta {
  catalogId: string | null;
  catalogLabel: string;
  assessmentType: AssessmentType;
  expectedCount: number | null;
}

async function buildVersionMeta(): Promise<Map<string, VersionMeta>> {
  const sb = createSupabaseAdminClient();
  const [{ data: versions, error: vErr }, { data: catalogs, error: cErr }, counts] =
    await Promise.all([
      sb.from("content_versions").select("id,label,catalog_id"),
      sb.from("assessments_catalog").select("id,name,assessment_type"),
      countQuestionsByVersion(),
    ]);
  if (vErr) throw new Error(vErr.message);
  if (cErr) throw new Error(cErr.message);

  const catalogById = new Map(
    (catalogs ?? []).map((c) => {
      const row = c as {
        id: string;
        name: Record<string, string> | null;
        assessment_type: AssessmentType;
      };
      return [row.id, row];
    }),
  );

  const meta = new Map<string, VersionMeta>();
  for (const v of versions ?? []) {
    const row = v as { id: string; label: string; catalog_id: string | null };
    const catalog = row.catalog_id ? catalogById.get(row.catalog_id) : undefined;
    meta.set(row.id, {
      catalogId: row.catalog_id,
      catalogLabel: catalog?.name?.en ?? row.label ?? "Legacy CORE assessment",
      assessmentType: catalog?.assessment_type ?? "core",
      expectedCount: counts[row.id] ?? null,
    });
  }
  return meta;
}

/** Catalog options for the assessment/catalog filter dropdown. */
export async function getCatalogOptions(): Promise<CatalogOption[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessments_catalog")
    .select("id,name,assessment_type")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      name: Record<string, string> | null;
      assessment_type: AssessmentType;
    };
    return {
      id: r.id,
      label: r.name?.en ?? "Untitled assessment",
      assessmentType: r.assessment_type,
    };
  });
}

async function fetchRawAssessments(): Promise<RawAssessmentRow[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessments")
    .select("*")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(ANALYTICS_ROW_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []) as RawAssessmentRow[];
}

async function fetchProfiles(
  userIds: string[],
): Promise<Map<string, RawProfileRow>> {
  if (userIds.length === 0) return new Map();
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.from("profiles").select("*").in("id", userIds);
  if (error) throw new Error(error.message);
  const map = new Map<string, RawProfileRow>();
  for (const row of data ?? []) {
    const r = row as RawProfileRow;
    map.set(r.id, r);
  }
  return map;
}

/** Account-creation timestamps for the "new users over time" Growth chart. */
async function fetchProfileCreatedDates(): Promise<string[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(ANALYTICS_ROW_LIMIT);
  if (error) return [];
  return (data ?? []).map((r) => (r as { created_at: string }).created_at);
}

function deriveRow(
  raw: RawAssessmentRow,
  profile: RawProfileRow | undefined,
  versionMeta: Map<string, VersionMeta>,
  referenceYear: number,
): DerivedRow {
  const meta = versionMeta.get(raw.version_id);
  const duration = durationSeconds(raw.started_at, raw.completed_at);
  const answeredCount = countAnsweredQuestions(raw.answers);
  const expectedCount = meta?.expectedCount ?? null;
  const missingCount = countMissingAnswers(answeredCount, expectedCount);
  const rushed = isRushed(duration);
  const veryLong = isVeryLong(duration);
  const allSame = isAllSameAnswerPattern(raw.answers);
  const age = ageFromBirthYear(profile?.birth_year ?? null, referenceYear);

  return {
    id: raw.id,
    identityKey: raw.user_id ?? raw.respondent_email ?? null,
    versionId: raw.version_id,
    catalogId: meta?.catalogId ?? null,
    catalogLabel: meta?.catalogLabel ?? "Unknown assessment",
    assessmentType: meta?.assessmentType ?? "core",
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    durationSeconds: duration,
    answeredCount,
    expectedCount,
    missingCount,
    isRushed: rushed,
    isVeryLong: veryLong,
    isAllSameAnswer: allSame,
    isFlagged: isFlaggedRecord({
      rushed,
      veryLong,
      allSameAnswer: allSame,
      missingCount,
    }),
    country: profile?.country ?? null,
    ageBand: ageBandFromAge(age),
    gender: profile?.gender ?? null,
    educationLevel: profile?.education_level ?? null,
    consentResearch: raw.consent_research ?? null,
    coreResult: extractCoreResult(raw.result),
  };
}

/**
 * Reads both the Phase 1 `event_type` (3-value, legacy) and Phase 2
 * `event_name` (full taxonomy, see lib/analytics/events.ts) columns so the
 * funnel counts real events regardless of which instrumentation wrote them.
 */
async function fetchFunnelEventCounts(
  assessmentIds: string[],
): Promise<{ viewed: number; downloadedOrShared: number }> {
  if (assessmentIds.length === 0) return { viewed: 0, downloadedOrShared: 0 };
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("analytics_events")
    .select("event_type,event_name")
    .in("assessment_id", assessmentIds);
  // Table may not exist yet if this migration hasn't been applied — degrade
  // to zero rather than crashing the whole analytics page.
  if (error) return { viewed: 0, downloadedOrShared: 0 };
  let viewed = 0;
  let downloadedOrShared = 0;
  for (const row of data ?? []) {
    const r = row as { event_type: string | null; event_name: string | null };
    const type = r.event_name ?? r.event_type;
    if (type === "results_viewed") viewed += 1;
    if (
      type === "results_downloaded" ||
      type === "results_shared" ||
      type === "result_downloaded" ||
      type === "result_shared"
    ) {
      downloadedOrShared += 1;
    }
  }
  return { viewed, downloadedOrShared };
}

/** % of rows with an explicit consent answer that consented — null if none asked. */
function consentRatePct(rows: DerivedRow[]): number | null {
  const asked = rows.filter((r) => r.consentResearch !== null);
  if (asked.length === 0) return null;
  return percentage(asked.filter((r) => r.consentResearch === true).length, asked.length);
}

function buildOverview(
  matched: DerivedRow[],
  totalUsers: number,
  newUsersThisWeek: number,
  newUsersThisMonth: number,
): OverviewMetrics {
  const completed = matched.filter((r) => r.completedAt !== null);
  const durations = completed
    .map((r) => r.durationSeconds)
    .filter((d): d is number => d !== null);
  const consentRows = matched.filter((r) => r.consentResearch !== null);

  return {
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalStarted: matched.length,
    totalCompleted: completed.length,
    completionRatePct: percentage(completed.length, matched.length),
    avgCompletionSeconds: average(durations),
    retakeRatePct: retakeRatePct(matched.map((r) => r.identityKey)),
    researchConsentRatePct: consentRatePct(matched),
    consentCollectedCount: consentRows.length,
  };
}

function buildFunnel(
  matched: DerivedRow[],
  eventCounts: { viewed: number; downloadedOrShared: number },
): FunnelStage[] {
  const completed = matched.filter((r) => r.completedAt !== null).length;
  return [
    { key: "started", label: "Started", count: matched.length },
    { key: "completed", label: "Completed", count: completed },
    {
      key: "viewed_results",
      label: "Viewed results",
      count: eventCounts.viewed,
    },
    {
      key: "downloaded_or_shared",
      label: "Downloaded / shared",
      count: eventCounts.downloadedOrShared,
    },
  ];
}

function buildDataQuality(rows: DerivedRow[]): DataQualityMetrics {
  const rushedCount = rows.filter((r) => r.isRushed).length;
  const veryLongCount = rows.filter((r) => r.isVeryLong).length;
  const allSameAnswerCount = rows.filter((r) => r.isAllSameAnswer).length;
  const missingAnswersCount = rows.filter((r) => (r.missingCount ?? 0) > 0).length;
  const suspiciousCount = rows.filter((r) => r.isFlagged).length;
  return {
    rushedCount,
    veryLongCount,
    allSameAnswerCount,
    missingAnswersCount,
    suspiciousCount,
    cleanCount: rows.length - suspiciousCount,
    totalCount: rows.length,
  };
}

function buildDemographics(matched: DerivedRow[]): DemographicsBreakdown {
  return {
    byCountry: tally(
      matched,
      (r) => r.country ?? "unknown",
      (k) => (k === "unknown" ? "Unknown" : k),
    ),
    byAgeBand: tally(
      matched,
      (r) => r.ageBand,
      (k) => AGE_BAND_LABELS[k as keyof typeof AGE_BAND_LABELS] ?? k,
    ),
    byGender: tally(
      matched,
      (r) => r.gender ?? "unknown",
      (k) => (k === "unknown" ? "Unknown" : k),
    ),
    byEducationLevel: tally(
      matched,
      (r) => r.educationLevel ?? "unknown",
      (k) => (k === "unknown" ? "Unknown" : k),
    ),
  };
}

function buildResultsDistribution(matched: DerivedRow[]): ResultsDistribution {
  const coreRows = matched.filter((r) => r.coreResult !== null);
  return {
    coreRowCount: coreRows.length,
    byCluster: tally(coreRows, (r) => r.coreResult?.topCluster ?? "unknown"),
    byArchetype: tally(coreRows, (r) => r.coreResult?.archetype ?? "unknown"),
    byPrimaryDriver: tally(
      coreRows,
      (r) => r.coreResult?.primaryDriver ?? "unknown",
      (k) => (k === "unknown" ? "Unknown" : driverLabel(k)),
    ),
    byEcosystemFit: tally(
      coreRows,
      (r) => r.coreResult?.ecosystemFit ?? "unknown",
    ),
  };
}

function buildGrowthSeries(
  matched: DerivedRow[],
  userCreatedDates: string[],
  now: Date,
  range: TimeRange,
): TrendSeries[] {
  const completedTimestamps = matched
    .filter((r) => r.completedAt !== null)
    .map((r) => r.completedAt);

  const identityCounts = new Map<string, number>();
  for (const r of matched) {
    if (!r.identityKey) continue;
    identityCounts.set(r.identityKey, (identityCounts.get(r.identityKey) ?? 0) + 1);
  }
  const retakeTimestamps = matched
    .filter(
      (r) =>
        r.identityKey &&
        (identityCounts.get(r.identityKey) ?? 0) > 1 &&
        r.completedAt !== null,
    )
    .map((r) => r.completedAt);

  return [
    {
      key: "assessments",
      label: "Assessments completed",
      points: buildCountSeries(completedTimestamps, now, range),
    },
    {
      key: "users",
      label: "New users",
      points: buildCountSeries(userCreatedDates, now, range),
    },
    {
      key: "completion_rate",
      label: "Completion rate",
      // Bucketed by start date (not completion date) so the full started
      // cohort — including never-completed rows — lands in the denominator.
      points: buildRatioSeries(
        matched,
        (r) => r.startedAt,
        (r) => r.completedAt !== null,
        now,
        range,
      ),
    },
    {
      key: "retakes",
      label: "Retakes",
      points: buildCountSeries(retakeTimestamps, now, range),
    },
  ];
}

/**
 * Small value-only series (fixed 30-day daily window, independent of the
 * Growth tab's range picker) feeding the Overview KPI hero sparklines.
 */
function buildHeroSparklines(matched: DerivedRow[], now: Date): HeroSparklines {
  const consentRows = matched.filter((r) => r.consentResearch !== null);
  return {
    totalCompleted: buildCountSeries(
      matched.filter((r) => r.completedAt !== null).map((r) => r.completedAt),
      now,
      "30d",
    ).map((p) => p.value),
    completionRatePct: buildRatioSeries(
      matched,
      (r) => r.startedAt,
      (r) => r.completedAt !== null,
      now,
      "30d",
    ).map((p) => p.value),
    avgCompletionSeconds: buildAverageSeries(
      matched,
      (r) => r.completedAt,
      (r) => r.durationSeconds,
      now,
      "30d",
    ).map((p) => p.value),
    researchConsentRatePct: buildRatioSeries(
      consentRows,
      (r) => r.completedAt ?? r.startedAt,
      (r) => r.consentResearch === true,
      now,
      "30d",
    ).map((p) => p.value),
    qualityScorePct: buildRatioSeries(
      matched,
      (r) => r.completedAt ?? r.startedAt,
      (r) => !r.isFlagged,
      now,
      "30d",
    ).map((p) => p.value),
  };
}

/**
 * Resolves the current/previous comparison windows used by KPI deltas and
 * insights. Falls back to "last 30 days vs the 30 days before that" when no
 * explicit date filter is set — the headline KPIs still reflect the full
 * filtered set; only the comparison deltas use this rolling window.
 */
function resolveComparisonWindow(filters: AnalyticsFilters, now: Date) {
  const currentEnd = filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : now;
  const currentStart = filters.from
    ? new Date(`${filters.from}T00:00:00.000Z`)
    : new Date(
        currentEnd.getTime() - DEFAULT_COMPARISON_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );
  const spanMs = Math.max(currentEnd.getTime() - currentStart.getTime(), 1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - spanMs);
  return { currentStart, currentEnd, previousStart, previousEnd };
}

function withinWindow(iso: string | null, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && t >= start.getTime() && t <= end.getTime();
}

async function getUserCounts(): Promise<{
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}> {
  const sb = createSupabaseAdminClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const head = { count: "exact" as const, head: true };
  const [total, week, month] = await Promise.all([
    sb.from("profiles").select("*", head),
    sb.from("profiles").select("*", head).gte("created_at", weekAgo),
    sb.from("profiles").select("*", head).gte("created_at", monthAgo),
  ]);
  return {
    totalUsers: total.count ?? 0,
    newUsersThisWeek: week.count ?? 0,
    newUsersThisMonth: month.count ?? 0,
  };
}

/** Assembles the full analytics view-model for the given filters and Growth range. */
export async function getAnalyticsViewModel(
  filters: AnalyticsFilters,
  range: TimeRange = "30d",
): Promise<AnalyticsViewModel> {
  const [versionMeta, raw, userCounts, catalogOptions, userCreatedDates] =
    await Promise.all([
      buildVersionMeta(),
      fetchRawAssessments(),
      getUserCounts(),
      getCatalogOptions(),
      fetchProfileCreatedDates(),
    ]);

  const userIds = [
    ...new Set(raw.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
  ];
  const profiles = await fetchProfiles(userIds);
  const now = new Date();
  const referenceYear = now.getFullYear();

  const allDerived = raw.map((r) =>
    deriveRow(r, profiles.get(r.user_id ?? ""), versionMeta, referenceYear),
  );
  const matched = allDerived.filter((row) => matchesFilters(row, filters));

  const eventCounts = await fetchFunnelEventCounts(matched.map((r) => r.id));

  const countryOptions = [
    ...new Set(allDerived.map((r) => r.country).filter((c): c is string => Boolean(c))),
  ].sort();
  const genderOptions = [
    ...new Set(allDerived.map((r) => r.gender).filter((g): g is string => Boolean(g))),
  ].sort();

  const { currentStart, currentEnd, previousStart, previousEnd } =
    resolveComparisonWindow(filters, now);
  const nonDateMatched = allDerived.filter((row) =>
    matchesNonDateFilters(row, filters),
  );
  const currentPeriodRows = nonDateMatched.filter((row) =>
    withinWindow(row.completedAt, currentStart, currentEnd),
  );
  const previousPeriodRows = nonDateMatched.filter((row) =>
    withinWindow(row.completedAt, previousStart, previousEnd),
  );

  const dataQuality = buildDataQuality(matched);
  const currentQuality = buildDataQuality(currentPeriodRows);
  const previousQuality = buildDataQuality(previousPeriodRows);
  const hasPreviousBaseline = previousPeriodRows.length > 0;
  // A rate/score metric can be a real, legitimate 0% when the current
  // period *does* have rows (e.g. every record flagged → 0% quality) — that
  // must not collapse into the "no data at all" ("none") case, which would
  // contradict any alert/tile elsewhere that reports the same real score.
  const hasCurrentSample = currentPeriodRows.length > 0;

  const comparisons = {
    totalCompleted: computeDelta(
      currentPeriodRows.filter((r) => r.completedAt !== null).length,
      previousPeriodRows.filter((r) => r.completedAt !== null).length,
    ),
    completionRatePct: comparePointsWithBaseline(
      percentage(
        currentPeriodRows.filter((r) => r.completedAt !== null).length,
        currentPeriodRows.length,
      ) ?? 0,
      percentage(
        previousPeriodRows.filter((r) => r.completedAt !== null).length,
        previousPeriodRows.length,
      ) ?? 0,
      hasPreviousBaseline,
      hasCurrentSample,
    ),
    avgCompletionSeconds: computeDelta(
      average(
        currentPeriodRows
          .map((r) => r.durationSeconds)
          .filter((d): d is number => d !== null),
      ) ?? 0,
      average(
        previousPeriodRows
          .map((r) => r.durationSeconds)
          .filter((d): d is number => d !== null),
      ) ?? 0,
    ),
    researchConsentRatePct: comparePointsWithBaseline(
      consentRatePct(currentPeriodRows) ?? 0,
      consentRatePct(previousPeriodRows) ?? 0,
      hasPreviousBaseline,
      hasCurrentSample,
    ),
    qualityScorePct: comparePointsWithBaseline(
      qualityScorePct(currentQuality) ?? 0,
      qualityScorePct(previousQuality) ?? 0,
      hasPreviousBaseline,
      hasCurrentSample,
    ),
  };

  return {
    generatedAt: now.toISOString(),
    filters,
    range,
    catalogOptions,
    countryOptions,
    genderOptions,
    totalRowsMatched: matched.length,
    truncated: raw.length >= ANALYTICS_ROW_LIMIT,
    overview: buildOverview(
      matched,
      userCounts.totalUsers,
      userCounts.newUsersThisWeek,
      userCounts.newUsersThisMonth,
    ),
    comparisons,
    growth: buildGrowthSeries(matched, userCreatedDates, now, range),
    heroSparklines: buildHeroSparklines(matched, now),
    insights: generateInsights(currentPeriodRows, previousPeriodRows),
    alerts: generateAlerts(matched),
    funnel: buildFunnel(matched, eventCounts),
    dataQuality,
    qualityScorePct: qualityScorePct(dataQuality),
    demographics: buildDemographics(matched),
    resultsDistribution: buildResultsDistribution(matched),
    flaggedRows: matched.filter((r) => r.isFlagged),
    rows: matched,
  };
}
