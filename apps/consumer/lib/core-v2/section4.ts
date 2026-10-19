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
 * Section 4, "What this means for you" (spec §6.4, §6.7; file 08 functions
 * job_match, family_view, pairs_to_show and section4). Returns IDs and block
 * IDs only; the renderer looks up names and wording in the bank and file 04.
 */

/** Security and Family are handled as questions in Section 5, never matched to jobs. */
const UNMATCHED_MOTIVATORS: ReadonlySet<MotivatorCode> = new Set(["SEC", "FAM"]);
const FULL_FAMILIES_PER_DIRECTION = 3;
const PAIRS_WHEN_TWO_LEADERS = 1;
const PAIRS_FOR_THREE_OR_MORE = 2;
const PAIRS_WHEN_OPEN = 3;
const MEET_CLOSE_MAX_DISTANCE = 2;
/**
 * Job scores are exact fractions (file 08 uses Fraction): each part is k/n with
 * n ≤ 3 (two axes per pillar, at most three leading motivators), averaged over
 * up to three parts. Scaled by 36 they are whole numbers, so ties stay exact.
 */
export const SCORE_SCALE = 36;

export type Pair = [CuriosityCode, CuriosityCode];
export type WorthCheckingBlock =
  | "S4-CHECK-STRUCTURE"
  | "S4-CHECK-FOCUS"
  | "S4-CHECK-TEAM"
  | "S4-CHECK-SETTING"
  | "S4-CHECK-DAY";

export interface JobView {
  jobId: string;
  /** Exact score × SCORE_SCALE. */
  score: number;
  /** Axes where the job's route tag equals the student's lean, in axis order. */
  workTags: AxisCode[];
  /** Leading motivators the job often offers, in fixed order. */
  motivators: MotivatorCode[];
  isHighlighted: boolean;
  isChangingWork: boolean;
}

/** What every family card shares, meet card or full card. */
interface FamilyCard {
  familyId: string;
  /** Sum of its jobs' scores (× SCORE_SCALE). */
  score: number;
  /** Best-matching first, after the no-repeat rule. */
  jobs: JobView[];
  /** Jobs removed because an earlier card already showed the same job (spec §6.4). */
  hiddenRepeatJobIds: string[];
  /** Show S4-CHANGING once at the bottom: a shown job carries the marker (spec §6.7). */
  hasChangingNote: boolean;
}

export interface FamilyView extends FamilyCard {
  highlightedJobs: number;
  isClosest: boolean;
  worthChecking: WorthCheckingBlock;
}

export interface MeetCard extends FamilyCard {
  pair: Pair;
  line: "S4-MEET-CLOSE" | "S4-MEET-FAR";
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
  /** Open results: leading curiosities without a meet card, for S4-ALSO. */
  alsoCuriosities: CuriosityCode[];
}

const fixedIndex = (code: CuriosityCode) => CURIOSITY_CODES.indexOf(code);

function fraction(matched: number, of: number): number {
  return (matched * SCORE_SCALE) / of;
}

/**
 * How you like to work (Pillar 2 axes), the work setting (Pillar 4 axes) and
 * what motivates you each count for one third; a part the student has no
 * leaning in is left out (rule agreed 8 Oct 2026).
 */
export function jobMatch(job: CareerJob, result: CoreResult): JobView {
  const leaning = AXIS_CODES.filter((axis) => result.axes[axis].lean !== null);
  const workTags = leaning.filter((axis) => {
    const side = result.axes[axis].lean;
    return side !== null && job.routes[axis] === SIDE_TO_TAG[side];
  });
  const matchable = result.leadingMotivators.filter((code) => !UNMATCHED_MOTIVATORS.has(code));
  const motivators = matchable.filter((code) => job.offers.includes(code));

  const parts: number[] = [];
  for (const pillar of [2, 4] as const) {
    const axes = leaning.filter((axis) => AXES[axis].part === pillar);
    if (axes.length > 0) {
      parts.push(fraction(workTags.filter((axis) => axes.includes(axis)).length, axes.length));
    }
  }
  if (matchable.length > 0) parts.push(fraction(motivators.length, matchable.length));

  const score = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  if (!Number.isInteger(score)) throw new Error(`Job ${job.id} score is not exact`);
  return {
    jobId: job.id,
    score,
    workTags,
    motivators,
    isHighlighted: score > 0,
    isChangingWork: job.isChangingWork,
  };
}

