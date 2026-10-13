/**
 * Data-quality flags (spec §5, Scoring Logic §10). Flags never change scores.
 * They are always calculated and stored; students only see them once the
 * founder switches flags_live on after calibration.
 */

const RUSHED_MEDIAN_MS = 2000;
const SAME_POSITION_SHARE = 0.9;

export interface TimedAnswer {
  /** Time on screen, in milliseconds. */
  timeMs: number;
  /** Screen position the chosen option was shown in (1-based). */
  position: number;
}

export interface PartFlags {
  medianMs: number;
  largestSamePositionShare: number;
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

function largestPositionShare(answers: readonly TimedAnswer[]): number {
  const byPosition = new Map<number, number>();
  for (const { position } of answers) {
    byPosition.set(position, (byPosition.get(position) ?? 0) + 1);
  }
  return Math.max(...byPosition.values()) / answers.length;
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
  const samePosition = largestSamePositionShare >= SAME_POSITION_SHARE;

  return {
    medianMs,
    largestSamePositionShare,
    rushed,
    samePosition,
    flagged: rushed || samePosition,
  };
}
