"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/admin/locales";
import { trackEvent } from "@/lib/analytics/track";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const localeEnum = z.enum(SUPPORTED_LOCALES);

const createAssessmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).optional().default(""),
  assessmentType: z.enum(["core", "custom"]),
  creationMethod: z.enum(["manual", "ai_import"]),
  primaryLanguage: localeEnum,
  supportedLanguages: z.array(localeEnum).min(1),
});

export interface CreateAssessmentResult {
  catalogId: string;
  versionId: string;
}

/**
 * Create a new assessment: a catalog identity row **plus** its first draft
 * `content_version`, linked by `catalog_id`. Questions later attach to the
 * version_id — this is the questions→catalog→version linkage that keeps
 * questions version-scoped while the catalog owns identity-level data
 * (result profiles, rules, scoring specs, source documents).
 *
 * Both creation methods (manual + ai_import) funnel through here, so the
 * downstream structure is identical regardless of how the assessment was made.
 */
export async function createAssessment(
  rawInput: unknown,
): Promise<CreateAssessmentResult> {
  const admin = await requireAdmin();
  const input = createAssessmentSchema.parse(rawInput);
  const sb = createSupabaseAdminClient();

  const name = { [input.primaryLanguage]: input.name };
  const description = input.description
    ? { [input.primaryLanguage]: input.description }
    : null;
  // The primary language is always part of the supported set.
  const supported = Array.from(
    new Set([input.primaryLanguage, ...input.supportedLanguages]),
  );

  const { data: catalog, error: ce } = await sb
    .from("assessments_catalog")
    .insert({
      name,
      description,
      primary_language: input.primaryLanguage,
      supported_languages: supported,
      assessment_type: input.assessmentType,
      creation_method: input.creationMethod,
      scoring_strategy:
        input.assessmentType === "custom" && input.creationMethod === "manual"
          ? "highest_score_wins"
          : "first_match",
      status: "draft",
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (ce || !catalog) {
    throw new Error(ce?.message ?? "Could not create the assessment.");
  }

  const { data: version, error: ve } = await sb
    .from("content_versions")
    .insert({
      label: input.name,
      is_active: false,
      notes: `${input.assessmentType} · ${input.creationMethod}`,
      created_by: admin.id,
      catalog_id: catalog.id,
    })
    .select("id")
    .single();
  if (ve || !version) {
    // Roll back only the orphaned catalog row we just created.
    await sb.from("assessments_catalog").delete().eq("id", catalog.id);
    throw new Error(ve?.message ?? "Could not create the assessment version.");
  }

  revalidatePath("/admin/content");
  trackEvent("assessment_created", {
    assessmentId: catalog.id as string,
    userId: admin.id,
    assessmentType: input.assessmentType,
    creationMethod: input.creationMethod,
  });
  return { catalogId: catalog.id as string, versionId: version.id as string };
}

const updateSetupSchema = z.object({
  locale: localeEnum.default("en"),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).optional().default(""),
});

/**
 * Update an assessment's setup metadata for a given locale, merging the
 * locale-specific name/description into the existing jsonb (so editing the
 * Arabic name never clobbers the English one).
 */
export async function updateAssessmentSetup(
  catalogId: string,
  rawInput: unknown,
): Promise<void> {
  const admin = await requireAdmin();
  const input = updateSetupSchema.parse(rawInput);
  const sb = createSupabaseAdminClient();

  const { data: existing, error: ge } = await sb
    .from("assessments_catalog")
    .select("name,description")
    .eq("id", catalogId)
    .single();
  if (ge || !existing) throw new Error(ge?.message ?? "Assessment not found.");

  const name = {
    ...((existing.name as Record<string, string> | null) ?? {}),
    [input.locale]: input.name,
  };
  const description = {
    ...((existing.description as Record<string, string> | null) ?? {}),
    [input.locale]: input.description,
  };

  const { error } = await sb
    .from("assessments_catalog")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", catalogId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${catalogId}`);
  trackEvent("assessment_updated", {
    assessmentId: catalogId,
    userId: admin.id,
    locale: input.locale,
  });
}
