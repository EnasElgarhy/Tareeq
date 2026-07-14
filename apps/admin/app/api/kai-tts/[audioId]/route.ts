import { getKaiNarrationText } from "@/lib/audio/kai-narration";

export const runtime = "nodejs";

const ELEVENLABS_TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const KAI_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "ZF6FPAbjXT4488VcRRnw";
const KAI_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

type RouteContext = {
  params: Promise<{ audioId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { audioId } = await context.params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "en";
  const text = getKaiNarrationText(decodeURIComponent(audioId), locale);

  if (!text) {
    return Response.json(
      { error: "Narration line not found." },
      { status: 404 },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const response = await fetch(
    `${ELEVENLABS_TTS_ENDPOINT}/${KAI_VOICE_ID}?output_format=mp3_44100_128`,
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
