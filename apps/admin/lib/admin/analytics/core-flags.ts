/**
 * Data-quality flags for one CORE part (spec §5, Scoring Logic §10).
 *
 * A copy of apps/consumer/lib/core-v2/flags.ts: the two apps build and deploy
 * separately, so admin cannot import consumer code. Keep the thresholds and
 * rules identical; core-flags.test.ts repeats the consumer's cases so drift
 * shows up as a failing test. The one difference is that a screen position
 * may be unknown here (events recorded before positions were tracked), so the
 * same-position share is taken over the answers whose position is known.
 */

export const RUSHED_MEDIAN_MS = 2000;
export const SAME_POSITION_SHARE = 0.9;

export interface TimedAnswer {
  /** Time on screen, in milliseconds. */
  timeMs: number;
  /** Screen position the chosen option was shown in (1-based), if known. */
  position: number | null;
}

export interface PartFlags {
  medianMs: number;
  /** Null when no answer in the part has a known position. */
  largestSamePositionShare: number | null;
  rushed: boolean;
  samePosition: boolean;
  flagged: boolean;
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function largestPositionShare(answers: readonly TimedAnswer[]): number | null {
  const byPosition = new Map<number, number>();
  let known = 0;
  for (const { position } of answers) {
    if (position === null) continue;
    known += 1;
    byPosition.set(position, (byPosition.get(position) ?? 0) + 1);
  }
  return known === 0 ? null : Math.max(...byPosition.values()) / known;
}

/** Flags for one part of the assessment. */
export function flagPart(answers: readonly TimedAnswer[]): PartFlags {
  if (answers.length === 0) throw new Error("Cannot flag a part with no answers");
  for (const { timeMs } of answers) {
    if (!Number.isFinite(timeMs) || timeMs < 0) {
      throw new Error(`Invalid time on screen: ${timeMs}`);
    }
  }

  const medianMs = median(answers.map((answer) => answer.timeMs));
  const largestSamePositionShare = largestPositionShare(answers);
  const rushed = medianMs < RUSHED_MEDIAN_MS;
  const samePosition =
    largestSamePositionShare !== null && largestSamePositionShare >= SAME_POSITION_SHARE;

  return {
    medianMs,
    largestSamePositionShare,
    rushed,
    samePosition,
    flagged: rushed || samePosition,
  };
}
