import { SIDE_TO_TAG, type CareerBank, type CareerFamily, type CareerJob } from "./bank";
import { circleDistance } from "./scoring";
import {
  AXES,
  AXIS_CODES,
  CURIOSITY_CODES,
  type AxisCode,
  type CoreResult,
  type CuriosityCode,
  type MotivatorCode,
} from "./types";

/**
 * Section 4, "What this means for you" (spec §6.4; file 08 functions
 * section4, job_match and worth_checking). Returns IDs and block IDs only;
 * the renderer looks up names and wording in the bank and file 04.
 */

/** Security and Family are handled as questions in Section 5, never matched to jobs. */
const UNMATCHED_MOTIVATORS: ReadonlySet<MotivatorCode> = new Set(["SEC", "FAM"]);
const FULL_FAMILIES_PER_DIRECTION = 3;
const PAIRS_FOR_THREE_OR_MORE = 2;
const PAIRS_WHEN_OPEN = 3;
const MEET_CLOSE_MAX_DISTANCE = 2;

export type Pair = [CuriosityCode, CuriosityCode];
export type WorthCheckingBlock =
  | "S4-CHECK-STRUCTURE"
  | "S4-CHECK-FOCUS"
  | "S4-CHECK-TEAM"
  | "S4-CHECK-SETTING"
  | "S4-CHECK-DAY";

export interface JobView {
  jobId: string;
  score: number;
  /** Axes where the job's route tag equals the student's lean, in axis order. */
  workTags: AxisCode[];
  /** Leading motivators the job often offers, in fixed order. */
  motivators: MotivatorCode[];
  isHighlighted: boolean;
}

export interface FamilyView {
  familyId: string;
  score: number;
  isClosest: boolean;
  jobs: JobView[];
  worthChecking: WorthCheckingBlock;
}

export interface MeetCard {
  pair: Pair;
  familyId: string;
  line: "S4-MEET-CLOSE" | "S4-MEET-FAR";
  /** Best-matching first. */
  jobs: JobView[];
}

export interface Direction {
  curiosity: CuriosityCode;
  full: FamilyView[];
  /** Shown as names only, after S4-MORE-LABEL. */
  more: string[];
}

export interface Section4 {
  meetCards: MeetCard[];
  directions: Direction[];
  /** Every family shown scores 0: show S4-NOMATCH, bank order, no Closest. */
  noMatch: boolean;
}

const fixedIndex = (code: CuriosityCode) => CURIOSITY_CODES.indexOf(code);

export function jobMatch(job: CareerJob, result: CoreResult): JobView {
  const workTags = AXIS_CODES.filter((axis) => {
    const side = result.axes[axis].lean;
    return side !== null && job.routes[axis] === SIDE_TO_TAG[side];
  });
  const motivators = result.leadingMotivators.filter(
    (code) => !UNMATCHED_MOTIVATORS.has(code) && job.offers.includes(code),
  );
  const score = workTags.length + motivators.length;
  return { jobId: job.id, score, workTags, motivators, isHighlighted: score > 0 };
}

