/**
 * Weekly "By source" report (developer questions, point 6): what each
 * marketing source and post brought in during one week.
 *
 * Attribution comes from analytics_events.metadata, written by the consumer
 * from the mmc_attr cookie (apps/consumer/lib/analytics/attribution.ts):
 * one key per utm tag: `src` (utm_source), `medium`, `campaign` and `post`
 * (utm_content) for the first touch, with a `_last` twin for the latest.
 * Events recorded before attribution shipped (22 Oct 2026) have neither.
 * Pure and safe for client components (the week picker): by-source-queries.ts
 * does the reads, by-source-csv.ts the export.
 */

export const REPORT_TIME_ZONE_OFFSET_HOURS = 4; // Asia/Dubai, no daylight saving.
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export type MetricKey =
  | "visits"
  | "starts"
  | "completions"
  | "parentAsks"
  | "payments"
  | "reportOpens"
  | "kaiOpens";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  /** Null when the consumer does not send this event yet. */
  eventName: string | null;
}

export const SOURCE_METRICS: readonly MetricDefinition[] = [
  { key: "visits", label: "Visits", eventName: "session_started" },
  { key: "starts", label: "Assessment starts", eventName: "assessment_started" },
  { key: "completions", label: "Completions", eventName: "assessment_completed" },
  { key: "parentAsks", label: "Ask-a-parent links sent", eventName: "parent_link_created" },
  { key: "payments", label: "Payments", eventName: "payment_succeeded" },
  { key: "reportOpens", label: "Report opens", eventName: "results_viewed" },
  { key: "kaiOpens", label: "Kai opens", eventName: "kai_opened" },
];

export const SOURCE_EVENT_NAMES: string[] = SOURCE_METRICS.flatMap((m) =>
  m.eventName ? [m.eventName] : [],
);

const METRIC_BY_EVENT = new Map(
  SOURCE_METRICS.filter((m) => m.eventName).map((m) => [m.eventName as string, m.key]),
);

/** Label for events with no source at all (before tracking, or cookie blocked). */
export const NO_SOURCE = "(not tagged)";

export type Touch = "first" | "last";
/** "post" pairs each source with its content tag; the others take one utm tag alone. */
export type GroupBy = "post" | "source" | "medium" | "campaign";

export interface GroupByOption {
  value: GroupBy;
  label: string;
  /** Header of the first column. */
  column: string;
}

export const GROUP_BY_OPTIONS: readonly GroupByOption[] = [
  { value: "post", label: "Source and content", column: "Source" },
  { value: "source", label: "Source (utm_source)", column: "Source" },
  { value: "medium", label: "Medium (utm_medium)", column: "Medium" },
  { value: "campaign", label: "Campaign (utm_campaign)", column: "Campaign" },
];

export function groupByOption(groupBy: GroupBy): GroupByOption {
  return GROUP_BY_OPTIONS.find((o) => o.value === groupBy) ?? GROUP_BY_OPTIONS[0];
}

/** The metadata key the first column reads, per touch. */
const GROUP_KEY: Record<GroupBy, string> = {
  post: "src",
  source: "src",
  medium: "medium",
  campaign: "campaign",
};

export interface SourceEvent {
  eventName: string;
  metadata: Record<string, unknown>;
}

export type MetricCounts = Record<MetricKey, number | null>;

export interface SourceRow {
  /** The grouped tag's value: the source, medium or campaign. */
  source: string;
  /** The content tag; only set when grouping by source and content. */
  post: string | null;
  counts: MetricCounts;
}

export interface SourceReport {
  rows: SourceRow[];
  totals: MetricCounts;
}

