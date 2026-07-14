import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ELEVENLABS_TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const BUCKET = "kai-audio-clips";
const CLIP_KIND = "narration";
const LOCALES = ["en", "ar"] as const;
// ElevenLabs' plan on this account caps concurrent requests at 3.
const CONCURRENCY = 2;

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

type MinimalQuestion = {
  id: string;
  external_id: string;
  title: Record<string, string>;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function voiceByLocale(): Record<string, string> {
  return {
    en: requiredEnv("ELEVENLABS_VOICE_ID"),
    ar: requiredEnv("ELEVENLABS_VOICE_ID_AR"),
  };
}

function hashText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

async function callElevenLabsTts(
  text: string,
  voiceId: string,
  locale: string,
): Promise<Buffer> {
  const apiKey = requiredEnv("ELEVENLABS_API_KEY");
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  const response = await fetch(
    `${ELEVENLABS_TTS_ENDPOINT}/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        language_code: locale,
        voice_settings: {
          stability: 0.48,
          similarity_boost: 0.84,
          style: 0.28,
          speed: 1,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs TTS failed (${response.status}) for voice ${voiceId}: ${errorBody}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/** Any existing clip (any version) for this external_id whose text hash still
 *  matches — lets us skip a fresh ElevenLabs call after a version clone when
 *  the question's text didn't actually change. */
async function findReusableClip(
  sb: AdminClient,
  externalId: string,
  locale: string,
  hash: string,
): Promise<{ storage_path: string; voice: string; bytes: number } | null> {
  const { data, error } = await sb
    .from("audio_clips")
    .select("storage_path, voice, bytes, questions!inner(external_id)")
    .eq("locale", locale)
    .eq("kind", CLIP_KIND)
    .eq("source_text_hash", hash)
    .eq("questions.external_id", externalId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

type ClipAction = "up_to_date" | "reused" | "generated" | "skipped";

async function ensureClip(
  sb: AdminClient,
  versionId: string,
  question: MinimalQuestion,
  locale: string,
  voices: Record<string, string>,
): Promise<ClipAction> {
  const text = question.title[locale];
  if (!text?.trim()) return "skipped";

  const hash = hashText(text);

  const { data: existing, error: existingError } = await sb
    .from("audio_clips")
    .select("id, source_text_hash")
    .eq("question_id", question.id)
    .eq("locale", locale)
    .eq("kind", CLIP_KIND)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing && existing.source_text_hash === hash) {
    return "up_to_date";
  }

  const reusable = await findReusableClip(sb, question.external_id, locale, hash);

  const clipRow = reusable
    ? {
        question_id: question.id,
        kind: CLIP_KIND,
        locale,
        voice: reusable.voice,
        storage_path: reusable.storage_path,
        bytes: reusable.bytes,
        source_text_hash: hash,
      }
    : await (async () => {
        const voiceId = voices[locale];
        const audioBuffer = await callElevenLabsTts(text, voiceId, locale);
        const storagePath = `${versionId}/${question.external_id}-${locale}.mp3`;

        const { error: uploadError } = await sb.storage
          .from(BUCKET)
          .upload(storagePath, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });
        if (uploadError) throw new Error(uploadError.message);

        return {
          question_id: question.id,
          kind: CLIP_KIND,
          locale,
          voice: voiceId,
          storage_path: storagePath,
          bytes: audioBuffer.byteLength,
          source_text_hash: hash,
        };
      })();

  const { error: writeError } = existing
    ? await sb.from("audio_clips").update(clipRow).eq("id", existing.id)
    : await sb.from("audio_clips").insert(clipRow);
  if (writeError) throw new Error(writeError.message);

  return reusable ? "reused" : "generated";
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await task(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export interface AudioRegenSummary {
  generated: number;
  reused: number;
  upToDate: number;
  skipped: number;
  failed: number;
}

/** Regenerate (or reuse) clips for every question in a version. Called after
 *  publish — best-effort: a single ElevenLabs failure doesn't stop the rest. */
export async function regenerateStaleAudioForVersion(
  versionId: string,
): Promise<AudioRegenSummary> {
  const sb = createSupabaseAdminClient();
  const voices = voiceByLocale();

  const { data: questions, error } = await sb
    .from("questions")
    .select("id, external_id, title")
    .eq("version_id", versionId);
  if (error) throw new Error(error.message);

  const summary: AudioRegenSummary = {
    generated: 0,
    reused: 0,
    upToDate: 0,
    skipped: 0,
    failed: 0,
  };

  const jobs = (questions as MinimalQuestion[]).flatMap((question) =>
    LOCALES.map((locale) => ({ question, locale })),
  );

  await runWithConcurrency(jobs, CONCURRENCY, async ({ question, locale }) => {
    try {
      const action = await ensureClip(sb, versionId, question, locale, voices);
      summary[
        action === "up_to_date"
          ? "upToDate"
          : action === "reused"
            ? "reused"
            : action === "generated"
              ? "generated"
              : "skipped"
      ] += 1;
    } catch (err) {
      summary.failed += 1;
      console.error(
        `Audio regen failed for ${question.external_id} (${locale}):`,
        err,
      );
    }
  });

  return summary;
}

/** Regenerate a single question's clip for one locale — used right after a
 *  translation save so the live app reflects the edit immediately. */
export async function regenerateClipForQuestion(
  versionId: string,
  question: MinimalQuestion,
  locale: string,
): Promise<ClipAction> {
  const sb = createSupabaseAdminClient();
  return ensureClip(sb, versionId, question, locale, voiceByLocale());
}
