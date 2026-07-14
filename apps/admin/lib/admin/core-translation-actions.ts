"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { regenerateClipForQuestion } from "@/lib/admin/audio-generation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateQuestionArSchema = z.object({
  questionId: z.string().uuid(),
  ar: z.string(),
});

const updateOptionArSchema = z.object({
  optionId: z.string().uuid(),
  ar: z.string(),
});

/**
 * Translation-only writes to the `ar` key of a CORE question/option's jsonb
 * title/text. Unlike saveQuestion (content-actions.ts), this is intentionally
 * allowed on the active/published version — it never touches structure
 * (kind, axis, option letters/order) or the `en` key the scoring engine
 * reads, so it can't affect live scoring or break the assessment.
 */
export type TranslationAudioStatus =
  | "generated"
  | "reused"
  | "up_to_date"
  | "skipped"
  | "failed";

export async function updateQuestionArabicTitle(
  versionId: string,
  rawInput: unknown,
): Promise<{ audio: TranslationAudioStatus }> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  const parsed = updateQuestionArSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new Error(
      "Invalid translation input: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    );
  }
  const { questionId, ar } = parsed.data;

  const { data: question, error: qe } = await sb
    .from("questions")
    .select("id, version_id, external_id, title")
    .eq("id", questionId)
    .single();
  if (qe || !question) throw new Error("Question not found");
  if (question.version_id !== versionId) {
    throw new Error("Question does not belong to this version");
  }

  const updatedTitle = {
    ...(question.title as Record<string, string>),
    ar: ar.trim(),
  };

  const { error } = await sb
    .from("questions")
    .update({ title: updatedTitle })
    .eq("id", questionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/content/${versionId}/translations`);

  // Best-effort: the text save above already succeeded regardless of this.
  try {
    const audio = await regenerateClipForQuestion(
      versionId,
      { id: question.id, external_id: question.external_id, title: updatedTitle },
      "ar",
    );
    return { audio };
  } catch (err) {
    console.error(`Audio regen failed for ${question.external_id} (ar):`, err);
    return { audio: "failed" };
  }
}

export async function updateOptionArabicText(
  versionId: string,
  rawInput: unknown,
): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  const parsed = updateOptionArSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new Error(
      "Invalid translation input: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    );
  }
  const { optionId, ar } = parsed.data;

  const { data: option, error: oe } = await sb
    .from("question_options")
    .select("id, text, questions!inner(version_id)")
    .eq("id", optionId)
    .single();
  if (oe || !option) throw new Error("Option not found");

  const optionVersionId = (
    option as unknown as { questions: { version_id: string } }
  ).questions.version_id;
  if (optionVersionId !== versionId) {
    throw new Error("Option does not belong to this version");
  }

  const { error } = await sb
    .from("question_options")
    .update({
      text: { ...(option.text as Record<string, string>), ar: ar.trim() },
    })
    .eq("id", optionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/content/${versionId}/translations`);
}
