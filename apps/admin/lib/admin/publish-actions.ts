"use server";

import { revalidatePath } from "next/cache";
import { assembleScoringSpec } from "@/lib/admin/assemble-spec";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";
import { validateScoringConfig } from "@/lib/admin/profile-validation";
import {
  coverageByLocale,
  findMissingTranslations,
} from "@/lib/admin/translation-coverage";
import {
  getScoringStrategy,
  listProfileRules,
  listResultProfiles,
} from "@/lib/admin/scoring-content";
import { trackEvent } from "@/lib/analytics/track";
import { requireAdmin } from "@/lib/auth/require-admin";
import { executeScoringSpec } from "@/lib/scoring/spec-executor";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Assemble + validate the editing tables into a ScoringSpec and make it the
 * single `is_current` spec for the catalog, flipping status → published. This is
 * the boundary the executor's "validation rejects corrupt specs before
 * is_current" guarantee refers to. Deterministic + backend-only.
 */
export async function publishAssessment(
  catalogId: string,
  versionId: string,
  allowSingleLanguage = false,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  const admin = await requireAdmin();

  const { data: cat, error: ce } = await sb
    .from("assessments_catalog")
    .select("id,status,supported_languages")
    .eq("id", catalogId)
    .single();
  if (ce || !cat) throw new Error("Assessment not found.");
  const supportedLocales = (cat.supported_languages as string[] | null) ?? ["en"];

  const [strategy, categories, profiles, rules, questions] = await Promise.all([
    getScoringStrategy(catalogId),
    listAssessmentCategories(catalogId),
    listResultProfiles(catalogId),
    listProfileRules(catalogId),
    listCustomQuestions(versionId),
  ]);

  if (questions.length === 0) {
    throw new Error("Add at least one question before publishing.");
  }

  const configErrors = validateScoringConfig({
    strategy,
    categories: categories.map((c) => c.code),
    profiles: profiles.map((p) => ({ id: p.id, categoryCode: p.category_code })),
    ruleCount: rules.length,
  });
  if (configErrors.length > 0) throw new Error(configErrors.join(" "));

  // Bilingual coverage: block missing-locale unless explicitly single-language.
  const gaps = findMissingTranslations({
    supportedLocales,
    categories: categories.map((c) => ({ code: c.code, name: c.name })),
    questions: questions.map((q) => ({
      external_id: q.external_id,
      title: q.title,
      options: q.options.map((o) => ({ letter: o.letter, text: o.text })),
    })),
    profiles: profiles.map((p) => ({ code: p.code, name: p.name })),
  });
  const byLocale = coverageByLocale(gaps, supportedLocales);
  if (gaps.length > 0 && !allowSingleLanguage) {
    const summary = supportedLocales
      .filter((l) => byLocale[l] > 0)
      .map((l) => `${l}: ${byLocale[l]} missing`)
      .join(", ");
    throw new Error(
      `Incomplete translations (${summary}). Complete them, or re-publish as single-language.`,
    );
  }
  // Record only the fully-covered locales as published.
  const publishedLocales = supportedLocales.filter((l) => (byLocale[l] ?? 0) === 0);

  const spec = assembleScoringSpec({
    strategy,
    categories: categories.map((c) => ({ code: c.code, name: c.name })),
    profiles,
    rules,
  });

  // Structural sanity: the executor must accept the spec (catches duplicate
  // rule ids, dangling rule→profile refs, >1 fallback, etc.) before is_current.
  try {
    executeScoringSpec({}, spec);
  } catch (e) {
    throw new Error(
      `Spec failed validation: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const { data: last } = await sb
    .from("scoring_specs")
    .select("version")
    .eq("catalog_id", catalogId)
    .order("version", { ascending: false })
    .limit(1);
  const version = ((last?.[0]?.version as number | undefined) ?? 0) + 1;

  // At most one current spec (DB partial unique index backstops this). Unset
  // first, then insert the new current — never two current at once.
  const { error: unset } = await sb
    .from("scoring_specs")
    .update({ is_current: false })
    .eq("catalog_id", catalogId)
    .eq("is_current", true);
  if (unset) throw new Error(unset.message);

  const { error: ins } = await sb.from("scoring_specs").insert({
    catalog_id: catalogId,
    source: "manual",
    version,
    spec_json: spec,
    is_current: true,
  });
  if (ins) throw new Error(ins.message);

  const { error: upd } = await sb
    .from("assessments_catalog")
    .update({
      status: "published",
      published_locales: publishedLocales,
      updated_at: new Date().toISOString(),
    })
    .eq("id", catalogId);
  if (upd) throw new Error(upd.message);

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${versionId}/scoring`);
  trackEvent("assessment_published", {
    assessmentId: catalogId,
    assessmentVersion: versionId,
    userId: admin.id,
    locales: publishedLocales,
  });
}

export async function unpublishAssessment(
  catalogId: string,
  versionId: string,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  await requireAdmin();

  const { error: spec } = await sb
    .from("scoring_specs")
    .update({ is_current: false })
    .eq("catalog_id", catalogId)
    .eq("is_current", true);
  if (spec) throw new Error(spec.message);

  const { error } = await sb
    .from("assessments_catalog")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", catalogId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${versionId}/scoring`);
}