/** Highest score first; ties keep bank order (Array.prototype.sort is stable). */
function byScore<T extends { score: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

function rankJobs(family: CareerFamily, result: CoreResult): JobView[] {
  return byScore(family.jobs.map((job) => jobMatch(job, result)));
}

export function worthChecking(
  family: CareerFamily,
  result: CoreResult,
): WorthCheckingBlock {
  let best: { axis: AxisCode; count: number } | null = null;
  for (const axis of AXIS_CODES) {
    const side = result.axes[axis].lean;
    if (side === null) continue;
    const { sideA, sideB } = AXES[axis];
    const opposite = SIDE_TO_TAG[side === sideA ? sideB : sideA];
    const count = family.jobs.filter((job) => job.routes[axis] === opposite).length;
    if (count > 0 && (best === null || count > best.count)) best = { axis, count };
  }
  return best
    ? (`S4-CHECK-${best.axis.toUpperCase()}` as WorthCheckingBlock)
    : "S4-CHECK-DAY";
}

function pairsInScoreOrder(result: CoreResult): Pair[] {
  const leaders = [...result.leadingCuriosities].sort(
    (a, b) => fixedIndex(a) - fixedIndex(b),
  );
  const pairs: Pair[] = [];
  leaders.forEach((a, i) => leaders.slice(i + 1).forEach((b) => pairs.push([a, b])));
  const sum = ([a, b]: Pair) => result.curiosityCounts[a] + result.curiosityCounts[b];
  return pairs.sort(
    (p, q) =>
      sum(q) - sum(p) ||
      fixedIndex(p[0]) - fixedIndex(q[0]) ||
      fixedIndex(p[1]) - fixedIndex(q[1]),
  );
}

export function choosePairs(result: CoreResult): Pair[] {
  const ordered = pairsInScoreOrder(result);
  if (result.directionClarity !== "open") {
    return ordered.slice(0, ordered.length === 1 ? 1 : PAIRS_FOR_THREE_OR_MORE);
  }
  // Open: first the pairs that add a curiosity not yet covered, then fill up.
  const chosen: Pair[] = [];
  const covered = new Set<CuriosityCode>();
  for (const pair of ordered) {
    if (chosen.length === PAIRS_WHEN_OPEN) break;
    if (pair.some((code) => !covered.has(code))) {
      chosen.push(pair);
      pair.forEach((code) => covered.add(code));
    }
  }
  for (const pair of ordered) {
    if (chosen.length === PAIRS_WHEN_OPEN) break;
    if (!chosen.includes(pair)) chosen.push(pair);
  }
  return chosen;
}

function findMeetFamily(bank: CareerBank, [a, b]: Pair): CareerFamily {
  const family = bank.families.find(
    ({ curiosities }) =>
      curiosities.length === 2 && curiosities.includes(a) && curiosities.includes(b),
  );
  if (!family) throw new Error(`Career bank has no meet family for ${a}+${b}`);
  return family;
}

function viewFamily(family: CareerFamily, result: CoreResult): FamilyView {
  const jobs = rankJobs(family, result);
  return {
    familyId: family.id,
    score: jobs.reduce((total, job) => total + job.score, 0),
    isClosest: false,
    jobs,
    worthChecking: worthChecking(family, result),
  };
}

function buildDirection(
  curiosity: CuriosityCode,
  bank: CareerBank,
  result: CoreResult,
): Direction {
  const singles = bank.families.filter(
    ({ curiosities }) => curiosities.length === 1 && curiosities[0] === curiosity,
  );
  const ranked = byScore(singles.map((family) => viewFamily(family, result)));
  const full = ranked
    .slice(0, FULL_FAMILIES_PER_DIRECTION)
    .map((family, i) => ({ ...family, isClosest: i === 0 && family.score > 0 }));
  return {
    curiosity,
    full,
    more: ranked.slice(FULL_FAMILIES_PER_DIRECTION).map((family) => family.familyId),
  };
}

export function buildSection4(result: CoreResult, bank: CareerBank): Section4 {
  const meetCards: MeetCard[] = choosePairs(result).map((pair) => {
    const family = findMeetFamily(bank, pair);
    return {
      pair,
      familyId: family.id,
      line:
        circleDistance(pair[0], pair[1]) <= MEET_CLOSE_MAX_DISTANCE
          ? "S4-MEET-CLOSE"
          : "S4-MEET-FAR",
      jobs: rankJobs(family, result),
    };
  });

  // An Open result shows only the meet cards; Kai explores the rest.
  const directions =
    result.directionClarity === "open"
      ? []
      : result.leadingCuriosities.map((code) => buildDirection(code, bank, result));

  const shownScores = [
    ...meetCards.flatMap((card) => card.jobs.map((job) => job.score)),
    ...directions.flatMap((direction) => direction.full.map((family) => family.score)),
  ];
  const noMatch = shownScores.every((score) => score === 0);

  return { meetCards, directions, noMatch };
}
