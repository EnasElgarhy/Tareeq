import type { Question } from "@/lib/scoring/types";
import { CORE_QUESTIONS } from "./content/core-content";
import {
  AXES,
  AXIS_CODES,
  CURIOSITY_CODES,
  MOTIVATOR_CODES,
  type AxisAnswer,
  type AxisCode,
  type AxisSide,
  type CoreAnswers,
  type CuriosityCode,
  type MotivatorCode,
} from "./types";

/**
 * Question set 5.2 inside the existing assessment screens. Each question is
 * presented in its part's fixed order (spec §3.1 allows the fixed order when
 * the platform does not shuffle) and options get display letters A–D; scoring
 * goes by what each option scores toward, never by the letter (spec §3.1).
 */

/**
 * The content_versions row CORE attempts are stored under. Kept stable so
 * existing attempts restore; the content versions of each attempt are stored
 * on its result (CORE_CONTENT_VERSIONS).
 */
export const CORE_QUESTION_SET_LABEL = "core-5.1-interim-2026-10-15";
const LETTERS = ["A", "B", "C", "D"] as const;

const ordered = [...CORE_QUESTIONS].sort(
  (a, b) => a.part - b.part || a.fixedOrderPosition - b.fixedOrderPosition,
);

/** externalId → display letter → what that option scores toward. */
const SCORES_TO: Record<string, Record<string, string>> = Object.fromEntries(
  ordered.map((question) => [
    question.id,
    Object.fromEntries(
      question.options.map((option, i) => [LETTERS[i], option.code]),
    ),
  ]),
);

const AXIS_OF: Record<string, AxisCode | null> = Object.fromEntries(
  ordered.map((question) => [question.id, question.axis]),
);

/** The 46 CORE questions in the shape QuestionScreen renders. */
export const CORE_ASSESSMENT_QUESTIONS: Question[] = ordered.map(
  (question, index) => ({
    externalId: question.id,
    pillar: question.part,
    position: index + 1,
    kind: question.options.length === 2 ? "binary" : "single",
    title: { en: question.text.en, ar: question.text.ar },
    options: question.options.map((option, i) => ({
      letter: LETTERS[i] ?? String(i + 1),
      position: i + 1,
      text: { en: option.text.en, ar: option.text.ar },
    })),
  }),
);

export function isCoreQuestionSet(questions: readonly Question[]): boolean {
  return questions.some((question) => question.externalId === "P1-01");
}

function isAxisSide(code: string): code is AxisSide {
  return AXIS_CODES.some(
    (axis) => AXES[axis].sideA === code || AXES[axis].sideB === code,
  );
}

/**
 * The scorer's input from stored letter answers. Throws when an answer is
 * missing or unknown: only a complete attempt is scored (spec §3.1).
 */
export function coreAnswersFromLetters(
  answers: Readonly<Record<string, string>>,
): CoreAnswers {
  const curiosities: CuriosityCode[] = [];
  const motivators: MotivatorCode[] = [];
  const axes: AxisAnswer[] = [];
  for (const question of ordered) {
    const letter = answers[question.id];
    const code = letter ? SCORES_TO[question.id]?.[letter] : undefined;
    if (!code) throw new Error(`Missing answer for ${question.id}`);
    const axis = AXIS_OF[question.id];
    if (axis) {
      if (!isAxisSide(code)) throw new Error(`Bad axis code ${code}`);
      axes.push({ axis, side: code });
    } else if ((CURIOSITY_CODES as readonly string[]).includes(code)) {
      curiosities.push(code as CuriosityCode);
    } else if ((MOTIVATOR_CODES as readonly string[]).includes(code)) {
      motivators.push(code as MotivatorCode);
    } else {
      throw new Error(`Unknown code ${code} on ${question.id}`);
    }
  }
  return { curiosities, motivators, axes };
}
