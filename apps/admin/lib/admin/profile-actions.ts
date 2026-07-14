"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  validateProfileRule,
  validateResultProfile,
} from "@/lib/admin/profile-validation";
import { trackEvent } from "@/lib/analytics/track";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/** Assert the catalog exists and its (sole) draft version is editable. */
async function assertEditableCatalog(
  sb: AdminClient,
  catalogId: string,
): Promise<void> {
  const { data, error } = await sb
    .from("assessments_catalog")
    .select("status")
    .eq("id", catalogId)
    .single();
  if (error || !data) throw new Error("Assessment not found.");
  // Allowlist: only drafts are editable (published/archived are read-only).
  if (data.status !== "draft") {
    throw new Error(
      `This assessment is ${data.status} — only drafts are editable. Clone it to make changes.`,
    );
  }
}

function revalidateCatalog(versionId?: string) {
  revalidatePath("/admin/content");
  if (versionId) revalidatePath(`/admin/content/${versionId}/scoring`);
}

// ── Scoring strategy ────────────────────────────────────────────────────────

export async function setScoringStrategy(
  catalogId: string,
  rawStrategy: unknown,
  versionId?: string,
): Promise<void> {
  await requireAdmin();
  const strategy = z
    .enum(["first_match", "highest_score_wins"])
    .parse(rawStrategy);
  const sb = createSupabaseAdminClient();
  await assertEditableCatalog(sb, catalogId);
  const { error } = await sb
    .from("assessments_catalog")
    .update({ scoring_strategy: strategy, updated_at: new Date().toISOString() })
    .eq("id", catalogId);
  if (error) throw new Error(error.message);
  revalidateCatalog(versionId);
}

// ── Result profiles ─────────────────────────────────────────────────────────

const localized = z.record(z.string(), z.string());
const localizedList = z.record(z.string(), z.array(z.string()));

const profileSchema = z.object({
  code: z.string().trim().min(1).max(32),
  title: localized,
  description: localized.optional().default({}),
  categoryCode: z.string().nullable().optional().default(null),
  recommendedMajors: localizedList.optional().default({}),
  recommendedCareers: localizedList.optional().default({}),
  strengths: localizedList.optional().default({}),
  developmentAreas: localizedList.optional().default({}),
  isFallback: z.boolean().optional().default(false),
});

export async function saveResultProfile(
  catalogId: string,
  profileId: string | null,
  rawInput: unknown,
  versionId?: string,
): Promise<string> {
  const admin = await requireAdmin();
  const input = profileSchema.parse(rawInput);
  const sb = createSupabaseAdminClient();
  await assertEditableCatalog(sb, catalogId);

  const { data: existing } = await sb
    .from("result_profiles")
    .select("id,code")
    .eq("catalog_id", catalogId);
  const otherCodes = (existing ?? [])
    .filter((p) => p.id !== profileId)
    .map((p) => (p.code as string | null) ?? "")
    .filter(Boolean);

  const errors = validateResultProfile(
    { code: input.code, title: input.title },
    otherCodes,
  );
  if (errors.length > 0) throw new Error(errors.join(" "));

  // The mapped category (highest_score_wins) must exist in this catalog.
  if (input.categoryCode) {
    const { data: cats } = await sb
      .from("assessment_categories")
      .select("code")
      .eq("catalog_id", catalogId);
    const valid = new Set((cats ?? []).map((c) => c.code as string));
    if (!valid.has(input.categoryCode)) {
      throw new Error(`Unknown category "${input.categoryCode}".`);
    }
  }

  const row = {
    catalog_id: catalogId,
    code: input.code.toUpperCase(),
    name: input.title,
    description: input.description,
    category_code: input.categoryCode,
    recommended_majors: input.recommendedMajors,
    recommended_careers: input.recommendedCareers,
    strengths: input.strengths,
    development_areas: input.developmentAreas,
    is_fallback: input.isFallback,
  };

  // At most one fallback per catalog (also DB-enforced by a partial unique index).
  if (input.isFallback) {
    await sb
      .from("result_profiles")
      .update({ is_fallback: false })
      .eq("catalog_id", catalogId)
      .neq("id", profileId ?? NIL_UUID);
  }

  if (profileId) {
    const { error } = await sb.from("result_profiles").update(row).eq("id", profileId);
    if (error) throw new Error(error.message);
    revalidateCatalog(versionId);
    trackEvent("profile_updated", {
      assessmentId: catalogId,
      userId: admin.id,
      profileId,
      isNew: false,
    });
    return profileId;
  }
  const { data, error } = await sb
    .from("result_profiles")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not save profile.");
  revalidateCatalog(versionId);
  trackEvent("profile_updated", {
    assessmentId: catalogId,
    userId: admin.id,
    profileId: data.id as string,
    isNew: true,
  });
  return data.id as string;
}

