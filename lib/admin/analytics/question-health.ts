import type { QuestionMetrics } from "@/lib/admin/analytics/question-events";

/**
 * Below this many views, a health score would be noise dressed up as
 * signal — one or two respondents can swing completion/entropy/change-rate
 * numbers wildly. Mirrors the `MIN_SAMPLE` gating pattern already used by
 * the assessment-level alerts (lib/admin/analytics/alerts.ts).
 */
export const HEALTH_MIN_SAMPLE = 5;

export type HealthStatus = "Healthy" | "Needs Review" | "Critical" | "Insufficient Data";

export interface HealthFactorScores {
  /** completionRatePct, directly — dropOffRatePct is its exact complement
   * in this model, so only one is weighted (see module doc below). */
  completion: number | null;
  time: number | null;
  entropy: number | null;
  changeRate: number | null;
  abandonment: number | null;
}

export interface HealthScoreResult {
  score: number | null;
  status: HealthStatus;
  factors: HealthFactorScores;
}

export interface HealthScoreInputs {
  metrics: QuestionMetrics;
  /** false for free-text questions — there's no discrete answer set to
   * measure entropy over, so that factor is dropped and its weight is
   * redistributed rather than penalizing text questions for a property
   * that doesn't apply to them. */
  hasDiscreteAnswers: boolean;
  /** Number of selectable options this question has (for entropy's max-possible normalization). */
  optionCount: number;
  /** The assessment/version's own median question time — the baseline
   * "time" is judged against (a question isn't slow in the abstract, only
   * relative to its siblings). Null if there isn't enough data anywhere in
   * the assessment yet to establish one. */
  baselineMedianTimeMs: number | null;
}

/**
 * WEIGHTS (documented, not tuned against real data — the Phase 3 brief
 * only asks for "a deterministic score", not a specific formula; these are
 * a principled starting point, easy to retune once real traffic exists):
 *
 *   completion   35%  — the headline outcome: did people finish this question.
 *   time         20%  — relative to the assessment's own median question time.
 *   entropy      20%  — does the answer distribution actually discriminate,
 *                        or does ~everyone pick the same option (dropped for
 *                        free-text questions, weight redistributed).
 *   change rate  15%  — high back-and-forth suggests the wording confuses.
 *   abandonment  10%  — true "gave up here" signal, separate from completion
 *                        (a question can have low completion without most of
 *                        that being outright abandonment, e.g. if people go
 *                        back rather than leave).
 *
 * dropOffRatePct is intentionally NOT its own weighted factor: in this
 * module's data model it's the exact arithmetic complement of
 * completionRatePct (100 - completion), so weighting both would double-count
 * one signal under two names. `dropOffRatePct` still exists as its own
 * reported metric (lib/admin/analytics/question-events.ts) because it reads
 * more naturally in the UI/insights ("40% drop-off") than "60% completion".
 */
const WEIGHTS = {
  completion: 0.35,
  time: 0.2,
  entropy: 0.2,
  changeRate: 0.15,
  abandonment: 0.1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 100 at or under baseline, linearly down to 0 at 3x baseline or slower. */
function timeFactor(avgMs: number | null, baselineMedianMs: number | null): number | null {
  if (avgMs === null || baselineMedianMs === null || baselineMedianMs <= 0) return null;
  const ratio = avgMs / baselineMedianMs;
  if (ratio <= 1) return 100;
  return clamp(100 - (ratio - 1) * 50, 0, 100);
}

/** Shannon entropy of the answer distribution, normalized to 0-100 against
 * the max possible entropy for this many options — a question where every
 * option is picked equally often scores 100; one where everyone picks the
 * same option scores 0. */
function entropyFactor(
  distribution: Record<string, number>,
  optionCount: number,
): number | null {
  if (optionCount <= 1) return null;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const entropy = Object.values(distribution).reduce((sum, count) => {
    if (count === 0) return sum;
    const p = count / total;
    return sum - p * Math.log2(p);
  }, 0);
  const maxEntropy = Math.log2(optionCount);
  if (maxEntropy === 0) return null;
  return clamp((entropy / maxEntropy) * 100, 0, 100);
}

function changeRateFactor(answerChangeRatePct: number | null): number | null {
  if (answerChangeRatePct === null) return null;
  return clamp(100 - answerChangeRatePct * 2, 0, 100);
}

function abandonmentFactor(abandonmentRatePct: number | null): number | null {
  if (abandonmentRatePct === null) return null;
  return clamp(100 - abandonmentRatePct * 4, 0, 100);
}

function statusFromScore(score: number): HealthStatus {
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Needs Review";
  return "Critical";
}

export function computeQuestionHealth(inputs: HealthScoreInputs): HealthScoreResult {
  const { metrics, hasDiscreteAnswers, optionCount, baselineMedianTimeMs } = inputs;

  if (metrics.views < HEALTH_MIN_SAMPLE) {
    return {
      score: null,
      status: "Insufficient Data",
      factors: {
        completion: null,
        time: null,
        entropy: null,
        changeRate: null,
        abandonment: null,
      },
    };
  }

  const factors: HealthFactorScores = {
    completion: metrics.completionRatePct,
    time: timeFactor(metrics.time.avgMs, baselineMedianTimeMs),
    entropy: hasDiscreteAnswers
      ? entropyFactor(metrics.answerDistribution, optionCount)
      : null,
    changeRate: changeRateFactor(metrics.answerChangeRatePct),
    abandonment: abandonmentFactor(metrics.abandonmentRatePct),
  };

  // Only average the factors we actually have data for, renormalizing
  // weights over the present subset — an absent factor (e.g. entropy on a
  // free-text question, or time before any question_time_spent events
  // exist yet) shouldn't silently drag the score toward 0.
  const present = (Object.keys(factors) as (keyof HealthFactorScores)[]).filter(
    (key) => factors[key] !== null,
  );
  if (present.length === 0) {
    return { score: null, status: "Insufficient Data", factors };
  }

  const weightTotal = present.reduce((sum, key) => sum + WEIGHTS[key], 0);
  const weightedSum = present.reduce(
    (sum, key) => sum + (factors[key] as number) * WEIGHTS[key],
    0,
  );
  const score = Math.round(weightedSum / weightTotal);

  return { score, status: statusFromScore(score), factors };
}
