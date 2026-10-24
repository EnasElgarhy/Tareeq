import { flagPart, median, type PartFlags } from "@/lib/admin/analytics/core-flags";

/**
 * Time per question and fast-answer flags, per attempt (CORE spec §5).
 *
 * Two sources feed the same shape:
 * - `core_responses` rows (the spec's per-answer record: time on screen and
 *   screen position). Nothing writes these yet; once the consumer persists
 *   them they are the record of truth and carry the real attempt id.
 * - `question_*` analytics events, which the consumer already sends. They are
 *   keyed by the browser's own attempt id, which is not stored on the
 *   `assessments` row, so these attempts cannot be tied to a named student.
 *
 * Everything here is pure; timing-queries.ts does the database reads.
 */

export interface TimedResponse {
  questionId: string;
  part: number;
  timeMs: number;
  /** 1-based screen position of the chosen option; null when unknown. */
  position: number | null;
}

export type TimingSource = "responses" | "events";

export interface AttemptMeta {
  /** assessments.id for `responses`, the browser's attempt id for `events`. */
  attemptKey: string;
  source: TimingSource;
  /** Set only when the attempt is a stored `assessments` row. */
  assessmentId: string | null;
  respondentName: string | null;
  versionLabel: string | null;
  startedAt: string | null;
  src: string | null;
  post: string | null;
}

export interface PartTiming {
  part: number;
  answered: number;
  avgSeconds: number;
  medianSeconds: number;
  flags: PartFlags;
}

