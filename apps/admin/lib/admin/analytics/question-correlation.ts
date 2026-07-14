/**
 * Question → outcome correlation ("Question 5 predicts Technology
 * profile"). Deliberately reads from `assessments.answers` (jsonb, keyed
 * by question external_id → chosen letter) and `assessments.result`
 * (topCluster/archetype/primaryDriver), NOT analytics_events:
 *
 *  - `analytics_events` only has behavioral data since Phase 3 shipped, so
 *    it's empty today and only ever covers respondents from here forward.
 *  - `assessments.answers` + `.result` already exist for every completed
 *    assessment ever taken (including all historical/seed data), and are
 *    exactly the final-answer-to-final-outcome pairing this analysis
 *    needs — there's no reason to route through the event pipeline for
 *    something the outcome-of-record table already models directly.
 *
 * Kept fully deterministic — plain conditional-probability "lift" over
 * counts, no ML, no LLM, per the Phase 3 brief.
 */

export type OutcomeField = "topCluster" | "archetype" | "primaryDriver";

/** One completed assessment's answer to one question + its final outcome. */
export interface AnswerOutcomePair {
  answer: string;
  outcome: string;
}

export interface OutcomeBreakdown {
  answer: string;
  sampleSize: number;
  /** The single most common outcome value among respondents who picked this answer. */
  dominantOutcome: string | null;
  dominantSharePct: number | null;
  /**
   * dominantSharePct ÷ that outcome's overall baseline share (across every
   * respondent to this question, any answer) — 1.0 = "this answer tells
   * you nothing beyond the base rate", >1 = predictive, <1 = actively
   * anti-correlated with that outcome. Null if the baseline itself is 0
   * (outcome value never occurs) — undefined, not infinite.
   */
  liftVsBaseline: number | null;
}

export interface QuestionOutcomeCorrelation {
  outcomeField: OutcomeField;
  sampleSize: number;
  perAnswer: OutcomeBreakdown[];
  /** Max liftVsBaseline across every answer — the single number "how
   * predictive is this question at all" insights key off. Null below
   * MIN_SAMPLE. */
  strongestLift: number | null;
  strongestAnswer: string | null;
  strongestOutcome: string | null;
}

export const CORRELATION_MIN_SAMPLE = 10;
/** Below this many respondents for a *specific answer*, its breakdown is
 * reported but excluded from strongestLift — a lift computed from 2
 * people is not a finding. */
export const MIN_ANSWER_SAMPLE = 5;

/** One `assessments` row's raw shape, as read from the DB — the jsonb
 * columns are typed loosely on purpose since an unmigrated/legacy row can
 * be missing either field entirely. */
export interface AssessmentAnswerResultRow {
  answers: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
}

/**
 * Extracts valid (answer, outcome) pairs for one question out of raw
 * `assessments` rows, dropping anything incomplete: a row with no
 * `result` at all (assessment started but never finished/scored), a
 * `result` missing this specific `outcomeField` (e.g. a Custom-assessment
 * result that has no `topCluster` — see the CORE-vs-Custom note in the
 * architecture doc), or an `answers` blob with no entry for this
 * `external_id` (the respondent's version didn't have this question, or
 * `external_id` itself is wrong/doesn't exist — either way, nothing to
 * correlate). Never throws on a malformed row; skips it.
 */
export function buildAnswerOutcomePairs(
  rows: AssessmentAnswerResultRow[],
  externalId: string,
  outcomeField: OutcomeField,
): AnswerOutcomePair[] {
  const pairs: AnswerOutcomePair[] = [];
  for (const row of rows) {
    const answer = row.answers?.[externalId];
    const outcome = row.result?.[outcomeField];
    if (typeof answer !== "string" || answer.length === 0) continue;
    if (typeof outcome !== "string" || outcome.length === 0) continue;
    pairs.push({ answer, outcome });
  }
  return pairs;
}

function baselineDistribution(pairs: AnswerOutcomePair[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const pair of pairs) {
    counts.set(pair.outcome, (counts.get(pair.outcome) ?? 0) + 1);
  }
  return counts;
}

