"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";
import { SUPPORTED_LOCALES } from "@/lib/admin/locales";
import { listResultProfiles } from "@/lib/admin/scoring-content";
import { trackEvent } from "@/lib/analytics/track";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const LOCALE_NAMES: Record<string, string> = { en: "English", ar: "Arabic" };

/** Translate an ordered batch of strings via Gemini; returns same-length array. */
async function translateBatch(
  texts: string[],
  targetLocale: string,
): Promise<string[]> {
  if (texts.length === 0) return [];
  const key = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const model = (process.env.GEMINI_MODEL ?? "").trim() || "gemini-2.5-flash";
  const language = LOCALE_NAMES[targetLocale] ?? targetLocale;

  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `Translate each input string to ${language}. Return a JSON array of strings in the SAME order and length. Preserve meaning and tone; output only the translations.`,
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(texts) }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: { type: "array", items: { type: "string" } },
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[translate] gemini ${response.status}: ${detail.slice(0, 200)}`);
    throw new Error(`Translation failed (Gemini ${response.status}).`);
  }
  const data = await response.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p?.text)
    .filter((t: unknown): t is string => typeof t === "string")
    .join("");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Translation returned malformed JSON.");
  }
  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error("Translation returned an unexpected shape.");
  }
  return parsed.map((v) => (typeof v === "string" ? v : ""));
}

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

interface Pending {
  apply: (sb: AdminClient, translated: string) => Promise<void>;
  source: string;
}

const localeSchema = z.enum(SUPPORTED_LOCALES);

/**
 * Fill every required field that has English text but is missing `targetLocale`,
 * using AI translation. Returns how many fields were filled. The values are
 * machine translations flagged for human review (this never blocks publish).
 */
export async function autoTranslateAssessment(
  catalogId: string,
  versionId: string,
  rawLocale: unknown,
): Promise<{ translated: number }> {
  const admin = await requireAdmin();
  const targetLocale = localeSchema.parse(rawLocale);
  const sb = createSupabaseAdminClient();

  const [categories, questions, profiles] = await Promise.all([
    listAssessmentCategories(catalogId),
    listCustomQuestions(versionId),
    listResultProfiles(catalogId),
  ]);

  const pending: Pending[] = [];
  const has = (t: Record<string, string>, l: string) => Boolean((t?.[l] ?? "").trim());

  for (const c of categories) {
    if (has(c.name, "en") && !has(c.name, targetLocale)) {
      pending.push({
        source: c.name.en ?? "",
        apply: async (db, tr) => {
          await db
            .from("assessment_categories")
            .update({ name: { ...c.name, [targetLocale]: tr } })
            .eq("id", c.id);
        },
      });
    }
  }
  for (const q of questions) {
    if (has(q.title, "en") && !has(q.title, targetLocale)) {
      pending.push({
        source: q.title.en ?? "",
        apply: async (db, tr) => {
          await db
            .from("questions")
            .update({ title: { ...q.title, [targetLocale]: tr } })
            .eq("id", q.id);
        },
      });
    }
    for (const o of q.options) {
      if (has(o.text, "en") && !has(o.text, targetLocale)) {
        pending.push({
          source: o.text.en ?? "",
          apply: async (db, tr) => {
            await db
              .from("question_options")
              .update({ text: { ...o.text, [targetLocale]: tr } })
              .eq("id", o.id);
          },
        });
      }
    }
  }
  for (const p of profiles) {
    if (has(p.name, "en") && !has(p.name, targetLocale)) {
      pending.push({
        source: p.name.en ?? "",
        apply: async (db, tr) => {
          await db
            .from("result_profiles")
            .update({ name: { ...p.name, [targetLocale]: tr } })
            .eq("id", p.id);
        },
      });
    }
  }

  if (pending.length === 0) return { translated: 0 };

  trackEvent("ai_generation_started", {
    assessmentId: catalogId,
    userId: admin.id,
    kind: "translation",
    targetLocale,
  });
  let translations: string[];
  try {
    translations = await translateBatch(
      pending.map((p) => p.source),
      targetLocale,
    );
  } catch (error) {
    trackEvent("ai_generation_failed", {
      assessmentId: catalogId,
      userId: admin.id,
      kind: "translation",
      targetLocale,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
  for (let i = 0; i < pending.length; i++) {
    const tr = translations[i];
    if (tr) await pending[i].apply(sb, tr);
  }

  const translated = pending.filter((_, i) => translations[i]).length;
  revalidatePath(`/admin/content/${versionId}/translations`);
  revalidatePath(`/admin/content/${versionId}/custom`);
  trackEvent("ai_generation_completed", {
    assessmentId: catalogId,
    userId: admin.id,
    kind: "translation",
    targetLocale,
    translated,
  });
  trackEvent("translation_generated", {
    assessmentId: catalogId,
    assessmentVersion: versionId,
    userId: admin.id,
    locale: targetLocale,
    count: translated,
  });
  return { translated };
}
