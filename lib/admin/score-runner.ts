import { getCatalogAssessment } from "@/lib/admin/catalog";
import {
  type CustomQuestion,
  listCustomQuestions,
} from "@/lib/admin/custom-content";
import { type DispatchResult, dispatchScore } from "@/lib/scoring/dispatch";
import type { ScoringSpec } from "@/lib/scoring/spec-types";
import type { LocalizedText, Question, QuestionKind } from "@/lib/scoring/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side scoring seam. Loads an assessment's `is_current` spec + questions
 * and runs the deterministic dispatcher. This is the function the live student
 * route will call once the consumer flow reads from the DB (Phase 7 wiring);
 * today it powers admin score-testing. AI never participates.
 */

/** Map editor-shaped Custom questions to the engine's `Question` shape. */
export function customQuestionsToEngine(
  questions: readonly CustomQuestion[],
): Question[] {
  return questions.map((q) => ({
    externalId: q.external_id,
    pillar: 1,
    position: q.position,
    kind: q.kind as QuestionKind,
    title: q.title as LocalizedText,
    options: q.options.map((o) => ({
      letter: o.letter,
      position: o.position,
      text: o.text as LocalizedText,
      categoryCode: o.categoryCode ?? undefined,
      weight: o.points,
    })),
  }));
}

export async function getCurrentSpec(
  catalogId: string,
): Promise<ScoringSpec | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("scoring_specs")
    .select("spec_json")
    .eq("catalog_id", catalogId)
    .eq("is_current", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.spec_json as ScoringSpec | undefined) ?? null;
}

export async function scoreCatalogAssessment(
  catalogId: string,
  versionId: string,
  answers: Record<string, string>,
): Promise<DispatchResult> {
  const assessment = await getCatalogAssessment(catalogId);
  if (!assessment) throw new Error("Assessment not found.");

  const questions = customQuestionsToEngine(await listCustomQuestions(versionId));

  if (assessment.assessment_type === "custom") {
    const spec = await getCurrentSpec(catalogId);
    if (!spec) throw new Error("Assessment has no published scoring spec.");
    return dispatchScore({ engine: "custom", answers, questions, spec });
  }
  return dispatchScore({ engine: "core", answers, questions });
}