export function computeOutcomeCorrelation(
  pairs: AnswerOutcomePair[],
  outcomeField: OutcomeField,
): QuestionOutcomeCorrelation {
  const sampleSize = pairs.length;
  if (sampleSize < CORRELATION_MIN_SAMPLE) {
    return {
      outcomeField,
      sampleSize,
      perAnswer: [],
      strongestLift: null,
      strongestAnswer: null,
      strongestOutcome: null,
    };
  }

  const baseline = baselineDistribution(pairs);
  const byAnswer = new Map<string, AnswerOutcomePair[]>();
  for (const pair of pairs) {
    const list = byAnswer.get(pair.answer) ?? [];
    list.push(pair);
    byAnswer.set(pair.answer, list);
  }

  const perAnswer: OutcomeBreakdown[] = [...byAnswer.entries()]
    .map(([answer, answerPairs]) => {
      const outcomeCounts = new Map<string, number>();
      for (const p of answerPairs) {
        outcomeCounts.set(p.outcome, (outcomeCounts.get(p.outcome) ?? 0) + 1);
      }
      // Tie-break: strictly-greater comparison means the first outcome
      // *value* encountered (in the input pairs' original order) wins a
      // tie — deterministic and reproducible for the same input, not
      // "smartest" in any statistical sense.
      let dominantOutcome: string | null = null;
      let dominantCount = 0;
      for (const [outcome, count] of outcomeCounts) {
        if (count > dominantCount) {
          dominantCount = count;
          dominantOutcome = outcome;
        }
      }
      const dominantSharePct =
        dominantOutcome === null ? null : Math.round((dominantCount / answerPairs.length) * 1000) / 10;

      const baselineCount = dominantOutcome ? baseline.get(dominantOutcome) ?? 0 : 0;
      const baselineSharePct = baselineCount > 0 ? (baselineCount / sampleSize) * 100 : 0;
      const liftVsBaseline =
        dominantSharePct !== null && baselineSharePct > 0
          ? Math.round((dominantSharePct / baselineSharePct) * 100) / 100
          : null;

      return {
        answer,
        sampleSize: answerPairs.length,
        dominantOutcome,
        dominantSharePct,
        liftVsBaseline,
      };
    })
    .sort((a, b) => b.sampleSize - a.sampleSize);

  // Tie-break: perAnswer is sorted by sampleSize descending, and this
  // reduce keeps the first strictly-greater lift it sees — so on an exact
  // lift tie, the answer with the larger sample wins (a tie between two
  // answers of equal sample size falls back to whichever came first in
  // `byAnswer`'s — i.e. the original pairs array's — insertion order).
  const eligibleForStrongest = perAnswer.filter(
    (a) => a.sampleSize >= MIN_ANSWER_SAMPLE && a.liftVsBaseline !== null,
  );
  const strongest = eligibleForStrongest.reduce<OutcomeBreakdown | null>((max, a) => {
    if (!max) return a;
    return (a.liftVsBaseline as number) > (max.liftVsBaseline as number) ? a : max;
  }, null);

  return {
    outcomeField,
    sampleSize,
    perAnswer,
    strongestLift: strongest?.liftVsBaseline ?? null,
    strongestAnswer: strongest?.answer ?? null,
    strongestOutcome: strongest?.dominantOutcome ?? null,
  };
}

const STRONG_PREDICTOR_LIFT = 1.5;
const WEAK_PREDICTOR_LIFT = 1.15;

/** Deterministic one-line summary — "Question 5 predicts Technology profile"
 * / "Question 18 has almost no predictive value" — for the insights feed. */
export function describeCorrelation(
  label: string,
  correlation: QuestionOutcomeCorrelation,
): string {
  if (correlation.strongestLift === null) {
    return `${label}: not enough data yet to measure predictive value.`;
  }
  if (correlation.strongestLift >= STRONG_PREDICTOR_LIFT) {
    return `${label} strongly predicts the ${correlation.strongestOutcome} outcome (picking "${correlation.strongestAnswer}" makes it ${correlation.strongestLift}x more likely than baseline).`;
  }
  if (correlation.strongestLift <= WEAK_PREDICTOR_LIFT) {
    return `${label} has almost no predictive value for the final outcome.`;
  }
  return `${label} weakly correlates with the ${correlation.strongestOutcome} outcome (${correlation.strongestLift}x baseline).`;
}
