"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  type ExtractedDraft,
  extractAssessmentDraft,
  normalizeExtractedDraft,
} from "@/lib/admin/ai-extract";
import { extractTextFromUpload } from "@/lib/admin/parse-document";
import { trackEvent } from "@/lib/analytics/track";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const CUSTOM_PILLAR = 1;

async function assertCustomDraft(
  sb: AdminClient,
  catalogId: string,
): Promise<void> {
  const { data, error } = await sb
    .from("assessments_catalog")
    .select("status,assessment_type")
    .eq("id", catalogId)
    .single();
  if (error || !data) throw new Error("Assessment not found.");
  if (data.status !== "draft") throw new Error("Only drafts can be imported into.");
  if (data.assessment_type !== "custom") {
    throw new Error("AI import only applies to custom assessments.");
  }
}

const extractSchema = z.object({
  questionsText: z.string().trim().min(1, "Paste or upload the questions source."),
  scoringText: z.string().trim().optional().default(""),
  questionsStoragePath: z.string().nullable().optional(),
  scoringStoragePath: z.string().nullable().optional(),
});

/**
 * Parse an uploaded file (CSV/TXT/MD/PDF/DOCX) to text and store the original in
 * the private `assessment-sources` bucket. Returns the text for the admin to
 * review before extraction (original-file storage is provenance; non-fatal).
 */
