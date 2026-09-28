import type {
  AgeBand,
  CoreResultSummary,
  DataQualityMetrics,
  PeriodComparison,
  TrendDirection,
} from "@/lib/admin/analytics/types";

/**
 * Pure aggregation helpers for the admin Analytics surface. No I/O — every
 * function here takes plain data and returns plain data, so they're testable
 * without a database.
 */

export const RUSHED_THRESHOLD_SECONDS = 4 * 60;
export const VERY_LONG_THRESHOLD_SECONDS = 30 * 60;
export const ALL_SAME_ANSWER_MIN_COUNT = 5;

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  "under-16": "Under 16",
  "16-17": "16–17",
  "18-19": "18–19",
  "20-21": "20–21",
  "22+": "22+",
  unknown: "Unknown",
};

/** Seconds between start and completion, or null if unknown/invalid. */
export function durationSeconds(
  startedAt: string,
  completedAt: string | null,
): number | null {
  if (!completedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

export function isRushed(seconds: number | null): boolean {
  return seconds !== null && seconds < RUSHED_THRESHOLD_SECONDS;
}

export function isVeryLong(seconds: number | null): boolean {
  return seconds !== null && seconds > VERY_LONG_THRESHOLD_SECONDS;
}

function isLetterAnswer(value: string): boolean {
  return /^[a-z]$/i.test(value.trim());
}

export function countAnsweredQuestions(answers: unknown): number {
  if (!answers || typeof answers !== "object") return 0;
  return Object.keys(answers as Record<string, unknown>).length;
}

export function countMissingAnswers(
  answeredCount: number,
  expectedCount: number | null,
): number | null {
  if (expectedCount === null) return null;
  return Math.max(0, expectedCount - answeredCount);
}

/**
 * Flags a response set where every single-letter answer given is identical
 * (e.g. all "A"). Free-text answers are excluded — they're never letter-shaped
 * so they can't trigger a false positive on this pattern.
 */
export function isAllSameAnswerPattern(
  answers: unknown,
  minCount = ALL_SAME_ANSWER_MIN_COUNT,
): boolean {
  if (!answers || typeof answers !== "object") return false;
  const letterValues = Object.values(answers as Record<string, unknown>).filter(
    (v): v is string => typeof v === "string" && isLetterAnswer(v),
  );
  if (letterValues.length < minCount) return false;
  const normalized = letterValues.map((v) => v.trim().toUpperCase());
  return normalized.every((v) => v === normalized[0]);
}

export function isFlaggedRecord(input: {
  rushed: boolean;
  veryLong: boolean;
  allSameAnswer: boolean;
  missingCount: number | null;
}): boolean {
  return (
    input.rushed ||
    input.veryLong ||
    input.allSameAnswer ||
    (input.missingCount !== null && input.missingCount > 0)
  );
}

export function ageFromBirthYear(
  birthYear: number | null,
  referenceYear: number,
): number | null {
  if (birthYear === null || !Number.isFinite(birthYear)) return null;
  const age = referenceYear - birthYear;
  return age >= 0 && age < 120 ? age : null;
}

export function ageBandFromAge(age: number | null): AgeBand {
  if (age === null) return "unknown";
  if (age < 16) return "under-16";
  if (age <= 17) return "16-17";
  if (age <= 19) return "18-19";
  if (age <= 21) return "20-21";
  return "22+";
}

/** Rounded to one decimal place. Returns null when there's nothing to divide. */
export function percentage(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export interface TallyEntry {
  key: string;
  label: string;
  count: number;
  pct: number;
}

/** Tallies occurrences of a derived key, sorted by count descending. */
export function tally<T>(
  items: T[],
  keyFn: (item: T) => string,
  labelFn: (key: string) => string = (k) => k,
): TallyEntry[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = items.length;
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: labelFn(key),
      count,
      pct: percentage(count, total) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Percentage of identities (user_id, falling back to respondent email) that
 * appear more than once. Note: this measures "completed more than one
 * assessment", not "retook the same assessment" — see
 * ANALYTICS_PHASE_1_SUMMARY.md for why the latter isn't observable today.
 */
export function retakeRatePct(identityKeys: (string | null)[]): number | null {
  const counts = new Map<string, number>();
  for (const key of identityKeys) {
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const repeaters = [...counts.values()].filter((c) => c > 1).length;
  return percentage(repeaters, counts.size);
}

/**
 * Compares a current-period value to its previous-period baseline. A zero
 * baseline can't produce a percentage (division by zero), so it reports
 * "new" instead of an infinite or fabricated delta.
 */
export function computeDelta(current: number, previous: number): PeriodComparison {
  if (previous === 0) {
    return {
      current,
      previous,
      deltaPct: null,
      direction: current === 0 ? "none" : "new",
    };
  }
  const deltaPct = Math.round(((current - previous) / previous) * 1000) / 10;
  const direction: TrendDirection =
    Math.abs(deltaPct) < 0.5 ? "flat" : deltaPct > 0 ? "up" : "down";
  return { current, previous, deltaPct, direction };
}

export function qualityScorePct(quality: DataQualityMetrics): number | null {
  return percentage(quality.cleanCount, quality.totalCount);
}

/**
 * Compares two percentage-point values (e.g. completion rate 55% vs 50%) as
 * a point difference rather than a relative change — "+5 pts", not "+10%".
 * Use this for rate-shaped KPIs; use `computeDelta` for volume/count KPIs.
 */
export function comparePoints(current: number, previous: number): PeriodComparison {
  const delta = Math.round((current - previous) * 10) / 10;
  const direction: TrendDirection =
    Math.abs(delta) < 0.5 ? "flat" : delta > 0 ? "up" : "down";
  return { current, previous, deltaPct: delta, direction };
}

/**
 * Like `comparePoints`, but for rate-shaped metrics where the previous
 * period had zero underlying rows (not just a 0% rate) — that's "no
 * baseline to compare against", not a real 0%, so it reports "new"/"none"
 * instead of a possibly-misleading point delta (e.g. "+100 pts").
 *
 * `hasCurrentSample` defaults to `current > 0` for backward compatibility,
 * but callers whose metric can be a legitimate 0% on real data (e.g. a
 * data-quality score computed from actual flagged records) should pass the
 * real current-period sample size explicitly — otherwise a genuine 0% gets
 * misreported as "none" ("no data yet"), which reads as a contradiction
 * next to any UI that also shows a real, non-zero-sample-based figure for
 * that same period (e.g. an alert citing the same score).
 */
export function comparePointsWithBaseline(
  current: number,
  previous: number,
  hasPreviousBaseline: boolean,
  hasCurrentSample: boolean = current > 0,
): PeriodComparison {
  if (!hasPreviousBaseline) {
    return {
      current,
      previous: 0,
      deltaPct: null,
      direction: hasCurrentSample ? "new" : "none",
    };
  }
  return comparePoints(current, previous);
}

/**
 * Type-guards the CompassResult-shaped jsonb blob a CORE assessment row
 * stores in `assessments.result` (see consumer `lib/scoring/types.ts`).
 * Returns null for Custom-assessment results, which use a different
 * named-profile shape entirely.
 */
export function extractCoreResult(result: unknown): CoreResultSummary | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  const topCluster = typeof r.topCluster === "string" ? r.topCluster : null;
  const archetype = typeof r.archetype === "string" ? r.archetype : null;
  const primaryDriver =
    typeof r.primaryDriver === "string" ? r.primaryDriver : null;
  const secondaryDriver =
    typeof r.secondaryDriver === "string" ? r.secondaryDriver : null;
  const ecosystemFit =
    typeof r.ecosystemFit === "string" ? r.ecosystemFit : null;

  if (!topCluster && !archetype) return null;
  return { topCluster, archetype, primaryDriver, secondaryDriver, ecosystemFit };
}
