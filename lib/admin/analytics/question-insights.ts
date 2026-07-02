import { average } from "@/lib/admin/analytics/aggregate";
import type { QuestionMetrics } from "@/lib/admin/analytics/question-events";
import type { HealthScoreResult } from "@/lib/admin/analytics/question-health";
import type { Insight } from "@/lib/admin/analytics/types";

/**
 * Deterministic "what stands out" insights across a set of questions —
 * pure rules over already-computed metrics, no AI. Mirrors the existing
 * assessment-level insights.ts/alerts.ts pattern: each rule only fires
 * above a minimum sample size and a minimum magnitude, so a thin dataset
 * produces silence rather than noisy claims.
 *
 * Correlation-shaped insights ("Question 31 strongly separates Technology
 * and Business users") are deliberately NOT generated here — they come
 * from question-correlation.ts, which reads a different data source
 * (assessments.answers/result, not analytics_events) and has its own
 * minimum-sample and effect-size gates. Keeping them separate keeps this
 * module free of any dependency on the assessments/result schema.
 */

const MIN_SAMPLE = 5;
const SLOW_QUESTION_MULTIPLIER = 2;
const DOMINANT_ANSWER_MIN_SHARE_PCT = 85;
const RARELY_CHANGED_MAX_PCT = 2;
const HIGH_ABANDONMENT_MIN_PCT = 10;

export interface QuestionInsightInput {
  externalId: string;
  /** Human-facing label, e.g. "Question 18" — callers own numbering/labeling. */
  label: string;
  metrics: QuestionMetrics;
  health: HealthScoreResult;
}

function eligible(q: QuestionInsightInput): boolean {
  return q.metrics.views >= MIN_SAMPLE;
}

function highestAbandonmentInsight(questions: QuestionInsightInput[]): Insight | null {
  const candidates = questions.filter(
    (q) => eligible(q) && (q.metrics.abandonmentRatePct ?? 0) >= HIGH_ABANDONMENT_MIN_PCT,
  );
  if (candidates.length === 0) return null;

  const worst = candidates.reduce((max, q) =>
    (q.metrics.abandonmentRatePct ?? 0) > (max.metrics.abandonmentRatePct ?? 0) ? q : max,
  );
  return {
    id: `question-abandonment-${worst.externalId}`,
    severity: "warning",
    text: `${worst.label} has the highest abandonment (${worst.metrics.abandonmentRatePct}%).`,
  };
}

function slowQuestionInsights(questions: QuestionInsightInput[]): Insight[] {
  const withTime = questions.filter((q) => eligible(q) && q.metrics.time.avgMs !== null);
  if (withTime.length < 2) return [];

  const overallAvg = average(withTime.map((q) => q.metrics.time.avgMs as number));
  if (overallAvg === null || overallAvg <= 0) return [];

  return withTime
    .map((q) => ({ q, ratio: (q.metrics.time.avgMs as number) / overallAvg }))
    .filter(({ ratio }) => ratio >= SLOW_QUESTION_MULTIPLIER)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3) // cap so one thin/noisy dataset doesn't flood the feed
    .map(({ q, ratio }) => ({
      id: `question-slow-${q.externalId}`,
      severity: "info" as const,
      text: `${q.label} takes ${Math.round(ratio * 10) / 10}x longer than average to answer.`,
    }));
}

function dominantAnswerInsights(questions: QuestionInsightInput[]): Insight[] {
  const results: Insight[] = [];
  for (const q of questions) {
    if (!eligible(q)) continue;
    const entries = Object.entries(q.metrics.answerDistribution);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total < MIN_SAMPLE || entries.length < 2) continue;

    const [topAnswer, topCount] = entries.reduce((max, entry) =>
      entry[1] > max[1] ? entry : max,
    );
    const sharePct = Math.round((topCount / total) * 1000) / 10;
    if (sharePct < DOMINANT_ANSWER_MIN_SHARE_PCT) continue;

    results.push({
      id: `question-dominant-answer-${q.externalId}`,
      severity: "info",
      text: `${sharePct}% choose answer ${topAnswer} for ${q.label}.`,
    });
  }
  return results.slice(0, 3);
}

function rarelyChangedInsight(questions: QuestionInsightInput[]): Insight | null {
  const candidates = questions.filter(
    (q) =>
      eligible(q) &&
      q.metrics.answers >= MIN_SAMPLE &&
      q.metrics.answerChangeRatePct !== null &&
      q.metrics.answerChangeRatePct <= RARELY_CHANGED_MAX_PCT,
  );
  if (candidates.length === 0) return null;

  const stillest = candidates.reduce((min, q) =>
    (q.metrics.answerChangeRatePct ?? 0) < (min.metrics.answerChangeRatePct ?? 0) ? q : min,
  );
  return {
    id: `question-rarely-changed-${stillest.externalId}`,
    severity: "info",
    text: `${stillest.label} is rarely changed once answered (${stillest.metrics.answerChangeRatePct}% change rate).`,
  };
}

function criticalHealthInsights(questions: QuestionInsightInput[]): Insight[] {
  return questions
    .filter((q) => q.health.status === "Critical")
    .slice(0, 5)
    .map((q) => ({
      id: `question-critical-${q.externalId}`,
      severity: "warning" as const,
      text: `${q.label} needs review — health score ${q.health.score}/100 (Critical).`,
    }));
}

export function generateQuestionInsights(questions: QuestionInsightInput[]): Insight[] {
  return [
    highestAbandonmentInsight(questions),
    ...slowQuestionInsights(questions),
    ...dominantAnswerInsights(questions),
    rarelyChangedInsight(questions),
    ...criticalHealthInsights(questions),
  ].filter((insight): insight is Insight => insight !== null);
}
