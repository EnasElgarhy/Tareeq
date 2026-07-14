import type { QuestionMetrics } from "@/lib/admin/analytics/question-events";
import type { HealthScoreResult } from "@/lib/admin/analytics/question-health";

/**
 * Old-wording-vs-new-wording comparison for the *same question identity*
 * (same `external_id`) across two `content_versions` — matched by
 * `external_id` because that's the one thing guaranteed stable across a
 * clone-to-draft (see questions.version_id/external_id unique constraint,
 * and the identical join key question-correlation.ts already uses).
 */

export interface QuestionOptionSnapshot {
  letter: string;
  text: Record<string, string>;
}

export interface QuestionVersionSnapshot {
  versionLabel: string;
  title: Record<string, string>;
  options: QuestionOptionSnapshot[];
  metrics: QuestionMetrics;
  health: HealthScoreResult;
}

export interface WordingDiff {
  titleChanged: boolean;
  oldTitle: Record<string, string>;
  newTitle: Record<string, string>;
  optionsChanged: boolean;
  oldOptions: QuestionOptionSnapshot[];
  newOptions: QuestionOptionSnapshot[];
}

/**
 * `higherIsBetter` decides what "improved" means: true for completion
 * rate, false for time/drop-off (a lower number is the win there). Either
 * side being null (e.g. the new draft hasn't collected any data yet)
 * makes delta/improved null rather than a misleading 0 or a crash.
 */
export interface MetricDelta {
  oldValue: number | null;
  newValue: number | null;
  delta: number | null;
  improved: boolean | null;
}

export interface AnswerShareDelta {
  answer: string;
  oldSharePct: number | null;
  newSharePct: number | null;
  deltaPct: number | null;
}

export interface QuestionVersionComparison {
  oldVersionLabel: string;
  newVersionLabel: string;
  wording: WordingDiff;
  completionRate: MetricDelta;
  avgTime: MetricDelta;
  dropOffRate: MetricDelta;
  healthScore: MetricDelta;
  answerDistributionShift: AnswerShareDelta[];
}

function localizedTextEqual(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }
  return true;
}

function optionsEqual(a: QuestionOptionSnapshot[], b: QuestionOptionSnapshot[]): boolean {
  if (a.length !== b.length) return false;
  const bByLetter = new Map(b.map((o) => [o.letter, o]));
  return a.every((option) => {
    const match = bByLetter.get(option.letter);
    return match ? localizedTextEqual(option.text, match.text) : false;
  });
}

function compareWording(
  oldSnap: QuestionVersionSnapshot,
  newSnap: QuestionVersionSnapshot,
): WordingDiff {
  return {
    titleChanged: !localizedTextEqual(oldSnap.title, newSnap.title),
    oldTitle: oldSnap.title,
    newTitle: newSnap.title,
    optionsChanged: !optionsEqual(oldSnap.options, newSnap.options),
    oldOptions: oldSnap.options,
    newOptions: newSnap.options,
  };
}

function metricDelta(
  oldValue: number | null,
  newValue: number | null,
  higherIsBetter: boolean,
): MetricDelta {
  if (oldValue === null || newValue === null) {
    return { oldValue, newValue, delta: null, improved: null };
  }
  const delta = Math.round((newValue - oldValue) * 100) / 100;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  return { oldValue, newValue, delta, improved: delta === 0 ? null : improved };
}

function answerDistributionShift(
  oldDist: Record<string, number>,
  newDist: Record<string, number>,
): AnswerShareDelta[] {
  const oldTotal = Object.values(oldDist).reduce((a, b) => a + b, 0);
  const newTotal = Object.values(newDist).reduce((a, b) => a + b, 0);
  const answers = new Set([...Object.keys(oldDist), ...Object.keys(newDist)]);

  return [...answers]
    .sort()
    .map((answer) => {
      const oldSharePct =
        oldTotal > 0 ? Math.round(((oldDist[answer] ?? 0) / oldTotal) * 1000) / 10 : null;
      const newSharePct =
        newTotal > 0 ? Math.round(((newDist[answer] ?? 0) / newTotal) * 1000) / 10 : null;
      const deltaPct =
        oldSharePct !== null && newSharePct !== null
          ? Math.round((newSharePct - oldSharePct) * 10) / 10
          : null;
      return { answer, oldSharePct, newSharePct, deltaPct };
    });
}

export function compareQuestionVersions(
  oldSnap: QuestionVersionSnapshot,
  newSnap: QuestionVersionSnapshot,
): QuestionVersionComparison {
  return {
    oldVersionLabel: oldSnap.versionLabel,
    newVersionLabel: newSnap.versionLabel,
    wording: compareWording(oldSnap, newSnap),
    completionRate: metricDelta(
      oldSnap.metrics.completionRatePct,
      newSnap.metrics.completionRatePct,
      true,
    ),
    avgTime: metricDelta(oldSnap.metrics.time.avgMs, newSnap.metrics.time.avgMs, false),
    dropOffRate: metricDelta(
      oldSnap.metrics.dropOffRatePct,
      newSnap.metrics.dropOffRatePct,
      false,
    ),
    healthScore: metricDelta(oldSnap.health.score, newSnap.health.score, true),
    answerDistributionShift: answerDistributionShift(
      oldSnap.metrics.answerDistribution,
      newSnap.metrics.answerDistribution,
    ),
  };
}