/** Highest score first; ties keep bank order (Array.prototype.sort is stable). */
function rankJobs(family: CareerFamily, result: CoreResult): JobView[] {
  return family.jobs.map((job) => jobMatch(job, result)).sort((a, b) => b.score - a.score);
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

/**
 * Pairs of leading curiosities by total score; on a tie the pair farther apart
 * on the circle first, then the fixed curiosity order (rules agreed 8 Oct 2026).
 */
function pairsInOrder(result: CoreResult): Pair[] {
  const leaders = result.leadingCuriosities;
  const pairs: Pair[] = [];
  leaders.forEach((a, i) => leaders.slice(i + 1).forEach((b) => pairs.push([a, b])));
  const sum = ([a, b]: Pair) => result.curiosityCounts[a] + result.curiosityCounts[b];
  const low = ([a, b]: Pair) => Math.min(fixedIndex(a), fixedIndex(b));
  const high = ([a, b]: Pair) => Math.max(fixedIndex(a), fixedIndex(b));
  return pairs.sort(
    (p, q) =>
      sum(q) - sum(p) ||
      circleDistance(q[0], q[1]) - circleDistance(p[0], p[1]) ||
      low(p) - low(q) ||
      high(p) - high(q),
  );
}

/** Coverage first: pairs that bring in a curiosity not yet covered, then fill up. */
export function choosePairs(result: CoreResult): Pair[] {
  const leaders = result.leadingCuriosities;
  if (leaders.length < 2) return [];
  const limit =
    result.directionClarity === "open"
      ? PAIRS_WHEN_OPEN
      : leaders.length === 2
        ? PAIRS_WHEN_TWO_LEADERS
        : PAIRS_FOR_THREE_OR_MORE;
  const ordered = pairsInOrder(result);
  const chosen: Pair[] = [];
  const covered = new Set<CuriosityCode>();
  for (const pair of ordered) {
    if (chosen.length < limit && pair.some((code) => !covered.has(code))) {
      chosen.push(pair);
      pair.forEach((code) => covered.add(code));
    }
  }
  for (const pair of ordered) {
    if (chosen.length < limit && !chosen.includes(pair)) chosen.push(pair);
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

function familyCard(family: CareerFamily, result: CoreResult): FamilyCard {
  const jobs = rankJobs(family, result);
  return {
    familyId: family.id,
    score: jobs.reduce((total, job) => total + job.score, 0),
    jobs,
    hiddenRepeatJobIds: [],
    hasChangingNote: false,
  };
}

function viewFamily(family: CareerFamily, result: CoreResult): FamilyView {
  const card = familyCard(family, result);
  return {
    ...card,
    highlightedJobs: card.jobs.filter((job) => job.isHighlighted).length,
    isClosest: false,
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
  // Ties: more highlighted jobs first, then bank order (stable sort).
  const ranked = singles
    .map((family) => viewFamily(family, result))
    .sort((a, b) => b.score - a.score || b.highlightedJobs - a.highlightedJobs);
  const full = ranked
    .slice(0, FULL_FAMILIES_PER_DIRECTION)
    .map((family, i) => ({ ...family, isClosest: i === 0 && family.score > 0 }));
  return {
    curiosity,
    full,
    more: ranked.slice(FULL_FAMILIES_PER_DIRECTION).map((family) => family.familyId),
  };
}

/**
 * Display only, after ordering and highlighting: walking the cards in display
 * order, a job whose English name an earlier card already showed is removed
 * (agreed 16 Oct 2026). Then a card showing a changing-work job gets the note.
 */
function withoutRepeats<T extends FamilyCard>(
  cards: readonly T[],
  bank: CareerBank,
): T[] {
  const nameOf = new Map(
    bank.families.flatMap((family) => family.jobs.map((job) => [job.id, job.nameEn] as const)),
  );
  const seen = new Set<string>();
  return cards.map((card) => {
    const isRepeat = (job: JobView) => seen.has(nameOf.get(job.jobId) ?? job.jobId);
    const jobs = card.jobs.filter((job) => !isRepeat(job));
    const hidden = card.jobs.filter(isRepeat);
    jobs.forEach((job) => seen.add(nameOf.get(job.jobId) ?? job.jobId));
    return {
      ...card,
      jobs,
      hiddenRepeatJobIds: hidden.map((job) => job.jobId),
      hasChangingNote: jobs.some((job) => job.isChangingWork),
    };
  });
}

export function buildSection4(result: CoreResult, bank: CareerBank): Section4 {
  const meetCards: MeetCard[] = choosePairs(result).map((pair) => ({
    ...familyCard(findMeetFamily(bank, pair), result),
    pair,
    line:
      circleDistance(pair[0], pair[1]) <= MEET_CLOSE_MAX_DISTANCE
        ? "S4-MEET-CLOSE"
        : "S4-MEET-FAR",
  }));

  // An Open result shows only the meet cards; Kai explores the rest.
  const isOpen = result.directionClarity === "open";
  const directions = isOpen
    ? []
    : result.leadingCuriosities.map((code) => buildDirection(code, bank, result));

  const noMatch = [...meetCards, ...directions.flatMap((d) => d.full)].every(
    (card) => card.score === 0,
  );

  // No repeats across meet cards first, then each direction's full cards in leader order.
  const shownMeet = withoutRepeats(meetCards, bank);
  const fullCards = withoutRepeats(
    [...shownMeet, ...directions.flatMap((d) => d.full)],
    bank,
  ).slice(shownMeet.length) as FamilyView[];
  let next = 0;
  const shownDirections = directions.map((direction) => {
    const full = fullCards.slice(next, next + direction.full.length);
    next += direction.full.length;
    return { ...direction, full };
  });

  const covered = new Set(meetCards.flatMap((card) => card.pair));
  const alsoCuriosities = isOpen
    ? result.leadingCuriosities.filter((code) => !covered.has(code))
    : [];

  return { meetCards: shownMeet, directions: shownDirections, noMatch, alsoCuriosities };
}
