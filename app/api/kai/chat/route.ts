import {
  buildContextPrompt,
  buildOpeningInstruction,
  buildResponseSchema,
  buildSystemPrompt,
} from "@/lib/kai/chat-prompt";
import { type BlockType, enforceRequiredBlocks } from "@/lib/kai/chat-enforcement";
import { fallbackMessage, normalizeBlocks, normalizeIntent, validateChatRequest } from "@/lib/kai/chat-server";
import type { KaiChatContext } from "@/lib/kai/chat-context";
import type { KaiMessage } from "@/lib/kai/chat-types";
import type { KaiMessageIntent } from "@/lib/kai/intent";
import { detectIntent } from "@/lib/kai/intent";
import { buildMemoryCandidates } from "@/lib/kai/memory/memory-builder";

export const runtime = "nodejs";

const GEMINI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

type ParsedGeminiResponse = {
  text?: unknown;
  intent?: unknown;
  quickReplies?: unknown;
  blocks?: unknown;
  summary?: unknown;
  memoryUpdates?: unknown;
  personSummary?: unknown;
};

type GeminiAttempt =
  | { ok: true; parsed: ParsedGeminiResponse }
  | { ok: false; reason: "network_error" | "gemini_error" | "unparseable_response" };

/**
 * One full request/parse attempt. Occasionally (observed reliably on
 * "build me a 7-day plan") Gemini 2.5 Flash falls into a repetition
 * loop under this schema — repeating a token or phrase until it hits
 * MAX_TOKENS instead of closing valid JSON — independent of schema
 * size, thinking budget, or temperature (all tried; none eliminated
 * it). That's degenerate sampling, not a real long answer, and a fresh
 * attempt reliably avoids the same bad trajectory — the standard
 * mitigation for this failure class, applied as a single retry in the
 * caller rather than looping here indefinitely.
 */
