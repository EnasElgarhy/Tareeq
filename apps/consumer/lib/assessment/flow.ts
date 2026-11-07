import type { Question } from "@/lib/scoring/types";

/**
 * The order of screens around the questions (corrections of 6 Nov 2026, §1):
 * contract → About you → dividing page → each part's intro and questions →
 * end screen → registration. Older question sets have no such screens and
 * simply run from one question to the next.
 */

export const ABOUT_YOU_PATH = "/about-you";
export const DIVIDER_PATH = "/begin";
export const END_PATH = "/done";
export const STOP_PATH = "/stop";
export const partIntroPath = (part: number) => `/part/${part}`;

const questionPath = (index: number) => `/q/${index}`;

type FlowQuestion = Pick<Question, "pillar">;

export function hasCoreFlow(questions: readonly FlowQuestion[]): boolean {
  return questions.some((q) => q.pillar === 0) && questions.length === BACKGROUND_COUNT + ASSESSMENT_COUNT;
}

const BACKGROUND_COUNT = 4;
const ASSESSMENT_COUNT = 46;

/** Where to go after this question is answered. */
export function pathAfterQuestion(index: number, questions: readonly FlowQuestion[]): string {
  const current = questions[index];
  const next = questions[index + 1];
  if (!hasCoreFlow(questions) || !current) return next ? questionPath(index + 1) : "/register";
  if (!next) return END_PATH;
  if (current.pillar === 0 && next.pillar !== 0) return DIVIDER_PATH;
  if (next.pillar !== current.pillar) return partIntroPath(next.pillar);
  return questionPath(index + 1);
}

/** Where the back button goes from this question. */
export function pathBeforeQuestion(index: number, questions: readonly FlowQuestion[]): string {
  const current = questions[index];
  const previous = questions[index - 1];
  if (!hasCoreFlow(questions) || !current) return previous ? questionPath(index - 1) : "/contract";
  if (!previous) return ABOUT_YOU_PATH;
  if (previous.pillar !== current.pillar) return partIntroPath(current.pillar);
  return questionPath(index - 1);
}

/** The first question of a part, for its intro's Continue button. */
export function firstQuestionOfPart(part: number, questions: readonly FlowQuestion[]): number {
  return questions.findIndex((q) => q.pillar === part);
}

/** The back button on a part intro: the last screen before it. */
export function pathBeforePart(part: number, questions: readonly FlowQuestion[]): string {
  if (part <= 1) return DIVIDER_PATH;
  const first = firstQuestionOfPart(part, questions);
  return first > 0 ? questionPath(first - 1) : DIVIDER_PATH;
}

/**
 * "On question 6 of 46": counts only the assessment. `null` on the About you
 * questions and for older sets, which count everything.
 */
export function assessmentCounter(
  index: number,
  questions: readonly FlowQuestion[],
): { current: number; total: number } | null {
  const scored = questions.filter((q) => q.pillar !== 0).length;
  const before = questions.length - scored;
  if (index < before) return null;
  return { current: index - before + 1, total: scored };
}
