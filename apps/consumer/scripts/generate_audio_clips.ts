import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APPROVED_KAI_ENGLISH_VOICE } from "../lib/audio/assessment-voice";

const ELEVENLABS_TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const MODEL_ID = "eleven_multilingual_v2";
const LOCALES = ["en", "ar"] as const;
const BUCKET = "kai-audio-clips";
const CLIP_KIND = "narration";

type DbQuestion = {
  id: string;
  external_id: string;
  title: Record<string, string>;
};

function loadEnvFile(path: string) {
  const fullPath = resolve(path);
  if (!existsSync(fullPath)) return;

  const content = readFileSync(fullPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function generateTts(
  apiKey: string,
  text: string,
  voiceId: string,
  locale: string,
): Promise<Buffer> {
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
        model_id: MODEL_ID,
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

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const supabaseUrl =
    process.env.SUPABASE_URL ?? requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const elevenLabsApiKey = requiredEnv("ELEVENLABS_API_KEY");
  const voiceByLocale: Record<string, string> = {
    en: APPROVED_KAI_ENGLISH_VOICE.id,
    ar: requiredEnv("ELEVENLABS_VOICE_ID_AR"),
  };

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: activeVersion, error: versionError } = await supabase
    .from("content_versions")
    .select("id, label")
    .eq("is_active", true)
    .single();
  if (versionError) throw versionError;

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, external_id, title")
    .eq("version_id", activeVersion.id)
    .order("position", { ascending: true });
  if (questionsError) throw questionsError;

  let generated = 0;
  let skipped = 0;

  for (const question of questions as DbQuestion[]) {
    for (const locale of LOCALES) {
      const text = question.title[locale];
      if (!text) {
        console.log(`Skipping ${question.external_id} (${locale}): no text.`);
        skipped += 1;
        continue;
      }

      const voiceId = voiceByLocale[locale];
      const storagePath = `${activeVersion.id}/${question.external_id}-${locale}.mp3`;

      console.log(`Generating ${question.external_id} (${locale})...`);
      const audioBuffer = await generateTts(
        elevenLabsApiKey,
        text,
        voiceId,
        locale,
      );

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: existingClip, error: existingClipError } = await supabase
        .from("audio_clips")
        .select("id")
        .eq("question_id", question.id)
        .eq("locale", locale)
        .eq("kind", CLIP_KIND)
        .maybeSingle();
      if (existingClipError) throw existingClipError;

      const clipRow = {
        question_id: question.id,
        kind: CLIP_KIND,
        locale,
        voice: voiceId,
        storage_path: storagePath,
        bytes: audioBuffer.byteLength,
      };

      const { error: writeError } = existingClip
        ? await supabase
            .from("audio_clips")
            .update(clipRow)
            .eq("id", existingClip.id)
        : await supabase.from("audio_clips").insert(clipRow);
      if (writeError) throw writeError;

      generated += 1;
    }
  }

  console.log(
    `Generated/updated ${generated} audio clips for version ${activeVersion.label}, skipped ${skipped} (missing text).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