export async function deleteResultProfile(
  profileId: string,
  versionId?: string,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  // Rules referencing this profile cascade (FK ON DELETE CASCADE).
  const { error } = await sb.from("result_profiles").delete().eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidateCatalog(versionId);
}

// ── Profile rules (the "profile_rules" concept; stored in result_rules) ───────

const conditionSchema = z.object({
  cluster: z.string().trim().min(1),
  operator: z.enum(["=", "!=", ">", "<", ">=", "<="]),
  value: z.coerce.number().finite().optional(),
  valueCategory: z.string().nullable().optional(),
});

const ruleSchema = z.object({
  resultProfileId: z.string().min(1),
  combinator: z.enum(["AND", "OR"]).optional().default("AND"),
  conditions: z.array(conditionSchema).min(1).max(10),
  priority: z.coerce.number().int().optional().default(0),
});

export async function saveProfileRule(
  catalogId: string,
  ruleId: string | null,
  rawInput: unknown,
  versionId?: string,
): Promise<string> {
  const admin = await requireAdmin();
  const input = ruleSchema.parse(rawInput);
  const sb = createSupabaseAdminClient();
  await assertEditableCatalog(sb, catalogId);

  const [{ data: profiles }, { data: cats }] = await Promise.all([
    sb.from("result_profiles").select("id").eq("catalog_id", catalogId),
    sb.from("assessment_categories").select("code").eq("catalog_id", catalogId),
  ]);

  const errors = validateProfileRule(
    { resultProfileId: input.resultProfileId, conditions: input.conditions },
    (profiles ?? []).map((p) => p.id as string),
    (cats ?? []).map((c) => c.code as string),
  );
  if (errors.length > 0) throw new Error(errors.join(" "));

  // Normalise: a category RHS wins over a constant; never store both.
  const conditions = input.conditions.map((c) =>
    c.valueCategory
      ? { cluster: c.cluster, operator: c.operator, valueCategory: c.valueCategory }
      : { cluster: c.cluster, operator: c.operator, value: c.value ?? 0 },
  );

  const row = {
    catalog_id: catalogId,
    result_profile_id: input.resultProfileId,
    combinator: input.combinator,
    conditions,
    priority: input.priority,
  };

  if (ruleId) {
    const { error } = await sb.from("result_rules").update(row).eq("id", ruleId);
    if (error) throw new Error(error.message);
    revalidateCatalog(versionId);
    trackEvent("rule_updated", { assessmentId: catalogId, userId: admin.id, ruleId, isNew: false });
    return ruleId;
  }
  const { data, error } = await sb
    .from("result_rules")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not save rule.");
  revalidateCatalog(versionId);
  trackEvent("rule_updated", {
    assessmentId: catalogId,
    userId: admin.id,
    ruleId: data.id as string,
    isNew: true,
  });
  return data.id as string;
}

export async function deleteProfileRule(
  ruleId: string,
  versionId?: string,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("result_rules").delete().eq("id", ruleId);
  if (error) throw new Error(error.message);
  revalidateCatalog(versionId);
}
