import {
  AXIS_CODES,
  SCORING_VERSION,
  type AxisCode,
  type AxisZone,
  type CoreResult,
  type CuriosityCode,
  type MotivatorCode,
} from "./types";

/**
 * Meaningful shifts between two attempts (spec §8). Kai raises at most two
 * per conversation, curiosities first, then motivators, so the order of the
 * returned list matters.
 */
export type Shift =
  | { kind: "curiosities"; from: CuriosityCode[]; to: CuriosityCode[] }
  | { kind: "motivators"; from: MotivatorCode[]; to: MotivatorCode[] }
  | { kind: "axis"; axis: AxisCode; from: AxisZone; to: AxisZone };

const MAX_SHIFTS_RAISED = 2;
const RAISE_ORDER: Record<Shift["kind"], number> = {
  curiosities: 0,
  motivators: 1,
  axis: 2,
};

/** What Kai may raise in one conversation: at most two, curiosities first, then motivators. */
export function shiftsToRaise(shifts: readonly Shift[]): Shift[] {
  return [...shifts]
    .sort((a, b) => RAISE_ORDER[a.kind] - RAISE_ORDER[b.kind])
    .slice(0, MAX_SHIFTS_RAISED);
}

/**
 * True when both attempts have leaders and none of the previous ones still
 * lead. A side with no small set of motivators is not a shift (file 08, shifts).
 */
function noneStillLead<T>(previous: readonly T[], current: readonly T[]): boolean {
  return (
    previous.length > 0 &&
    current.length > 0 &&
    !previous.some((code) => current.includes(code))
  );
}

/** Compare only with the previous attempt of the same scoring version. */
export function findShifts(previous: CoreResult, current: CoreResult): Shift[] {
  if (
    previous.scoringVersion !== SCORING_VERSION ||
    current.scoringVersion !== SCORING_VERSION
  ) {
    return [];
  }

  const shifts: Shift[] = [];

  if (noneStillLead(previous.leadingCuriosities, current.leadingCuriosities)) {
    shifts.push({
      kind: "curiosities",
      from: previous.leadingCuriosities,
      to: current.leadingCuriosities,
    });
  }

  if (noneStillLead(previous.leadingMotivators, current.leadingMotivators)) {
    shifts.push({
      kind: "motivators",
      from: previous.leadingMotivators,
      to: current.leadingMotivators,
    });
  }

  for (const axis of AXIS_CODES) {
    const from = previous.axes[axis].zone;
    const to = current.axes[axis].zone;
    // Only side to side counts; a move to or from the middle does not.
    if (from !== 2 && to !== 2 && from !== to) {
      shifts.push({ kind: "axis", axis, from, to });
    }
  }

  return shifts;
}
