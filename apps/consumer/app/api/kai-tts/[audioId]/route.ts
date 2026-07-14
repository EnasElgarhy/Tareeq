import { getKaiNarrationText } from "@/lib/audio/kai-narration";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ELEVENLABS_TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const KAI_VOICE_ID_EN =
  process.env.ELEVENLABS_VOICE_ID || "ZF6FPAbjXT4488VcRRnw";
// Dedicated Arabic voice — overridable via ELEVENLABS_VOICE_ID_AR.
const KAI_VOICE_ID_AR =
  process.env.ELEVENLABS_VOICE_ID_AR || "TnMRj7MvjNftqf5An7lL";
const KAI_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const AUDIO_CLIPS_BUCKET = "kai-audio-clips";
const AUDIO_CLIP_KIND = "narration";
const SIGNED_URL_TTL_SECONDS = 60;

function shortLocaleOf(locale: string): string {
  return locale.split("-", 1)[0]?.toLowerCase() ?? locale;
}

function resolveVoiceId(locale: string): string {
  return shortLocaleOf(locale) === "ar" ? KAI_VOICE_ID_AR : KAI_VOICE_ID_EN;
}

/**
 * Pre-generated clips (from scripts/generate_audio_clips.ts) live in Supabase
 * Storage, keyed off the questions table — narration lines that aren't DB
 * questions (Kai's intro/encouragement lines) have no row and fall through
 * to live generation below.
 */
async function fetchPersistedAudio(
  audioId: string,
  locale: string,
): Promise<Response | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: question } = await supabase
      .from("questions")
      .select("id")
      .eq("external_id", audioId)
      .maybeSingle();
    if (!question) return null;

    const { data: clip } = await supabase
      .from("audio_clips")
      .select("storage_path")
      .eq("question_id", question.id)
      .eq("locale", shortLocaleOf(locale))
      .eq("kind", AUDIO_CLIP_KIND)
      .maybeSingle();
    if (!clip) return null;

    const { data: signed, error: signError } = await supabase.storage
      .from(AUDIO_CLIPS_BUCKET)
      .createSignedUrl(clip.storage_path, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed) return null;

    const cachedResponse = await fetch(signed.signedUrl);
    if (!cachedResponse.ok || !cachedResponse.body) return null;

    return new Response(cachedResponse.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return null;
  }
}

type RouteContext = {
  params: Promise<{ audioId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { audioId } = await context.params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "en";
  const decodedAudioId = decodeURIComponent(audioId);
  const text = getKaiNarrationText(decodedAudioId, locale);

  if (!text) {
    return Response.json(
      { error: "Narration line not found." },
      { status: 404 },
    );
  }

  const persisted = await fetchPersistedAudio(decodedAudioId, locale);
  if (persisted) return persisted;

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const voiceId = resolveVoiceId(locale);
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
        model_id: KAI_MODEL_ID,
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
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
