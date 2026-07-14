import { average, percentage, tally } from "@/lib/admin/analytics/aggregate";

/**
 * A flattened, DB-shape-independent view of one question-scoped
 * analytics_events row — everything downstream (metrics, health score,
 * insights) is a pure function over an array of these, so it's testable
 * without a database. See lib/admin/analytics/question-queries.ts for the
 * DB → this-shape mapping.
 */
export interface QuestionEventRecord {
  eventName: string;
  sessionId: string;
  occurredAt: string;
  /** e.g. { selectedAnswer, previousAnswer, timeSpentMs, isFirstVisit, attemptNumber } */
  metadata: Record<string, unknown>;
}

export interface TimeStats {
  avgMs: number | null;
  medianMs: number | null;
  fastestMs: number | null;
  slowestMs: number | null;
  sampleCount: number;
}

export interface QuestionMetrics {
  views: number;
  revisits: number;
  answers: number;
  changes: number;
  skips: number;
  completions: number;
  abandonments: number;
  completionRatePct: number | null;
  dropOffRatePct: number | null;
  revisitRatePct: number | null;
  skipRatePct: number | null;
  abandonmentRatePct: number | null;
  answerChangeRatePct: number | null;
  time: TimeStats;
  /** Each session's *final* selected answer (letter/value), tallied. */
  answerDistribution: Record<string, number>;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function numberMetadata(record: QuestionEventRecord, key: string): number | null {
  const value = record.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringMetadata(record: QuestionEventRecord, key: string): string | null {
  const value = record.metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Time-spent stats from question_time_spent events. A session can
 * contribute more than one sample (view → go back → view again both count
 * — "how long did people spend looking at this, each time"), which is
 * intentional, not a dedup bug.
 */
export function computeTimeStats(events: QuestionEventRecord[]): TimeStats {
  const samples = events
    .filter((e) => e.eventName === "question_time_spent")
    .map((e) => numberMetadata(e, "timeSpentMs"))
    .filter((ms): ms is number => ms !== null && ms >= 0);

  if (samples.length === 0) {
    return { avgMs: null, medianMs: null, fastestMs: null, slowestMs: null, sampleCount: 0 };
  }

  return {
    avgMs: average(samples),
    medianMs: median(samples),
    fastestMs: Math.min(...samples),
    slowestMs: Math.max(...samples),
    sampleCount: samples.length,
  };
}

/**
 * Each session's *final* answer for this question — the last
 * question_answered/question_answer_changed event by timestamp, per
 * session. This is what "answer distribution" should tally: a session
 * that picked A then changed to B should count once, as B, not twice.
 */
export function computeSessionFinalAnswers(
  events: QuestionEventRecord[],
): Map<string, string> {
  const answerEvents = events
    .filter((e) => e.eventName === "question_answered" || e.eventName === "question_answer_changed")
    .slice()
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const finalBySession = new Map<string, string>();
  for (const event of answerEvents) {
    const answer = stringMetadata(event, "selectedAnswer");
    if (!answer) continue;
    finalBySession.set(event.sessionId, answer);
  }
  return finalBySession;
}

export function computeAnswerDistribution(events: QuestionEventRecord[]): Record<string, number> {
  const finalAnswers = [...computeSessionFinalAnswers(events).values()];
  const entries = tally(finalAnswers, (answer) => answer);
  return Object.fromEntries(entries.map((e) => [e.key, e.count]));
}

function uniqueSessionCount(events: QuestionEventRecord[], eventNames: string[]): number {
  const sessions = new Set(
    events.filter((e) => eventNames.includes(e.eventName)).map((e) => e.sessionId),
  );
  return sessions.size;
}

function countByName(events: QuestionEventRecord[], eventName: string): number {
  return events.filter((e) => e.eventName === eventName).length;
}

/**
 * Composes every per-question metric the Phase 3 brief asks for from one
 * flat event list. Pure — no I/O, no Date.now(), fully deterministic given
 * the same input.
 */
export function computeQuestionMetrics(events: QuestionEventRecord[]): QuestionMetrics {
  // "Views" = count of question_viewed (fires once per session, the first
  // time it sees this question — see QuestionScreen.tsx), which doubles as
  // an approximate unique-viewer count without needing session dedup here.
  const views = countByName(events, "question_viewed");
  const revisits = countByName(events, "question_revisited");
  const skips = countByName(events, "question_skipped");
  const completions = countByName(events, "question_completed");
  const abandonments = countByName(events, "question_abandoned");
  const changes = countByName(events, "question_answer_changed");
  const answers = uniqueSessionCount(events, ["question_answered", "question_answer_changed"]);

  return {
    views,
    revisits,
    answers,
    changes,
    skips,
    completions,
    abandonments,
    completionRatePct: percentage(completions, views),
    dropOffRatePct: views > 0 ? percentage(Math.max(views - completions, 0), views) : null,
    revisitRatePct: percentage(revisits, views),
    skipRatePct: percentage(skips, views),
    abandonmentRatePct: percentage(abandonments, views),
    answerChangeRatePct: percentage(changes, answers),
    time: computeTimeStats(events),
    answerDistribution: computeAnswerDistribution(events),
  };
}
