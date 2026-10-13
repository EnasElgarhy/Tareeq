/**
 * Retake rules (spec §5, §8). A normal retake is allowed once every six
 * months. A flagged attempt, while flags are live, earns one free full retake
 * within 30 days that sits outside the six-month rule.
 */

const RETAKE_MONTHS = 6;
const FREE_RETAKE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetakeAttempt {
  submittedAt: Date;
  isFlagged: boolean;
  /** flags_live at the time this attempt was submitted. */
  wasFlagsLive: boolean;
  isFreeRetake: boolean;
}

export type RetakeStatus =
  | { canRetake: true; kind: "first" | "standard" | "free" }
  | { canRetake: false; opensAt: Date };

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/** Attempts in any order; only completed ones should be passed. */
export function retakeStatus(attempts: readonly RetakeAttempt[], now: Date): RetakeStatus {
  if (attempts.length === 0) return { canRetake: true, kind: "first" };

  const sorted = [...attempts].sort(
    (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime(),
  );
  const latest = sorted[sorted.length - 1];

  // The free retake itself never earns another one, so a flagged attempt cannot loop.
  const earnsFreeRetake =
    latest.isFlagged && latest.wasFlagsLive && !latest.isFreeRetake;
  if (
    earnsFreeRetake &&
    now.getTime() - latest.submittedAt.getTime() <= FREE_RETAKE_DAYS * DAY_MS
  ) {
    return { canRetake: true, kind: "free" };
  }

  // The six-month clock runs from the last attempt that was not a free retake.
  const anchor = [...sorted].reverse().find((attempt) => !attempt.isFreeRetake) ?? latest;
  const opensAt = addMonths(anchor.submittedAt, RETAKE_MONTHS);
  return now >= opensAt
    ? { canRetake: true, kind: "standard" }
    : { canRetake: false, opensAt };
}
