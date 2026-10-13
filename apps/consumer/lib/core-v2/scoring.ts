import {
  AXES,
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  PART_QUESTION_COUNTS,
  QUESTIONS_PER_AXIS,
  SCORING_VERSION,
  type AxisCode,
  type AxisResult,
  type CircleReading,
  type CoreAnswers,
  type CoreResult,
  type CuriosityCode,
  type DirectionClarity,
  type MotivatorCode,
} from "./types";

/** Interest-circle positions (spec §4.1). IR and AE share position 7. */
const CIRCLE_POSITION: Record<CuriosityCode, number> = {
  RD: 1,
  IE: 2,
  PW: 3,
  EI: 4,
  PE: 5,
  TS: 6,
  IR: 7,
  AE: 7,
};
const CIRCLE_SIZE = 7;
const COHERENT_MAX_DISTANCE = 2;
/** Four or more motivators at T or T−1 means no small set stood out. */
const NO_SMALL_SET_AT = 4;
const TOP_MOTIVATOR_LIMIT = 2;
const CURIOSITY_MAX = 8;

/** Shorter way round the interest circle, 0–3. */
export function circleDistance(a: CuriosityCode, b: CuriosityCode): number {
  const gap = Math.abs(CIRCLE_POSITION[a] - CIRCLE_POSITION[b]);
  return Math.min(gap, CIRCLE_SIZE - gap);
}

function tally<T extends string>(
  codes: readonly T[],
  allCodes: readonly T[],
): Record<T, number> {
  const counts = Object.fromEntries(allCodes.map((code) => [code, 0])) as Record<
    T,
    number
  >;
  for (const code of codes) {
    // An unknown code would otherwise drop a point silently and break the totals.
    if (!(code in counts)) throw new Error(`Unknown code "${code}"`);
    counts[code] += 1;
  }
  return counts;
}

/** Codes at max or max−1, by score (highest first), ties in fixed order. */
function leadersByScore<T extends string>(
  counts: Record<T, number>,
  fixedOrder: readonly T[],
): T[] {
  const top = Math.max(...fixedOrder.map((code) => counts[code]));
  return fixedOrder
    .filter((code) => counts[code] >= top - 1)
    .sort(
      (a, b) =>
        counts[b] - counts[a] || fixedOrder.indexOf(a) - fixedOrder.indexOf(b),
    );
}

function clarityFor(margin: number): DirectionClarity {
  if (margin >= 3) return "clear";
  if (margin === 2) return "leaning";
  if (margin === 1) return "close";
  return "open";
}

function directionMargin(counts: Record<CuriosityCode, number>): number {
  const scores = CURIOSITY_CODES.map((code) => counts[code]);
  const top = Math.max(...scores);
  const atTop = scores.filter((score) => score === top).length;
  // R is the best score below L, or L itself when two or more share the top.
  const runnerUp =
    atTop >= 2 ? top : Math.max(...scores.filter((score) => score !== top));
  return top - runnerUp;
}

function readCircle(leaders: readonly CuriosityCode[]): CircleReading {
  if (leaders.length === 1) return "single";
  for (let i = 0; i < leaders.length; i++) {
    for (let j = i + 1; j < leaders.length; j++) {
      if (circleDistance(leaders[i], leaders[j]) > COHERENT_MAX_DISTANCE) {
        return "diverse";
      }
    }
  }
  return "coherent";
}

function scoreAxes(answers: CoreAnswers): Record<AxisCode, AxisResult> {
  const result = {} as Record<AxisCode, AxisResult>;
  for (const axis of AXIS_CODES) {
    const { counted, sideA, sideB } = AXES[axis];
    const axisAnswers = answers.axes.filter((answer) => answer.axis === axis);
    if (axisAnswers.length !== QUESTIONS_PER_AXIS) {
      throw new Error(
        `Expected ${QUESTIONS_PER_AXIS} answers for ${axis}, got ${axisAnswers.length}`,
      );
    }
    for (const { side } of axisAnswers) {
      if (side !== sideA && side !== sideB) {
        throw new Error(`"${side}" is not a side of ${axis}`);
      }
    }
    const count = axisAnswers.filter((answer) => answer.side === counted).length;
    const other = counted === sideA ? sideB : sideA;
    const lean = count >= 3 ? counted : count <= 1 ? other : null;
    const zone = lean === null ? 2 : lean === sideA ? 1 : 3;
    result[axis] = { count, zone, lean };
  }
  return result;
}

function assertCount(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    throw new Error(`Expected ${expected} ${label} answers, got ${actual}`);
  }
}

/**
 * Score one complete attempt under scoring 2.0. Pure and deterministic:
 * the same answers always give the same result. Throws on an incomplete
 * attempt, because only complete attempts are scored (spec §3.1).
 */
export function scoreCore(answers: CoreAnswers): CoreResult {
  assertCount(answers.curiosities.length, PART_QUESTION_COUNTS[1], "curiosity");
  assertCount(answers.motivators.length, PART_QUESTION_COUNTS[3], "motivator");

  const curiosityCounts = tally(answers.curiosities, CURIOSITY_CODES);
  const leadingCuriosities = leadersByScore(curiosityCounts, CURIOSITY_CODES);
  const margin = directionMargin(curiosityCounts);
  const topCuriosity = curiosityCounts[leadingCuriosities[0]];

  const motivatorCounts = tally(answers.motivators, MOTIVATOR_CODES);
  const motivatorsByScore = leadersByScore(motivatorCounts, MOTIVATOR_CODES);
  const noSmallSet = motivatorsByScore.length >= NO_SMALL_SET_AT;
  const leadingMotivators: MotivatorCode[] = noSmallSet
    ? []
    : MOTIVATOR_CODES.filter((code) => motivatorsByScore.includes(code));
  const topTwoMotivators = noSmallSet
    ? []
    : motivatorsByScore.slice(0, TOP_MOTIVATOR_LIMIT);

  return {
    scoringVersion: SCORING_VERSION,
    curiosityCounts,
    leadingCuriosities,
    directionClarity: clarityFor(margin),
    margin,
    circleReading: readCircle(leadingCuriosities),
    motivatorCounts,
    leadingMotivators,
    noSmallSet,
    topTwoMotivators,
    axes: scoreAxes(answers),
    leadingShare: (topCuriosity / CURIOSITY_MAX) * 100,
  };
}
