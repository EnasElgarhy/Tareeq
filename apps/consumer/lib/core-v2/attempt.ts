import { flagPart, type PartFlags } from "./flags";
import type {
  AxisCode,
  AxisSide,
  CoreAnswers,
  CuriosityCode,
  MotivatorCode,
} from "./types";

/**
 * Taking the assessment (spec §3.1–3.2): question order, option shuffling,
 * what is recorded per answer, and turning responses into scorer input.
 * Question content arrives from file 03; this module only needs IDs and codes.
 */

export type Part = 1 | 2 | 3 | 4;
export type QuestionOrder = "shuffled" | "fixed";

export interface CoreOption {
  id: string;
  /** What the option scores toward: a curiosity, motivator or axis side. */
  code: string;
}

export interface CoreQuestion {
  id: string;
  part: Part;
  /** Order to use when not shuffling; spreads every curiosity across the part. */
  fixedOrderPosition: number;
  /** Parts 2 and 4 only. */
  axis?: AxisCode;
  options: readonly CoreOption[];
}

export interface ShownOption extends CoreOption {
  /** 1-based screen position. */
  position: number;
}

/** One row of core_responses. */
export interface ResponseRecord {
  questionId: string;
  optionId: string;
  code: string;
  part: Part;
  positionShown: number;
  /** Option IDs in the order they were shown, so the screen can be rebuilt exactly. */
  optionsShown: readonly string[];
  timeOnScreenMs: number;
  orderShown: number;
  answeredAt: string;
  isRedo?: boolean;
}

export type Random = () => number;

/** Small deterministic PRNG (mulberry32) so a stored seed can replay an order. */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Options in a fresh order for this student, with the position each is shown in. */
export function presentOptions(question: CoreQuestion, random: Random): ShownOption[] {
  return shuffle(question.options, random).map((option, i) => ({
    ...option,
    position: i + 1,
  }));
}

/** Parts stay in order 1–4 and are never mixed; within a part, shuffle or use the fixed order. */
export function orderQuestions(
  questions: readonly CoreQuestion[],
  order: QuestionOrder,
  random: Random = Math.random,
): CoreQuestion[] {
  const parts: Part[] = [1, 2, 3, 4];
  return parts.flatMap((part) => {
    const inPart = questions.filter((question) => question.part === part);
    return order === "shuffled"
      ? shuffle(inPart, random)
      : [...inPart].sort((a, b) => a.fixedOrderPosition - b.fixedOrderPosition);
  });
}

function findOption(response: ResponseRecord, questions: readonly CoreQuestion[]) {
  const question = questions.find(({ id }) => id === response.questionId);
  const option = question?.options.find(({ id }) => id === response.optionId);
  if (!question || !option) {
    throw new Error(
      `Unknown answer ${response.optionId} for question ${response.questionId}`,
    );
  }
  if (response.part !== question.part) {
    throw new Error(
      `Response for ${question.id} says part ${response.part}, question is part ${question.part}`,
    );
  }
  return { question, option };
}

/**
 * A redone part replaces the flagged one (spec §5): for any part with redo
 * rows, keep only those. Both sets stay stored; only the redo is scored.
 */
export function effectiveResponses(
  responses: readonly ResponseRecord[],
): ResponseRecord[] {
  const redoneParts = new Set(
    responses.filter((response) => response.isRedo).map((response) => response.part),
  );
  return responses.filter(
    (response) => !redoneParts.has(response.part) || response.isRedo === true,
  );
}

/** Every question answered exactly once (spec §3.1: no skips, only complete attempts). */
function assertComplete(
  responses: readonly ResponseRecord[],
  questions: readonly CoreQuestion[],
): void {
  const seen = new Set<string>();
  for (const { questionId } of responses) {
    if (seen.has(questionId)) throw new Error(`${questionId} answered more than once`);
    seen.add(questionId);
  }
  const missing = questions.find(({ id }) => !seen.has(id));
  if (missing) throw new Error(`${missing.id} not answered`);
}

/**
 * Responses → scorer input. Scores by the option's own code from the question
 * set, never by the letter or position shown. Pass effectiveResponses() when
 * the attempt has a redone part.
 */
export function toCoreAnswers(
  responses: readonly ResponseRecord[],
  questions: readonly CoreQuestion[],
): CoreAnswers {
  const curiosities: CuriosityCode[] = [];
  const motivators: MotivatorCode[] = [];
  const axes: { axis: AxisCode; side: AxisSide }[] = [];

  assertComplete(responses, questions);
  for (const response of responses) {
    const { question, option } = findOption(response, questions);
    if (question.part === 1) curiosities.push(option.code as CuriosityCode);
    else if (question.part === 3) motivators.push(option.code as MotivatorCode);
    else if (question.axis) axes.push({ axis: question.axis, side: option.code as AxisSide });
    else throw new Error(`Question ${question.id} in part ${question.part} has no axis`);
  }

  return { curiosities, motivators, axes };
}

/** Data-quality flags for each part that has answers. */
export function flagsByPart(
  responses: readonly ResponseRecord[],
): Partial<Record<Part, PartFlags>> {
  const flags: Partial<Record<Part, PartFlags>> = {};
  for (const part of [1, 2, 3, 4] as const) {
    const inPart = responses.filter((response) => response.part === part);
    if (inPart.length === 0) continue;
    flags[part] = flagPart(
      inPart.map(({ timeOnScreenMs, positionShown }) => ({
        timeMs: timeOnScreenMs,
        position: positionShown,
      })),
    );
  }
  return flags;
}
