import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { APPROVED_KAI_ENGLISH_VOICE } from "../lib/audio/assessment-voice";
import { CORE_ASSESSMENT_QUESTIONS } from "../lib/core-v2/assessment";

/**
 * Bakes Kai's narration for CORE question set 5.2 (question text only, as
 * for the legacy questions): English with the approved British voice into
 * public/audio/en-british-v1/<id>.mp3, Arabic with the Arabic voice into
 * public/audio/<id>.ar.mp3. Existing files are skipped unless --force.
 *
 *   node_modules/.bin/tsx scripts/bake_core_question_audio.ts [--force] [--only=en|ar]
 */

const ELEVENLABS_API = "https://api.elevenlabs.io/v1/text-to-speech";
const EN_DIR = resolve("public/audio/en-british-v1");
const AR_DIR = resolve("public/audio");
const MANIFEST_PATH = resolve("public/audio/core-5.1-audio-manifest.json");
/** Same as the live Arabic voice in app/api/kai-tts/[audioId]/route.ts. */
const DEFAULT_AR_VOICE = "TnMRj7MvjNftqf5An7lL";
const AR_SETTINGS = {
  stability: 0.48,
  similarity_boost: 0.84,
  style: 0.28,
  speed: 1,
};

function loadEnvFile(path: string) {
  const fullPath = resolve(path);
  if (!existsSync(fullPath)) return;
  for (const line of readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed
      .slice(equalsIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function tts(
  apiKey: string,
  text: string,
  locale: "en" | "ar",
): Promise<Buffer> {
  const isEnglish = locale === "en";
  const voiceId = isEnglish
    ? APPROVED_KAI_ENGLISH_VOICE.id
    : process.env.ELEVENLABS_VOICE_ID_AR || DEFAULT_AR_VOICE;
  const response = await fetch(
    `${ELEVENLABS_API}/${voiceId}?output_format=${APPROVED_KAI_ENGLISH_VOICE.outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: isEnglish
          ? APPROVED_KAI_ENGLISH_VOICE.modelId
          : process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
        language_code: locale,
        voice_settings: isEnglish
          ? APPROVED_KAI_ENGLISH_VOICE.settings
          : AR_SETTINGS,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `ElevenLabs ${locale} failed (${response.status}): ${await response.text()}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  loadEnvFile(".env.local");
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");
  const force = process.argv.includes("--force");
  const only = process.argv
    .find((arg) => arg.startsWith("--only="))
    ?.split("=")[1];
  const locales = (only ? [only] : ["en", "ar"]) as ("en" | "ar")[];

  mkdirSync(EN_DIR, { recursive: true });
  const clips: {
    audioId: string;
    locale: string;
    path: string;
    bytes: number;
    sha256: string;
  }[] = [];
  let baked = 0;

  for (const locale of locales) {
    for (const [i, question] of CORE_ASSESSMENT_QUESTIONS.entries()) {
      const text = question.title[locale]?.trim();
      if (!text)
        throw new Error(`Missing ${locale} text for ${question.externalId}`);
      const file =
        locale === "en"
          ? resolve(EN_DIR, `${question.externalId}.mp3`)
          : resolve(AR_DIR, `${question.externalId}.ar.mp3`);
      if (!force && existsSync(file)) {
        process.stdout.write(
          `[${locale} ${i + 1}] ${question.externalId} exists, skipped\n`,
        );
      } else {
        process.stdout.write(
          `[${locale} ${i + 1}/${CORE_ASSESSMENT_QUESTIONS.length}] ${question.externalId}\n`,
        );
        writeFileSync(file, await tts(apiKey, text, locale));
        baked += 1;
      }
      const audio = readFileSync(file);
      clips.push({
        audioId: question.externalId,
        locale,
        path: file.replace(resolve("public"), ""),
        bytes: audio.byteLength,
        sha256: createHash("sha256").update(audio).digest("hex"),
      });
    }
  }

  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify({ schemaVersion: 1, questionSet: "5.2", clips }, null, 2)}\n`,
  );
  recordEnglishClipsInVoiceManifest(clips.filter((clip) => clip.locale === "en"));
  process.stdout.write(`Baked ${baked} clips; manifest has ${clips.length}.\n`);
}

/**
 * The English clips use the approved British voice, so they join the
 * voice manifest the narration test locks every English clip against.
 */
function recordEnglishClipsInVoiceManifest(
  englishClips: { audioId: string; path: string; bytes: number; sha256: string }[],
) {
  const path = resolve(EN_DIR, "voice-manifest.json");
  const manifest = JSON.parse(readFileSync(path, "utf8")) as {
    clips: { audioId: string }[];
  };
  const ids = new Set(englishClips.map((clip) => clip.audioId));
  manifest.clips = [
    ...manifest.clips.filter((clip) => !ids.has(clip.audioId)),
    ...englishClips.map(({ audioId, path: clipPath, bytes, sha256 }) => ({
      audioId,
      path: clipPath,
      bytes,
      sha256,
    })),
  ];
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
