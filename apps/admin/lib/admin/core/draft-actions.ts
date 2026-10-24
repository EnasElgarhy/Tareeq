"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCoreDraft } from "@/lib/admin/core/drafts";
import {
  applyItemTextEdit,
  compareStructure,
  CORE_QUESTION_SET,
  validateQuestionSet,
} from "@/lib/admin/core/framework";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Wording edits to the CORE 2.0 question set. A draft copies the packaged set;
 * every save re-checks that only wording changed (compareStructure) and that
 * the result is still a valid set. Nothing here reaches students: the draft is
 * downloaded and shipped as the next question-set file.
 */

const MAX_TEXT = 2000;

const createSchema = z.object({
  targetVersion: z
    .string()
    .trim()
    .regex(/^\d+\.\d+$/, "Use a version like 5.3."),
  notes: z.string().trim().max(500).optional().default(""),
});

const textPair = z.object({
  text_en: z.string().max(MAX_TEXT),
  text_ar: z.string().max(MAX_TEXT),
});

const itemEditSchema = z.object({
  itemId: z.string().trim().min(1).max(20),
  stem_en: z.string().max(MAX_TEXT),
  stem_ar: z.string().max(MAX_TEXT),
  options: z.record(z.string(), textPair),
});

export async function createCoreDraft(rawInput: unknown): Promise<string> {
  const admin = await requireAdmin();
  const input = createSchema.parse(rawInput);
  if (input.targetVersion === CORE_QUESTION_SET.version) {
    throw new Error(
      `${CORE_QUESTION_SET.version} is the live set; pick the next version.`,
    );
  }
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("core_question_set_drafts")
    .insert({
      base_version: CORE_QUESTION_SET.version,
      target_version: input.targetVersion,
      body: { ...CORE_QUESTION_SET, version: input.targetVersion },
      notes: input.notes || null,
      created_by: admin.id,
      updated_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Could not create the draft.");
  revalidatePath("/admin/content/core");
  return data.id as string;
}

export async function saveCoreDraftItem(
  draftId: string,
  rawInput: unknown,
): Promise<void> {
  const admin = await requireAdmin();
  const input = itemEditSchema.parse(rawInput);
  const draft = await getCoreDraft(draftId);
  if (!draft) throw new Error("Draft not found.");
  if (draft.status !== "draft") {
    throw new Error("This draft was handed off and is read-only.");
  }

  const next = applyItemTextEdit(draft.body, input.itemId, input);
  const problems = [
    ...compareStructure(CORE_QUESTION_SET, next),
    ...validateQuestionSet(next),
  ];
  if (problems.length > 0) throw new Error(problems.join(" "));

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("core_question_set_drafts")
    .update({
      body: next,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/content/core/drafts/${draftId}`);
}

/** Freeze a finished draft once it has been downloaded for the developer. */
export async function markCoreDraftHandedOff(draftId: string): Promise<void> {
  const admin = await requireAdmin();
  const draft = await getCoreDraft(draftId);
  if (!draft) throw new Error("Draft not found.");
  const problems = [
    ...compareStructure(CORE_QUESTION_SET, draft.body),
    ...validateQuestionSet(draft.body),
  ];
  if (problems.length > 0) throw new Error(problems.join(" "));

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("core_question_set_drafts")
    .update({
      status: "handed_off",
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content/core");
  revalidatePath(`/admin/content/core/drafts/${draftId}`);
}

export async function deleteCoreDraft(draftId: string): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("core_question_set_drafts")
    .delete()
    .eq("id", draftId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content/core");
}