async function callGeminiOnce(
  apiKey: string,
  model: string,
  context: KaiChatContext,
  prompt: string,
  intentHint: KaiMessageIntent | undefined,
): Promise<GeminiAttempt> {
  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(`${GEMINI_ENDPOINT_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Fail fast to the fallback rather than leaving the user staring at
      // a spinner forever — the coaching-framework prompt deliberately
      // asks for 2-4 blocks on a substantive question, and that richer
      // JSON can genuinely take 20-30s (observed on a real action_plan
      // success). 12s was tuned for the old shorter-answer system and
      // clips good responses before they finish; 25s gives real
      // multi-block answers room while still failing this attempt
      // (triggering the retry in the caller) well before the request
      // itself would feel abandoned.
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(context.user.locale) }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          // 2.5 Flash's "thinking" tokens count against maxOutputTokens —
          // at 1024 total the model burned its whole budget thinking (or,
          // worse, a repetition loop) and got cut off before writing any
          // of the actual JSON reply. Disabling thinking removes most of
          // that failure mode for this quick-turnaround chat reply.
          // NOTE: adding maxItems to the array fields in chat-prompt.ts's
          // schema to bound worst-case length made every request fail
          // outright — "schema produces a constraint that has too many
          // states for serving" — so that avenue is out. Bumped from
          // 4096 → 6144 to give the richer coaching-framework blocks
          // (2-4 per substantive turn) real headroom.
          maxOutputTokens: 6144,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          // Narrowed to only the block types relevant to this turn's
          // detected intent (plus cheap system-continuity types) — the
          // full 20-type schema with every type's fields flattened into
          // one object measurably raised the odds of the repetition-loop
          // failure above, on top of costing more prompt tokens on every
          // single request regardless of what this turn actually needed.
          responseSchema: buildResponseSchema(intentHint),
        },
      }),
    });
  } catch {
    return { ok: false, reason: "network_error" };
  }

  if (!geminiResponse.ok) {
    const errorBody = await geminiResponse.text();
    console.error("[kai/chat] Gemini request failed", geminiResponse.status, errorBody);
    return { ok: false, reason: "gemini_error" };
  }

  const payload = (await geminiResponse.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  };
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  let parsed: ParsedGeminiResponse;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error(
      "[kai/chat] JSON.parse failed",
      "finishReason:", payload.candidates?.[0]?.finishReason,
      "rawLength:", raw?.length,
      "rawTail:", raw?.slice(-200),
      err,
    );
    return { ok: false, reason: "unparseable_response" };
  }

  const text = typeof parsed.text === "string" && parsed.text.trim() ? parsed.text.trim() : null;
  if (!text) {
    return { ok: false, reason: "unparseable_response" };
  }

  return { ok: true, parsed };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateChatRequest(body);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const { kind, context, message } = validated.value;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return Response.json({
      message: fallbackMessage(context.user.locale),
      source: "fallback",
      reason: "missing_api_key",
    });
  }

  const instruction =
    kind === "open"
      ? buildOpeningInstruction(context.memories.items.length > 0 || Boolean(context.memories.personSummary))
      : `The learner just said: "${message}"\n\nWrite Kai's reply now, per the output rules.`;

  // A fast local guess (no extra Gemini call) that steers the prompt
  // toward the right block set — Gemini's own self-reported "intent" in
  // the response is what actually gets recorded (see normalizeIntent).
  const intentHint = kind === "reply" && message ? detectIntent(message) : undefined;

  const prompt = `${buildContextPrompt(context, intentHint)}\n\n${instruction}`;

  let attempt = await callGeminiOnce(apiKey, model, context, prompt, intentHint);
  if (!attempt.ok) {
    attempt = await callGeminiOnce(apiKey, model, context, prompt, intentHint);
  }
  if (!attempt.ok) {
    return Response.json({
      message: fallbackMessage(context.user.locale),
      source: "fallback",
      reason: attempt.reason,
    });
  }

  const resolvedIntent = normalizeIntent(attempt.parsed.intent, intentHint);

  // If the response is missing a block its intent requires (an
  // action_plan answered as day-by-day prose, a family_conversation
  // with no script), repair deterministically, then — only if repair
  // can't safely extract it — issue one stricter retry naming exactly
  // what's missing, then fall back to honest deterministic content.
  // Keeps whichever attempt's quickReplies/summary/memoryUpdates
  // actually produced the blocks we ended up using.
  const enforcement = await enforceRequiredBlocks<ParsedGeminiResponse>(
    { text: (attempt.parsed.text as string).trim(), blocks: normalizeBlocks(attempt.parsed.blocks), intent: resolvedIntent },
    context,
    async (stillMissing: BlockType[]) => {
      const stricterInstruction = `${instruction}\n\nYour previous reply for this turn was missing a required ${stillMissing.join(" and ")} block — it answered in plain prose instead. Write it again, and this time you MUST include ${stillMissing.length === 1 ? "that block" : "those blocks"}. Do not explain the plan/answer in "text" — put the substance in the block(s).`;
      const stricterPrompt = `${buildContextPrompt(context, intentHint)}\n\n${stricterInstruction}`;
      const retryAttempt = await callGeminiOnce(apiKey, model, context, stricterPrompt, intentHint);
      if (!retryAttempt.ok) return null;

      return {
        text: (retryAttempt.parsed.text as string).trim(),
        blocks: normalizeBlocks(retryAttempt.parsed.blocks),
        intent: normalizeIntent(retryAttempt.parsed.intent, resolvedIntent),
        raw: retryAttempt.parsed,
      };
    },
  );

  const finalParsed = enforcement.retryRaw ?? attempt.parsed;
  const finalIntent = enforcement.retryRaw ? normalizeIntent(enforcement.retryRaw.intent, resolvedIntent) : resolvedIntent;

  const quickReplies = Array.isArray(finalParsed.quickReplies)
    ? finalParsed.quickReplies.filter((r): r is string => typeof r === "string").slice(0, 4)
    : undefined;

  const kaiMessage: KaiMessage = {
    id: `kai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "kai",
    createdAt: new Date().toISOString(),
    text: enforcement.text,
    blocks: enforcement.blocks,
    quickReplies: quickReplies && quickReplies.length > 0 ? quickReplies : undefined,
    intent: finalIntent,
  };

  const summary =
    typeof finalParsed.summary === "string" ? finalParsed.summary.trim() : context.conversation.summary;
  const memoryUpdates = buildMemoryCandidates(finalParsed.memoryUpdates);
  const personSummary = typeof finalParsed.personSummary === "string" ? finalParsed.personSummary.trim() : undefined;

  return Response.json({
    message: kaiMessage,
    summary,
    source: "gemini",
    memoryUpdates: memoryUpdates.length > 0 ? memoryUpdates : undefined,
    personSummary: personSummary || undefined,
  });
}
