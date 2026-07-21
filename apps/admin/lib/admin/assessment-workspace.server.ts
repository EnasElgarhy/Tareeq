import { getAssessmentReadiness } from "@/lib/admin/assessment-readiness";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";
import {
  getScoringStrategy,
  listProfileRules,
  listResultProfiles,
} from "@/lib/admin/scoring-content";

export async function loadAssessmentWorkspace(
  catalogId: string,
  versionId: string,
  supportedLocales: readonly string[],
) {
  const [categories, questions, profiles, rules, strategy] = await Promise.all([
    listAssessmentCategories(catalogId),
    listCustomQuestions(versionId),
    listResultProfiles(catalogId),
    listProfileRules(catalogId),
    getScoringStrategy(catalogId),
  ]);

  const readiness = getAssessmentReadiness({
    supportedLocales,
    categories: categories.map((category) => ({
      code: category.code,
      name: category.name as Record<string, string>,
    })),
    questions: questions.map((question) => ({
      externalId: question.external_id,
      title: question.title as Record<string, string>,
      options: question.options.map((option) => ({
        letter: option.letter,
        text: option.text as Record<string, string>,
        categoryCode: option.categoryCode,
      })),
    })),
    profiles: profiles.map((profile) => ({
      id: profile.id,
      code: profile.code,
      name: profile.name as Record<string, string>,
      categoryCode: profile.category_code,
    })),
    strategy,
    ruleCount: rules.length,
  });

  return { categories, questions, profiles, rules, strategy, readiness };
}
