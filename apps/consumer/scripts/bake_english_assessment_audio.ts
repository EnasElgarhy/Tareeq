import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { getKaiNarrationManifest } from "../lib/audio/kai-narration";
import { APPROVED_KAI_ENGLISH_VOICE } from "../lib/audio/assessment-voice";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const OUTPUT_DIR = resolve("public/audio/en-british-v1");
const VOICE_MANIFEST_PATH = resolve(OUTPUT_DIR, "voice-manifest.json");

type VoiceMetadata = {
  name?: string;
  labels?: Record<string, string>;
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

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readApprovedVoice(apiKey: string): Promise<VoiceMetadata> {
  const response = await fetch(
    `${ELEVENLABS_API}/voices/${APPROVED_KAI_ENGLISH_VOICE.id}`,
    { headers: { "xi-api-key": apiKey } },
  );
  if (!response.ok) {
    throw new Error(`Could not verify approved voice (${response.status}).`);
  }

  const voice = (await response.json()) as VoiceMetadata;
  const accent = voice.labels?.accent?.toLowerCase();
  const gender = voice.labels?.gender?.toLowerCase();
  if (
    accent !== APPROVED_KAI_ENGLISH_VOICE.accent ||
    gender !== APPROVED_KAI_ENGLISH_VOICE.gender
  ) {
    throw new Error(
      `Approved voice metadata changed: expected ${APPROVED_KAI_ENGLISH_VOICE.accent} ${APPROVED_KAI_ENGLISH_VOICE.gender}.`,
    );
  }

  return voice;
}

async function generateClip(apiKey: string, text: string): Promise<Buffer> {
  const response = await fetch(
    `${ELEVENLABS_API}/text-to-speech/${APPROVED_KAI_ENGLISH_VOICE.id}?output_format=${APPROVED_KAI_ENGLISH_VOICE.outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: APPROVED_KAI_ENGLISH_VOICE.modelId,
        language_code: "en",
        voice_settings: APPROVED_KAI_ENGLISH_VOICE.settings,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${await response.text()}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const apiKey = requiredEnv("ELEVENLABS_API_KEY");
  const voice = await readApprovedVoice(apiKey);
  const narration = getKaiNarrationManifest("en");
  const uniqueIds = new Set(narration.map(({ id }) => id));

  if (uniqueIds.size !== narration.length) {
    throw new Error("English narration manifest contains duplicate audio IDs.");
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const clips = [];

  for (const [index, entry] of narration.entries()) {
    if (!entry.text.trim()) {
      throw new Error(`Missing English narration text for ${entry.id}.`);
    }

    process.stdout.write(
      `[${index + 1}/${narration.length}] Baking ${entry.id}...\n`,
    );
    const audio = await generateClip(apiKey, entry.text);
    const filename = `${entry.id}.mp3`;
    writeFileSync(resolve(OUTPUT_DIR, filename), audio);
    clips.push({
      audioId: entry.id,
      path: `/audio/en-british-v1/${filename}`,
      bytes: audio.byteLength,
      sha256: createHash("sha256").update(audio).digest("hex"),
    });
  }

  writeFileSync(
    VOICE_MANIFEST_PATH,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        locale: "en",
        voice: {
          id: APPROVED_KAI_ENGLISH_VOICE.id,
          name: voice.name ?? "Kai English",
          accent: APPROVED_KAI_ENGLISH_VOICE.accent,
          gender: APPROVED_KAI_ENGLISH_VOICE.gender,
          modelId: APPROVED_KAI_ENGLISH_VOICE.modelId,
          settings: APPROVED_KAI_ENGLISH_VOICE.settings,
        },
        clips,
      },
      null,
      2,
    )}\n`,
  );

  process.stdout.write(
    `Baked ${clips.length} clips with the approved British voice.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
