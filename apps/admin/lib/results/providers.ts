import { GEMINI_RESPONSE_SCHEMA } from "@/lib/results/prompt";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/**
 * LLM providers for results generation. Each provider takes the shared
 * system prompt + user content and returns the model's generated fields
 * (a partial report). Providers THROW on any failure; the route catches
 * and falls back to the deterministic report.
 */

export type ProviderSource = "gemini" | "claude";

export interface ProviderResult {
  generated: Partial<PersonalizedCompassReport>;
  model: string;
  source: ProviderSource;
}

export interface GenerateArgs {
  system: string;
  userContent: string;
}

const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
const CLAUDE_DEFAULT_MODEL = "claude-sonnet-4-20250514";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";

function geminiKey(): string {
  return (process.env.GEMINI_API_KEY ?? "").trim();
}

/** Model name is server-controlled, but validate before it hits the URL. */
function geminiModel(): string {
  const model = (process.env.GEMINI_MODEL ?? "").trim();
  return /^[\w.-]+$/.test(model) ? model : GEMINI_DEFAULT_MODEL;
}

function claudeKey(): string {
  return (process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY ?? "").trim();
}

/** Salvage a JSON object from a text response (Claude returns prose+JSON). */
function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("No JSON");
    return JSON.parse(text.slice(start, end + 1));
  }
}

// ---------- Gemini (Google AI Studio) ----------

async function generateWithGemini({
  system,
  userContent,
}: GenerateArgs): Promise<ProviderResult> {
  const key = geminiKey();
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const model = geminiModel();

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
      // Gemini 2.5 "thinking" spends output tokens on reasoning and can
      // truncate the JSON (→ intermittent parse failures). Disable it so the
      // whole budget goes to the structured result.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  // Retry transient overload / rate responses with a short backoff before
  // giving up (and falling back to the deterministic base report).
  const RETRY_STATUSES = new Set([429, 500, 503]);
  const backoffsMs = [400, 900];
  let response: Response | undefined;
  for (let attempt = 0; ; attempt++) {
    response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      // Key goes in a header (x-goog-api-key), never in the URL/query string.
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body,
    });
    if (response.ok || !RETRY_STATUSES.has(response.status) || attempt >= backoffsMs.length) {
      break;
    }
    const retryDetail = await response.text().catch(() => "");
    console.error(
      `[results/gemini] ${response.status} on attempt ${attempt + 1}, retrying: ${retryDetail.slice(0, 160)}`,
    );
    await new Promise((resolve) => setTimeout(resolve, backoffsMs[attempt]));
  }

  if (!response.ok) {
    // Log the provider's error body server-side only; never return it to the
    // client (it can expose quota/auth/infra detail).
    const detail = await response.text().catch(() => "");
    console.error(`[results/gemini] ${response.status}: ${detail.slice(0, 500)}`);
    throw new Error(`Gemini API returned ${response.status}.`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const parts: Array<{ text?: string; thought?: boolean }> =
    candidate?.content?.parts ?? [];
  const text = parts
    .filter((part) => part?.thought !== true)
    .map((part) => part?.text)
    .filter((value): value is string => typeof value === "string")
    .join("");

  if (!text) {
    console.error(`[results/gemini] no text content. finishReason=${finishReason}`);
    throw new Error("Gemini response had no text content.");
  }

  let generated: Partial<PersonalizedCompassReport>;
  try {
    generated = JSON.parse(text) as Partial<PersonalizedCompassReport>;
  } catch {
    // Log server-side for diagnosis; never surface the raw text to the client.
    console.error(
      `[results/gemini] malformed JSON (finishReason=${finishReason}):`,
      text.slice(0, 300),
    );
    throw new Error("Gemini returned malformed JSON.");
  }

  return { generated, model, source: "gemini" };
}

// ---------- Claude (Anthropic) ----------

async function generateWithClaude({
  system,
  userContent,
}: GenerateArgs): Promise<ProviderResult> {
  const key = claudeKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const model = (process.env.ANTHROPIC_MODEL ?? "").trim() || CLAUDE_DEFAULT_MODEL;

  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2200,
      temperature: 0.35,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API returned ${response.status}.`);
  }

  const data = await response.json();
  const text = data?.content?.find?.(
    (entry: { type?: string }) => entry.type === "text",
  )?.text;

  if (typeof text !== "string") throw new Error("Claude response had no text.");

  return {
    generated: extractJsonObject(text) as Partial<PersonalizedCompassReport>,
    model,
    source: "claude",
  };
}

// ---------- Selection ----------

interface SelectedProvider {
  source: ProviderSource;
  generate: (args: GenerateArgs) => Promise<ProviderResult>;
}

/**
 * Pick the provider to use. Honors RESULTS_PROVIDER (gemini|claude, default
 * gemini), then falls through to whichever is actually configured. Returns
 * null when neither has a key — the route then serves the deterministic
 * fallback report.
 */
export function pickProvider(): SelectedProvider | null {
  const pref = (process.env.RESULTS_PROVIDER ?? "gemini").trim().toLowerCase();

  const gemini = {
    source: "gemini" as const,
    configured: Boolean(geminiKey()),
    generate: generateWithGemini,
  };
  const claude = {
    source: "claude" as const,
    configured: Boolean(claudeKey()),
    generate: generateWithClaude,
  };

  const ordered = pref === "claude" ? [claude, gemini] : [gemini, claude];
  const chosen = ordered.find((provider) => provider.configured);
  return chosen
    ? { source: chosen.source, generate: chosen.generate }
    : null;
}