export interface AttemptTiming extends AttemptMeta {
  answered: number;
  avgSeconds: number;
  parts: PartTiming[];
  rushedParts: number[];
  samePositionParts: number[];
  /** The spec's rule: flagged when any part is. */
  flagged: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const ROUND_TO = 10;

function seconds(ms: number): number {
  return Math.round((ms / 1000) * ROUND_TO) / ROUND_TO;
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** "A" → 1 … CORE shows options in a fixed order, so the letter is the position. */
export function letterToPosition(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const letter = value.trim().toUpperCase();
  const index = LETTERS.indexOf(letter);
  if (index >= 0) return index + 1;
  const numeric = Number(letter);
  return Number.isInteger(numeric) && numeric >= 1 ? numeric : null;
}

/** CORE question ids are "P<part>-<nn>"; the events also carry the part as `pillar`. */
export function partOf(questionId: string, pillar: unknown): number | null {
  if (typeof pillar === "number" && Number.isInteger(pillar) && pillar >= 1) return pillar;
  const match = /^P(\d+)-/i.exec(questionId);
  return match ? Number(match[1]) : null;
}

/** One attempt's responses → averages and the spec's flags, part by part. */
export function summarizeAttempt(
  meta: AttemptMeta,
  responses: readonly TimedResponse[],
): AttemptTiming | null {
  if (responses.length === 0) return null;
  const partNumbers = [...new Set(responses.map((r) => r.part))].sort((a, b) => a - b);
  const parts = partNumbers.map((part): PartTiming => {
    const inPart = responses.filter((r) => r.part === part);
    const times = inPart.map((r) => r.timeMs);
    return {
      part,
      answered: inPart.length,
      avgSeconds: seconds(average(times)),
      medianSeconds: seconds(median(times)),
      flags: flagPart(inPart.map(({ timeMs, position }) => ({ timeMs, position }))),
    };
  });
  const rushedParts = parts.filter((p) => p.flags.rushed).map((p) => p.part);
  const samePositionParts = parts.filter((p) => p.flags.samePosition).map((p) => p.part);

  return {
    ...meta,
    answered: responses.length,
    avgSeconds: seconds(average(responses.map((r) => r.timeMs))),
    parts,
    rushedParts,
    samePositionParts,
    flagged: parts.some((p) => p.flags.flagged),
  };
}

// ---------------------------------------------------------------- core_responses

export interface CoreResponseRow {
  assessment_id: string;
  part: number;
  question_id: string;
  position_shown: number;
  time_on_screen_ms: number;
  is_redo: boolean;
}

/** A redone part replaces the flagged one (spec §5), as in the consumer's effectiveResponses(). */
export function responsesFromCoreRows(rows: readonly CoreResponseRow[]): TimedResponse[] {
  const redoneParts = new Set(rows.filter((r) => r.is_redo).map((r) => r.part));
  return rows
    .filter((r) => !redoneParts.has(r.part) || r.is_redo)
    .map((r) => ({
      questionId: r.question_id,
      part: r.part,
      timeMs: r.time_on_screen_ms,
      position: r.position_shown,
    }));
}

// ---------------------------------------------------------------- analytics events

export interface TimingEventRecord {
  eventName: string;
  assessmentId: string | null;
  assessmentVersion: string | null;
  questionId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

interface EventAttempt {
  events: TimingEventRecord[];
}

function stringMeta(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Question time per attempt from events. A question's time on screen is the
 * sum of every visit (going back and reading it again counts); its position
 * is the letter of the final answer. Questions with no time sample are left
 * out: the flag is about time, and an answer without it says nothing.
 */
function eventAttemptResponses({ events }: EventAttempt): TimedResponse[] {
  const timeByQuestion = new Map<string, number>();
  const pillarByQuestion = new Map<string, unknown>();
  const answerByQuestion = new Map<string, { at: string; letter: unknown }>();

  for (const event of events) {
    if (!event.questionId) continue;
    const id = event.questionId;
    if (!pillarByQuestion.has(id)) pillarByQuestion.set(id, event.metadata.pillar);
    if (event.eventName === "question_time_spent") {
      const ms = event.metadata.timeSpentMs;
      if (typeof ms === "number" && Number.isFinite(ms) && ms >= 0) {
        timeByQuestion.set(id, (timeByQuestion.get(id) ?? 0) + ms);
      }
    } else if (
      event.eventName === "question_answered" ||
      event.eventName === "question_answer_changed"
    ) {
      const previous = answerByQuestion.get(id);
      if (!previous || previous.at <= event.occurredAt) {
        answerByQuestion.set(id, { at: event.occurredAt, letter: event.metadata.selectedAnswer });
      }
    }
  }

  const responses: TimedResponse[] = [];
  for (const [questionId, timeMs] of timeByQuestion) {
    const part = partOf(questionId, pillarByQuestion.get(questionId));
    if (part === null) continue;
    responses.push({
      questionId,
      part,
      timeMs,
      position: letterToPosition(answerByQuestion.get(questionId)?.letter),
    });
  }
  return responses;
}

function eventAttemptMeta(attemptKey: string, events: TimingEventRecord[]): AttemptMeta {
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const attributed = sorted.find((e) => stringMeta(e.metadata, "src"));
  return {
    attemptKey,
    source: "events",
    assessmentId: null,
    respondentName: null,
    versionLabel: sorted.find((e) => e.assessmentVersion)?.assessmentVersion ?? null,
    startedAt: sorted[0]?.occurredAt ?? null,
    src: attributed ? stringMeta(attributed.metadata, "src") : null,
    post: attributed ? stringMeta(attributed.metadata, "post") : null,
  };
}

/** Groups question events by the browser's attempt id and summarises each attempt. */
export function attemptsFromEvents(events: readonly TimingEventRecord[]): AttemptTiming[] {
  const byAttempt = new Map<string, TimingEventRecord[]>();
  for (const event of events) {
    if (!event.assessmentId) continue;
    const list = byAttempt.get(event.assessmentId) ?? [];
    list.push(event);
    byAttempt.set(event.assessmentId, list);
  }

  const attempts: AttemptTiming[] = [];
  for (const [attemptKey, list] of byAttempt) {
    const summary = summarizeAttempt(
      eventAttemptMeta(attemptKey, list),
      eventAttemptResponses({ events: list }),
    );
    if (summary) attempts.push(summary);
  }
  return attempts;
}

// ---------------------------------------------------------------- list controls

export type FastFilter = "include" | "only" | "exclude";
export type TimingSortKey = "date" | "avg" | "fastest" | "flagged";
export type SortDirection = "asc" | "desc";

export interface TimingListParams {
  fast: FastFilter;
  sort: TimingSortKey;
  dir: SortDirection;
}

export const DEFAULT_TIMING_LIST_PARAMS: TimingListParams = {
  fast: "include",
  sort: "date",
  dir: "desc",
};

const FAST_FILTERS: readonly FastFilter[] = ["include", "only", "exclude"];
const SORT_KEYS: readonly TimingSortKey[] = ["date", "avg", "fastest", "flagged"];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const raw = Array.isArray(value) ? value[0] : value;
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function parseTimingListParams(
  searchParams: Record<string, string | string[] | undefined>,
): TimingListParams {
  return {
    fast: pick(searchParams.fast, FAST_FILTERS, DEFAULT_TIMING_LIST_PARAMS.fast),
    sort: pick(searchParams.sort, SORT_KEYS, DEFAULT_TIMING_LIST_PARAMS.sort),
    dir: pick(searchParams.dir, ["asc", "desc"] as const, DEFAULT_TIMING_LIST_PARAMS.dir),
  };
}

/** The most hurried part: the lowest median seconds of any part. */
export function fastestPartSeconds(attempt: AttemptTiming): number {
  return Math.min(...attempt.parts.map((p) => p.medianSeconds));
}

const SORT_VALUE: Record<TimingSortKey, (a: AttemptTiming) => number | string> = {
  date: (a) => a.startedAt ?? "",
  avg: (a) => a.avgSeconds,
  fastest: fastestPartSeconds,
  flagged: (a) => (a.flagged ? 1 : 0) * 1e6 - fastestPartSeconds(a),
};

export function applyTimingListParams(
  attempts: readonly AttemptTiming[],
  { fast, sort, dir }: TimingListParams,
): AttemptTiming[] {
  const filtered = attempts.filter((a) =>
    fast === "only" ? a.flagged : fast === "exclude" ? !a.flagged : true,
  );
  const value = SORT_VALUE[sort];
  const sign = dir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    const order =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right));
    return order * sign || a.attemptKey.localeCompare(b.attemptKey);
  });
}

export const CORE_PARTS = [1, 2, 3, 4] as const;
