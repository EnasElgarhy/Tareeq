import type { ScoringStrategy } from "@/lib/scoring/spec-types";
import { validateScoringConfig } from "@/lib/admin/profile-validation";
import {
  findMissingTranslations,
  type TranslationGap,
} from "@/lib/admin/translation-coverage";

export type AssessmentStepKey =
  | "questions"
  | "scoring"
  | "translations"
  | "preview";

export type AssessmentStepStatus = "complete" | "attention" | "todo" | "ready";

export interface AssessmentReadiness {
  steps: Record<AssessmentStepKey, AssessmentStepStatus>;
  questionCount: number;
  unmappedAnswerCount: number;
  scoringIssues: string[];
  translationGaps: TranslationGap[];
  isReadyToPublish: boolean;
}

interface ReadinessInput {
  supportedLocales: readonly string[];
  categories: {
    code: string;
    name: Record<string, string>;
  }[];
  questions: {
    externalId: string;
    title: Record<string, string>;
    options: {
      letter: string;
      text: Record<string, string>;
      categoryCode: string | null;
    }[];
  }[];
  profiles: {
    id: string;
    code: string | null;
    name: Record<string, string>;
    categoryCode: string | null;
  }[];
  strategy: ScoringStrategy;
  ruleCount: number;
}

export function getAssessmentReadiness(
  input: ReadinessInput,
): AssessmentReadiness {
  const unmappedAnswerCount = input.questions.reduce(
    (total, question) =>
      total + question.options.filter((option) => !option.categoryCode).length,
    0,
  );
  const hasQuestionStructure =
    input.categories.length > 0 && input.questions.length > 0;
  const questionsComplete = hasQuestionStructure && unmappedAnswerCount === 0;

  const scoringIssues = validateScoringConfig({
    strategy: input.strategy,
    categories: input.categories.map((category) => category.code),
    profiles: input.profiles.map((profile) => ({
      id: profile.id,
      categoryCode: profile.categoryCode,
    })),
    ruleCount: input.ruleCount,
  });

  const translationGaps = findMissingTranslations({
    supportedLocales: input.supportedLocales,
    categories: input.categories,
    questions: input.questions.map((question) => ({
      external_id: question.externalId,
      title: question.title,
      options: question.options,
    })),
    profiles: input.profiles.map((profile) => ({
      code: profile.code,
      name: profile.name,
    })),
  });

  const scoringComplete = scoringIssues.length === 0;
  const translationsComplete = translationGaps.length === 0;
  const isReadyToPublish =
    questionsComplete && scoringComplete && translationsComplete;

  return {
    steps: {
      questions: questionsComplete
        ? "complete"
        : hasQuestionStructure
          ? "attention"
          : "todo",
      scoring: scoringComplete
        ? "complete"
        : input.profiles.length > 0
          ? "attention"
          : "todo",
      translations: translationsComplete
        ? "complete"
        : input.questions.length > 0
          ? "attention"
          : "todo",
      preview: isReadyToPublish ? "ready" : "todo",
    },
    questionCount: input.questions.length,
    unmappedAnswerCount,
    scoringIssues,
    translationGaps,
    isReadyToPublish,
  };
}
