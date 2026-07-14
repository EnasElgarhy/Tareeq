"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { listAssessmentCategories } from "@/lib/admin/custom-content";
import { validateCustomQuestion } from "@/lib/admin/custom-question-validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Custom-assessment questions share one synthetic pillar; order is by position. */
const CUSTOM_PILLAR = 1;

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

/** Resolve a version's catalog id, asserting it is an editable Custom draft. */
async function assertCustomDraft(
  sb: AdminClient,
  versionId: string,
): Promise<string> {
  const { data, error } = await sb
    .from("content_versions")
    .select("catalog_id,is_active")
    .eq("id", versionId)
    .single();
  if (error || !data) throw new Error("Version not found.");
  if (data.is_active)
    throw new Error("The active version is read-only — clone it to a draft to edit.");
  if (!data.catalog_id)
    throw new Error("This version is not a custom assessment.");
  return data.catalog_id as string;
}

// ── Categories ────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9_]+$/, "Code can only contain letters, numbers, and underscores."),
  nameEn: z.string().trim().min(1).max(80),
  nameAr: z.string().trim().max(80).optional().default(""),
});

export async function addAssessmentCategory(
  catalogId: string,
  rawInput: unknown,
): Promise<void> {
  await requireAdmin();
  const input = categorySchema.parse(rawInput);
  const sb = createSupabaseAdminClient();

  const code = input.code.toUpperCase();
  const name: Record<string, string> = { en: input.nameEn };
  if (input.nameAr) name.ar = input.nameAr;

  const { error } = await sb
    .from("assessment_categories")
    .insert({ catalog_id: catalogId, code, name });
  if (error) {
    throw new Error(
      /duplicate|unique/i.test(error.message)
        ? `Category "${code}" already exists.`
        : error.message,
    );
  }
  revalidatePath("/admin/content");
}

export async function deleteAssessmentCategory(categoryId: string): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { data: cat, error: e1 } = await sb
    .from("assessment_categories")
    .select("code,catalog_id")
    .eq("id", categoryId)
    .single();
  if (e1 || !cat) throw new Error("Category not found.");
  const code = cat.code as string;
  const catalogId = cat.catalog_id as string;

  // Category codes have no DB FK (jsonb conditions + bare category_code). Guard
  // against orphaning the scoring spec: refuse if a profile maps to it or a rule
  // condition references it (either side of a comparison).
  const [{ data: profiles }, { data: rules }] = await Promise.all([
    sb
      .from("result_profiles")
      .select("id")
      .eq("catalog_id", catalogId)
      .eq("category_code", code),
    sb.from("result_rules").select("conditions").eq("catalog_id", catalogId),
  ]);
  if ((profiles ?? []).length > 0) {
    throw new Error(
      `Category "${code}" is mapped to a result profile — change that profile's category first.`,
    );
  }
  const usedByRule = (rules ?? []).some(
    (r) =>
      Array.isArray(r.conditions) &&
      (r.conditions as { cluster?: string; valueCategory?: string }[]).some(
        (c) => c.cluster === code || c.valueCategory === code,
      ),
  );
  if (usedByRule) {
    throw new Error(
      `Category "${code}" is used by a scoring rule — remove that condition first.`,
    );
  }

  const { error } = await sb
    .from("assessment_categories")
    .delete()
    .eq("id", categoryId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

// ── Questions ─────────────────────────────────────────────────────────────────

const localized = z.record(z.string(), z.string());

const optionInputSchema = z.object({
  letter: z.string().trim().min(1).max(4),
  text: localized,
  categoryCode: z.string().nullable(),
  points: z.coerce.number().finite(),
});

const questionInputSchema = z.object({
  kind: z.enum(["single", "binary", "select", "text"]),
  title: localized,
  options: z.array(optionInputSchema).max(12).default([]),
});

type QuestionInput = z.infer<typeof questionInputSchema>;

async function runValidation(
  catalogId: string,
  input: QuestionInput,
): Promise<void> {
  const categories = await listAssessmentCategories(catalogId);
  const errors = validateCustomQuestion(
    {
      kind: input.kind,
      title: input.title,
      options: input.options.map((o) => ({
        letter: o.letter,
        text: o.text,
        categoryCode: o.categoryCode,
        points: o.points,
      })),
    },
    categories.map((c) => c.code),
  );
  if (errors.length > 0) throw new Error(errors.join(" "));
}

/** Replace a question's options wholesale (safe — a draft is never live). */
async function persistOptions(
  sb: AdminClient,
  questionId: string,
  options: QuestionInput["options"],
): Promise<void> {
  const { error: del } = await sb
    .from("question_options")
    .delete()
    .eq("question_id", questionId);
  if (del) throw new Error(del.message);
  if (options.length === 0) return;
  const { error: ins } = await sb.from("question_options").insert(
    options.map((o, i) => ({
      question_id: questionId,
      letter: o.letter.toUpperCase(),
      position: i,
      text: o.text,
      category_code: o.categoryCode,
      // weight must be > 0 (DB check). Unscored answers (no category) store the
      // default 1, which the engine ignores; scored answers are validated > 0.
      weight: o.points > 0 ? o.points : 1,
      cluster_code: null,
      driver_code: null,
      axis_value: null,
    })),
  );
  if (ins) throw new Error(ins.message);
}

export async function addCustomQuestion(
  versionId: string,
  rawInput: unknown,
): Promise<string> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  const catalogId = await assertCustomDraft(sb, versionId);
  const input = questionInputSchema.parse(rawInput);
  await runValidation(catalogId, input);

  const { data: tail } = await sb
    .from("questions")
    .select("position")
    .eq("version_id", versionId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (tail?.[0]?.position ?? -1) + 1;

  const { data, error } = await sb
    .from("questions")
    .insert({
      version_id: versionId,
      external_id: `Q-${randomUUID().slice(0, 8)}`,
      pillar: CUSTOM_PILLAR,
      position: nextPos,
      kind: input.kind,
      title: input.title,
      axis: null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not add question.");

  await persistOptions(sb, data.id as string, input.options);
  revalidatePath(`/admin/content/${versionId}/custom`);
  return data.id as string;
}

export async function saveCustomQuestion(
  versionId: string,
  questionId: string,
  rawInput: unknown,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  const catalogId = await assertCustomDraft(sb, versionId);
  const input = questionInputSchema.parse(rawInput);
  await runValidation(catalogId, input);

  const { data: q, error: qe } = await sb
    .from("questions")
    .select("version_id")
    .eq("id", questionId)
    .single();
  if (qe || !q) throw new Error("Question not found.");
  if (q.version_id !== versionId)
    throw new Error("Question does not belong to this version.");

  const { error: uq } = await sb
    .from("questions")
    .update({ kind: input.kind, title: input.title })
    .eq("id", questionId);
  if (uq) throw new Error(uq.message);

  await persistOptions(sb, questionId, input.options);
  revalidatePath(`/admin/content/${versionId}/custom`);
}

export async function deleteCustomQuestion(
  versionId: string,
  questionId: string,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertCustomDraft(sb, versionId);

  const { data: q, error: qe } = await sb
    .from("questions")
    .select("version_id")
    .eq("id", questionId)
    .single();
  if (qe || !q) throw new Error("Question not found.");
  if (q.version_id !== versionId)
    throw new Error("Question does not belong to this version.");

  const { error } = await sb.from("questions").delete().eq("id", questionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/content/${versionId}/custom`);
}
