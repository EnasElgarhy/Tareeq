import type { TimeRange, TimeSeriesPoint } from "@/lib/admin/analytics/types";

/**
 * Pure time-series bucketing for the Growth charts. Takes a `now` parameter
 * everywhere instead of reading the clock itself, so it's deterministic and
 * testable.
 */

type BucketUnit = "day" | "week" | "month";

interface RangeConfig {
  days: number;
  bucket: BucketUnit;
}

export const RANGE_CONFIG: Record<TimeRange, RangeConfig> = {
  "7d": { days: 7, bucket: "day" },
  "30d": { days: 30, bucket: "day" },
  "90d": { days: 90, bucket: "week" },
  "12m": { days: 365, bucket: "month" },
};

export const RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
};

function bucketStart(date: Date, unit: BucketUnit): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  if (unit === "day") return d;
  if (unit === "month") {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }
  const dow = d.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + mondayOffset);
  return d;
}

function advanceBucket(date: Date, unit: BucketUnit): Date {
  const d = new Date(date);
  if (unit === "day") d.setUTCDate(d.getUTCDate() + 1);
  else if (unit === "week") d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Ordered bucket-start dates covering the range, ending at `now`'s bucket. */
export function buildBucketDates(now: Date, range: TimeRange): Date[] {
  const { days, bucket } = RANGE_CONFIG[range];
  const to = bucketStart(now, bucket);
  const from = bucketStart(
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
    bucket,
  );
  const dates: Date[] = [];
  let cursor = from;
  while (cursor.getTime() <= to.getTime()) {
    dates.push(cursor);
    cursor = advanceBucket(cursor, bucket);
  }
  return dates;
}

/** Zero-filled count series: how many timestamps fall in each bucket. */
export function buildCountSeries(
  timestamps: (string | null)[],
  now: Date,
  range: TimeRange,
): TimeSeriesPoint[] {
  const { bucket } = RANGE_CONFIG[range];
  const dates = buildBucketDates(now, range);
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    if (!ts) continue;
    const parsed = new Date(ts);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = isoDate(bucketStart(parsed, bucket));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return dates.map((d) => {
    const key = isoDate(d);
    return { date: key, value: counts.get(key) ?? 0 };
  });
}

/** Zero-filled average series: the mean of `valueOf(item)` per bucket. */
export function buildAverageSeries<T>(
  items: T[],
  dateOf: (item: T) => string | null,
  valueOf: (item: T) => number | null,
  now: Date,
  range: TimeRange,
): TimeSeriesPoint[] {
  const { bucket } = RANGE_CONFIG[range];
  const dates = buildBucketDates(now, range);
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const item of items) {
    const raw = dateOf(item);
    const value = valueOf(item);
    if (!raw || value === null) continue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = isoDate(bucketStart(parsed, bucket));
    sums.set(key, (sums.get(key) ?? 0) + value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return dates.map((d) => {
    const key = isoDate(d);
    const count = counts.get(key) ?? 0;
    const sum = sums.get(key) ?? 0;
    return { date: key, value: count > 0 ? Math.round(sum / count) : 0 };
  });
}

/**
 * Zero-filled ratio series (e.g. completion rate over time): for each
 * bucket, the percentage of items where `isNumerator` holds, among items
 * dated into that bucket. Empty buckets report 0 rather than null so the
 * chart line stays continuous.
 */
export function buildRatioSeries<T>(
  items: T[],
  dateOf: (item: T) => string | null,
  isNumerator: (item: T) => boolean,
  now: Date,
  range: TimeRange,
): TimeSeriesPoint[] {
  const { bucket } = RANGE_CONFIG[range];
  const dates = buildBucketDates(now, range);
  const totals = new Map<string, number>();
  const nums = new Map<string, number>();
  for (const item of items) {
    const raw = dateOf(item);
    if (!raw) continue;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = isoDate(bucketStart(parsed, bucket));
    totals.set(key, (totals.get(key) ?? 0) + 1);
    if (isNumerator(item)) nums.set(key, (nums.get(key) ?? 0) + 1);
  }
  return dates.map((d) => {
    const key = isoDate(d);
    const total = totals.get(key) ?? 0;
    const num = nums.get(key) ?? 0;
    return {
      date: key,
      value: total > 0 ? Math.round((num / total) * 1000) / 10 : 0,
    };
  });
}