export async function parseUploadedDocument(
  catalogId: string,
  formData: FormData,
): Promise<{ text: string; fileName: string; fileType: string; storagePath: string | null }> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertCustomDraft(sb, catalogId);

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file uploaded.");
  if (file.size > 5_000_000) throw new Error("File too large (max 5 MB).");

  const { text, fileType } = await extractTextFromUpload(file);
  if (!text.trim()) throw new Error("Couldn't extract any text from that file.");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${catalogId}/${randomUUID()}-${safeName}`;
  let storagePath: string | null = null;
  const { error } = await sb.storage
    .from("assessment-sources")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) console.error("[ai-import] storage upload failed:", error.message);
  else storagePath = path;

  return { text, fileName: file.name, fileType, storagePath };
}

/**
 * Run AI extraction on uploaded/pasted source text, record the source, and
 * return a draft for the admin to REVIEW (nothing structural is created yet).
 */
export async function runExtraction(
  catalogId: string,
  rawInput: unknown,
): Promise<ExtractedDraft> {
  const admin = await requireAdmin();
  const input = extractSchema.parse(rawInput);
  const sb = createSupabaseAdminClient();
  await assertCustomDraft(sb, catalogId);

  // Record the source documents (extracted text + original-file storage path).
  const docs = [
    {
      category: "questions",
      text: input.questionsText,
      storagePath: input.questionsStoragePath ?? null,
    },
    ...(input.scoringText
      ? [
          {
            category: "scoring_logic",
            text: input.scoringText,
            storagePath: input.scoringStoragePath ?? null,
          },
        ]
      : []),
  ];
  await sb.from("source_documents").insert(
    docs.map((d) => ({
      catalog_id: catalogId,
      file_name: d.storagePath?.split("/").pop() ?? `${d.category}.txt`,
      file_type: "txt",
      category: d.category,
      storage_path: d.storagePath,
      extracted_text: d.text,
      uploaded_by: admin.id,
    })),
  );

  trackEvent("ai_generation_started", {
    assessmentId: catalogId,
    userId: admin.id,
    kind: "assessment_extraction",
  });
  try {
    const draft = await extractAssessmentDraft({
      questionsText: input.questionsText,
      scoringText: input.scoringText || undefined,
    });
    trackEvent("ai_generation_completed", {
      assessmentId: catalogId,
      userId: admin.id,
      kind: "assessment_extraction",
      questionCount: draft.questions.length,
    });
    return draft;
  } catch (error) {
    trackEvent("ai_generation_failed", {
      assessmentId: catalogId,
      userId: admin.id,
      kind: "assessment_extraction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Persist a reviewed draft: categories → questions+options → profiles → rules.
 * Skips categories/profiles whose code already exists (idempotent-ish re-apply).
 */
export async function applyExtractedDraft(
  catalogId: string,
  versionId: string,
  rawDraft: unknown,
): Promise<{ categories: number; questions: number; profiles: number; rules: number }> {
  const admin = await requireAdmin();
  const sb = createSupabaseAdminClient();
  await assertCustomDraft(sb, catalogId);
  const draft = normalizeExtractedDraft(rawDraft); // re-normalise: never trust client input

  // 1) Categories (skip existing codes).
  const { data: existingCats } = await sb
    .from("assessment_categories")
    .select("code")
    .eq("catalog_id", catalogId);
  const haveCat = new Set((existingCats ?? []).map((c) => c.code as string));
  const newCats = draft.categories.filter((c) => !haveCat.has(c.code));
  if (newCats.length > 0) {
    const { error } = await sb.from("assessment_categories").insert(
      newCats.map((c, i) => ({
        catalog_id: catalogId,
        code: c.code,
        name: c.name,
        display_order: i,
      })),
    );
    if (error) throw new Error(error.message);
  }

  // 2) Questions + options (append after existing).
  const { data: tail } = await sb
    .from("questions")
    .select("position")
    .eq("version_id", versionId)
    .order("position", { ascending: false })
    .limit(1);
  let pos = ((tail?.[0]?.position as number | undefined) ?? -1) + 1;
  let questionCount = 0;
  for (const q of draft.questions) {
    const { data: inserted, error } = await sb
      .from("questions")
      .insert({
        version_id: versionId,
        external_id: `Q-${randomUUID().slice(0, 8)}`,
        pillar: CUSTOM_PILLAR,
        position: pos++,
        kind: q.kind,
        title: q.title,
        axis: null,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Question insert failed.");
    questionCount++;
    if (q.options.length > 0) {
      const { error: oe } = await sb.from("question_options").insert(
        q.options.map((o, i) => ({
          question_id: inserted.id,
          letter: o.letter,
          position: i,
          text: o.text,
          category_code: o.categoryCode,
          // weight must be > 0 (DB check). Unscored answers (no category) store
          // the default 1, which the engine ignores for null-category options.
          weight: o.points > 0 ? o.points : 1,
          cluster_code: null,
          driver_code: null,
          axis_value: null,
        })),
      );
      if (oe) throw new Error(oe.message);
    }
  }

  // 3) Profiles (skip existing codes); map code → id for rule wiring.
  const { data: existingProfiles } = await sb
    .from("result_profiles")
    .select("id,code")
    .eq("catalog_id", catalogId);
  const profileIdByCode = new Map<string, string>();
  for (const p of existingProfiles ?? []) {
    if (p.code) profileIdByCode.set(p.code as string, p.id as string);
  }
  let profileCount = 0;
  for (const p of draft.profiles) {
    if (profileIdByCode.has(p.code)) continue;
    const { data: inserted, error } = await sb
      .from("result_profiles")
      .insert({
        catalog_id: catalogId,
        code: p.code,
        name: p.title,
        description: p.description ?? {},
        category_code: p.categoryCode,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Profile insert failed.");
    profileIdByCode.set(p.code, inserted.id as string);
    profileCount++;
  }

  // 4) Rules (resolve profile code → id).
  let ruleCount = 0;
  for (const r of draft.rules) {
    const profileId = profileIdByCode.get(r.resultProfileCode);
    if (!profileId) continue;
    const { error } = await sb.from("result_rules").insert({
      catalog_id: catalogId,
      result_profile_id: profileId,
      combinator: r.combinator,
      conditions: r.conditions,
      priority: r.priority,
    });
    if (error) throw new Error(error.message);
    ruleCount++;
  }

  revalidatePath(`/admin/content/${versionId}/custom`);
  revalidatePath(`/admin/content/${versionId}/scoring`);
  trackEvent("assessment_import_generated", {
    assessmentId: catalogId,
    assessmentVersion: versionId,
    userId: admin.id,
    categories: newCats.length,
    questions: questionCount,
    profiles: profileCount,
    rules: ruleCount,
  });
  return {
    categories: newCats.length,
    questions: questionCount,
    profiles: profileCount,
    rules: ruleCount,
  };
}