// ---------------------------------------------------------------- weeks

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isoDate(utcMs: number): string {
  const d = new Date(utcMs);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** The Monday (in Dubai) of the week that contains `at`. */
export function weekStartFor(at: Date): string {
  const local = at.getTime() + REPORT_TIME_ZONE_OFFSET_HOURS * HOUR_MS;
  const dayFromMonday = (new Date(local).getUTCDay() + 6) % 7;
  return isoDate(local - dayFromMonday * DAY_MS);
}

export interface WeekBounds {
  weekStart: string;
  /** Sunday, for display. */
  weekEnd: string;
  startIso: string;
  endIso: string;
}

/** Monday 00:00 to the next Monday 00:00, Dubai time, as UTC instants. */
export function weekBounds(weekStart: string): WeekBounds {
  const startMs = Date.parse(`${weekStart}T00:00:00.000Z`) - REPORT_TIME_ZONE_OFFSET_HOURS * HOUR_MS;
  return {
    weekStart,
    weekEnd: isoDate(Date.parse(`${weekStart}T00:00:00.000Z`) + 6 * DAY_MS),
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(startMs + WEEK_MS).toISOString(),
  };
}

export function shiftWeek(weekStart: string, weeks: number): string {
  return isoDate(Date.parse(`${weekStart}T00:00:00.000Z`) + weeks * WEEK_MS);
}

/** The latest `count` weeks, newest first — the week picker's options. */
export function recentWeeks(now: Date, count: number): string[] {
  const current = weekStartFor(now);
  return Array.from({ length: count }, (_, i) => shiftWeek(current, -i));
}

function isMonday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return !Number.isNaN(ms) && isoDate(ms) === value && new Date(ms).getUTCDay() === 1;
}

export interface SourceReportParams {
  weekStart: string;
  touch: Touch;
  groupBy: GroupBy;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A week that is not a Monday, or is in the future, falls back to this week. */
export function parseSourceReportParams(
  searchParams: Record<string, string | string[] | undefined>,
  now: Date = new Date(),
): SourceReportParams {
  const current = weekStartFor(now);
  const week = first(searchParams.week);
  return {
    weekStart: week && isMonday(week) && week <= current ? week : current,
    touch: first(searchParams.touch) === "last" ? "last" : "first",
    groupBy: GROUP_BY_OPTIONS.find((o) => o.value === first(searchParams.groupBy))?.value ?? "post",
  };
}

// ---------------------------------------------------------------- aggregation

function label(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function emptyCounts(): MetricCounts {
  return Object.fromEntries(
    SOURCE_METRICS.map((m) => [m.key, m.eventName ? 0 : null]),
  ) as MetricCounts;
}

function increment(counts: MetricCounts, key: MetricKey): MetricCounts {
  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

/** Counts each metric's events per source (and post), busiest source first. */
export function aggregateBySource(
  events: readonly SourceEvent[],
  touch: Touch,
  groupBy: GroupBy,
): SourceReport {
  const suffix = touch === "first" ? "" : "_last";
  const sourceKey = `${GROUP_KEY[groupBy]}${suffix}`;
  const postKey = `post${suffix}`;
  const byKey = new Map<string, SourceRow>();
  let totals = emptyCounts();

  for (const event of events) {
    const metric = METRIC_BY_EVENT.get(event.eventName);
    if (!metric) continue;
    const source = label(event.metadata, sourceKey) ?? NO_SOURCE;
    const post = groupBy === "post" ? label(event.metadata, postKey) : null;
    const key = JSON.stringify([source, post]);
    const row = byKey.get(key) ?? { source, post, counts: emptyCounts() };
    byKey.set(key, { ...row, counts: increment(row.counts, metric) });
    totals = increment(totals, metric);
  }

  const rows = [...byKey.values()].sort(
    (a, b) =>
      Number(a.source === NO_SOURCE) - Number(b.source === NO_SOURCE) ||
      (b.counts.visits ?? 0) - (a.counts.visits ?? 0) ||
      a.source.localeCompare(b.source) ||
      (a.post ?? "").localeCompare(b.post ?? ""),
  );
  return { rows, totals };
}
