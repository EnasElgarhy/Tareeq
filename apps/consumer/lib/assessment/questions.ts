import {
  countriesMiddleEast,
  countriesRest,
  seedQuestions,
} from "@/lib/content/seed";
import { AR_CONTENT } from "@/lib/content/translations-ar";
import type { LocalizedText, Question } from "@/lib/scoring/types";

export const assessmentQuestions = seedQuestions.map((question) => {
  const ar = AR_CONTENT[question.externalId];
  return {
    ...question,
    title: ar?.title
      ? { ...question.title, ar: ar.title }
      : { ...question.title },
    options: question.options.map((option) => {
      const arText = ar?.options?.[option.letter];
      return {
        ...option,
        text: arText ? { ...option.text, ar: arText } : { ...option.text },
      };
    }),
  };
}) as unknown as Question[];

export const totalAssessmentQuestions = assessmentQuestions.length;

export const menaCountries = [...countriesMiddleEast];
export const restOfWorldCountries = [...countriesRest];

export function getLocalizedText(text: LocalizedText, locale = "en") {
  return text[locale] ?? text.en ?? Object.values(text)[0] ?? "";
}

export function getQuestionByIndex(index: number) {
  return assessmentQuestions[index];
}

export function getPillarLabel(question: Question) {
  // Open-text reflection questions get a distinct label so the user
  // sees the mode change from "tap" to "write".
  if (question.kind === "text") return "Reflect";
  if (question.pillar === 0) return "About You";
  if (question.pillar === 1) return "Pillar 1 · Curiosities";
  if (question.pillar === 2) return "Pillar 2 · Operations";
  if (question.pillar === 3) return "Pillar 3 · Rewards";
  return "Pillar 4 · Ecosystems";
}

export function normalizeQuestionIndex(
  rawIndex: string | number,
  total = totalAssessmentQuestions,
) {
  const index =
    typeof rawIndex === "number" ? rawIndex : Number.parseInt(rawIndex, 10);

  if (!Number.isInteger(index) || index < 0 || index >= total) {
    return null;
  }

  return index;
}

export function getQuestionPath(index: number) {
  return `/q/${index}`;
}
