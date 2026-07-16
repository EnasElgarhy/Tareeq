import {
  buildContextPrompt,
  buildFactualSystemPrompt,
  buildOpeningInstruction,
  buildRecoverySchema,
  buildRequiredBlocksSchema,
  buildResponseSchema,
  buildSystemPrompt,
} from "@/lib/kai/chat-prompt";
import {
  ARTIFACT_SIMPLIFY_HINT,
  GENERIC_RECOVERY_HINT,
  needsArtifact,
} from "@/lib/kai/artifact/artifact-kinds";
import {
  type BlockType,
  enforceRequiredBlocks,
} from "@/lib/kai/chat-enforcement";
import {
  completeKaiRun,
  failKaiRun,
  prepareKaiRun,
} from "@/lib/kai/chat-repository";
import {
  fallbackMessage,
  normalizeBlocks,
  normalizeIntent,
  normalizeQuickReplies,
  validateChatRequest,
} from "@/lib/kai/chat-server";
import type { KaiChatResult } from "@/lib/kai/chat-stream";
import type { KaiChatContext } from "@/lib/kai/chat-context";
import type { KaiMessage, KaiSourceListBlock } from "@/lib/kai/chat-types";
import type { KaiMessageIntent } from "@/lib/kai/intent";
import { detectIntent, shouldGroundIntent } from "@/lib/kai/intent";
import {
  type GeminiGroundingSource,
  normalizeAbortTimeoutMs,
  readGeminiJson,
  readGeminiSse,
} from "@/lib/kai/gemini-stream";
import { buildMemoryCandidates } from "@/lib/kai/memory/memory-builder";
import { detectDegenerateOutput } from "@/lib/kai/repetition";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";
const DEFAULT_FACT_MODEL = "gemini-2.5-flash";

type ParsedGeminiResponse = {
  text?: unknown;
  intent?: unknown;
  quickReplies?: unknown;
  blocks?: unknown;
  summary?: unknown;
  memoryUpdates?: unknown;
  personSummary?: unknown;
};

type GeminiFailureReason =
  | "network_error"
  | "gemini_error"
  | "missing_grounding"
  | "unparseable_response"
  | "provider_repetition_loop";

type GeminiAttempt =
  | {
      ok: true;
      parsed: ParsedGeminiResponse;
      sources: GeminiGroundingSource[];
    }
  | { ok: false; reason: GeminiFailureReason; retryable: boolean };

function buildGroundingBlock(
  sources: GeminiGroundingSource[],
  locale: string,
): KaiSourceListBlock | undefined {
  if (sources.length === 0) return undefined;
  return {
    type: "source_list",
    title: locale === "ar" ? "المصادر" : "Sources",
    sources: sources.slice(0, 4),
  };
}

function factualQuickReplies(locale: string): string[] {
  return locale === "ar"
    ? ["قارن لي الخيارات", "ما الذي يجب أن أتحقق منه؟"]
    : ["Compare the options", "What should I verify next?"];
}

/**
 * One full request/parse attempt. The repetition guard remains because
 * older deployments using GEMINI_MODEL=gemini-2.5-flash can loop under
 * this schema — repeating a token or phrase until it hits
 * MAX_TOKENS instead of closing valid JSON — independent of schema
 * size, thinking budget, or temperature (all tried; none eliminated
 * it). That's degenerate sampling, not a real long answer, so the caller
 * switches to a bounded text-only recovery instead of repeating the same
 * constrained request.
 */
async function callGeminiOnce(
  apiKey: string,
  model: string,
  context: KaiChatContext,
  prompt: string,
  intentHint: KaiMessageIntent | undefined,
  // Phase 2C: the simplified single-block recovery schema overrides the
  // normal per-intent schema when a repetition loop needs recovering.
  schemaOverride?: object,
  onText: (text: string) => void = () => undefined,
  timeoutMs = 15_000,
): Promise<GeminiAttempt> {
  let geminiResponse: Response;
  const grounded = shouldGroundIntent(intentHint);
  try {
    geminiResponse = await fetch(
      `${GEMINI_ENDPOINT_BASE}/${model}:${grounded ? "generateContent" : "streamGenerateContent"}?${grounded ? "" : "alt=sse&"}key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Bound the whole perceived wait. Streaming exposes useful text early,
        // while a 15-second ceiling prevents stacked 25-second attempts.
        signal: AbortSignal.timeout(normalizeAbortTimeoutMs(timeoutMs)),
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: grounded
                  ? buildFactualSystemPrompt(context.user.locale)
                  : buildSystemPrompt(context.user.locale),
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(grounded ? { tools: [{ google_search: {} }] } : {}),
          generationConfig: grounded
            ? {
                temperature: 0.1,
                maxOutputTokens: 1024,
              }
            : {
                temperature: 0.6,
                maxOutputTokens: schemaOverride
                  ? 1024
                  : intentHint && needsArtifact(intentHint)
                    ? 4096
                    : 2560,
                thinkingConfig: { thinkingBudget: 0 },
                responseMimeType: "application/json",
                // Narrowed to only the block types relevant to this turn's
                // detected intent (plus cheap system-continuity types).
                responseSchema:
                  schemaOverride ?? buildResponseSchema(intentHint),
              },
        }),
      },
    );
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      reason: "network_error",
      retryable: !timedOut || grounded,
    };
  }

  if (!geminiResponse.ok) {
    const errorBody = await geminiResponse.text();
    console.error(
      "[kai/chat] Gemini request failed",
      geminiResponse.status,
      errorBody,
    );
    return {
      ok: false,
      reason: "gemini_error",
      retryable: geminiResponse.status === 429 || geminiResponse.status >= 500,
    };
  }

  let streamed;
  try {
    streamed = grounded
      ? await readGeminiJson(geminiResponse, () => undefined)
      : await readGeminiSse(geminiResponse, onText);
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      reason: "network_error",
      retryable: !timedOut || grounded,
    };
  }
  const raw = streamed.raw;
  const finishReason = streamed.finishReason;

  // Classify degenerate output (repetition loop / MAX_TOKENS saturation)
  // BEFORE parsing. A truncated loop yields invalid JSON, and an identical
  // retry re-hits the same trajectory (Phase 1 audit), so surface it as its
  // own reason instead of a generic parse failure the caller would retry.
  const degenerate = detectDegenerateOutput(raw, finishReason);
  if (degenerate.degenerate) {
    console.warn(
      "[kai/chat] degenerate output:",
      degenerate.reason,
      "finishReason:",
      finishReason,
      "rawLen:",
      raw?.length ?? 0,
    );
    return { ok: false, reason: "provider_repetition_loop", retryable: false };
  }

  if (grounded) {
    const text = raw.trim();
    if (!text) {
      return { ok: false, reason: "unparseable_response", retryable: false };
    }
    if (!streamed.sources?.length) {
      return { ok: false, reason: "missing_grounding", retryable: true };
    }
    onText(text);
    return {
      ok: true,
      parsed: {
        text,
        intent: "fact_lookup",
        quickReplies: factualQuickReplies(context.user.locale),
      },
      sources: streamed.sources,
    };
  }

  let parsed: ParsedGeminiResponse;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error(
      "[kai/chat] JSON.parse failed",
      "finishReason:",
      finishReason,
      "rawLength:",
      raw?.length,
      "rawTail:",
      raw?.slice(-200),
      err,
    );
    return { ok: false, reason: "unparseable_response", retryable: true };
  }

  const text =
    typeof parsed.text === "string" && parsed.text.trim()
      ? parsed.text.trim()
      : null;
  if (!text) {
    return { ok: false, reason: "unparseable_response", retryable: true };
  }

  return { ok: true, parsed, sources: streamed.sources ?? [] };
}

export async function POST(request: Request) {
  const requestStartedAt = performance.now();
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return Response.json({ error: "Not authenticated." }, { status: 401 });

  let repositoryAvailable = false;
  try {
    const prepared = await prepareKaiRun(supabase, user.id, validated.value);
    repositoryAvailable = prepared.available;
    if (prepared.cached) return Response.json(prepared.cached);
  } catch (error) {
    console.error("[kai/chat] Failed to prepare durable request", error);
    return Response.json(
      { error: "Kai could not save this message yet." },
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();
  let clientConnected = true;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: object) => {
        if (!clientConnected) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          clientConnected = false;
        }
      };
      const close = () => {
        if (!clientConnected) return;
        try {
          controller.close();
        } catch {
          clientConnected = false;
        }
      };
      let firstTextMs: number | undefined;
      const emitText = (text: string) => {
        if (firstTextMs === undefined)
          firstTextMs = Math.round(performance.now() - requestStartedAt);
        send({ type: "text", text });
      };

      void (async () => {
        const { kind, context, message } = validated.value;
        const apiKey = process.env.GEMINI_API_KEY;
        const coachingModel = process.env.GEMINI_MODEL || DEFAULT_MODEL;

        if (!apiKey) {
          const result: KaiChatResult = {
            message: fallbackMessage(context.user.locale),
            source: "fallback",
            timings: {
              modelMs: 0,
              totalMs: Math.round(performance.now() - requestStartedAt),
              attempts: 0,
            },
          };
          if (repositoryAvailable) {
            try {
              await completeKaiRun(supabase, validated.value, result);
            } catch (error) {
              console.error(
                "[kai/chat] Failed to persist fallback reply",
                error,
              );
            }
          }
          send({ type: "complete", data: result });
          close();
          return;
        }

        const baseInstruction =
          kind === "open"
            ? buildOpeningInstruction(
                context.memories.items.length > 0 ||
                  Boolean(context.memories.personSummary),
              )
            : `The learner just said: "${message}"\n\nWrite Kai's reply now, per the output rules.`;

        // A fast local classification (no extra Gemini call) that selects the
        // response contract. The schema locks Gemini to this value and the
        // server records it as the final intent.
        const intentHint =
          kind === "reply" && message ? detectIntent(message) : undefined;
        const model = shouldGroundIntent(intentHint)
          ? process.env.GEMINI_FACT_MODEL || DEFAULT_FACT_MODEL
          : coachingModel;
        const instruction = shouldGroundIntent(intentHint)
          ? `${baseInstruction}\n\nYou MUST use Google Search for this factual turn and ground the answer in the search results before writing the response.`
          : baseInstruction;

        const prompt = shouldGroundIntent(intentHint)
          ? `Learner's factual question:\n${message}\n\nAnswer it now using Google Search and the output contract.`
          : `${buildContextPrompt(context, intentHint)}\n\n${instruction}`;

        let attemptCount = 1;
        const modelStartedAt = performance.now();
        const remainingTimeout = () =>
          Math.max(1_000, 15_000 - (performance.now() - requestStartedAt));
        let attempt = await callGeminiOnce(
          apiKey,
          model,
          context,
          prompt,
          intentHint,
          undefined,
          emitText,
          shouldGroundIntent(intentHint)
            ? Math.min(7_000, remainingTimeout())
            : remainingTimeout(),
        );
        // Retry once ONLY for transient failures. A repetition-loop / MAX_TOKENS
        // failure recurs on an identical retry (measured, Phase 1 audit) and just
        // doubles latency toward the client timeout, so an IDENTICAL retry is
        // pointless — handle that failure with the simplified-schema recovery below.
        while (
          !attempt.ok &&
          attempt.retryable &&
          attemptCount < 3 &&
          performance.now() - requestStartedAt < 8_000
        ) {
          attemptCount += 1;
          attempt = await callGeminiOnce(
            apiKey,
            model,
            context,
            prompt,
            intentHint,
            undefined,
            emitText,
            remainingTimeout(),
          );
        }

        // Phase 2C recovery: any repetition loop (finishReason MAX_TOKENS under
        // constrained JSON decoding) gets ONE text-only recovery attempt. The
        // recovery schema drops the `blocks` array entirely (nothing structured to
        // loop on), so the model writes a short plain-text answer that completes
        // reliably — a real answer instead of the generic "I'm having trouble"
        // fallback. Heavy artifact intents get a kind-specific hint (put the plan/
        // script/comparison inline as text); everything else gets a generic one.
        // The loop is stochastic and hits light intents too (measured), so this is
        // NOT gated on needsArtifact — every repetition loop is worth one recovery.
        let recoveredViaSimplified = false;
        if (!attempt.ok && attempt.reason === "provider_repetition_loop") {
          const artifact = intentHint ? needsArtifact(intentHint) : null;
          const hint = artifact
            ? ARTIFACT_SIMPLIFY_HINT[artifact.kind]
            : GENERIC_RECOVERY_HINT;
          attemptCount += 1;
          const recovered = await callGeminiOnce(
            apiKey,
            model,
            context,
            `${prompt}\n\n${hint}`,
            intentHint,
            buildRecoverySchema(intentHint),
            emitText,
            remainingTimeout(),
          );
          if (recovered.ok) {
            console.warn(
              "[kai/chat] recovered via text-only schema",
              artifact ? artifact.kind : "generic",
            );
            attempt = recovered;
            recoveredViaSimplified = true;
          }
        }
        if (!attempt.ok) {
          const result: KaiChatResult = {
            message: fallbackMessage(context.user.locale),
            source: "fallback",
            timings: {
              firstTextMs,
              modelMs: Math.round(performance.now() - modelStartedAt),
              totalMs: Math.round(performance.now() - requestStartedAt),
              attempts: attemptCount,
            },
          };
          if (repositoryAvailable) {
            try {
              await completeKaiRun(supabase, validated.value, result);
            } catch (error) {
              console.error(
                "[kai/chat] Failed to persist fallback reply",
                error,
              );
            }
          }
          send({ type: "complete", data: result });
          close();
          return;
        }

        const resolvedIntent =
          intentHint ??
          normalizeIntent(attempt.parsed.intent, "general_question");

        // If the response is missing a block its intent requires (an
        // action_plan answered as day-by-day prose, a family_conversation
        // with no script), repair deterministically, then — only if repair
        // can't safely extract it — issue one stricter retry naming exactly
        // what's missing, then fall back to honest deterministic content.
        // Keeps whichever attempt's quickReplies/summary/memoryUpdates
        // actually produced the blocks we ended up using.
        //
        // SKIP enforcement when we recovered via the simplified schema: the
        // recovery deliberately downgraded the artifact (e.g. action_plan →
        // flat bullet_list) to escape the repetition loop, so re-demanding the
        // heavy required block here would issue a full-schema stricter retry
        // that just re-enters the same loop. The simplified block IS the answer.
        const enforcement = recoveredViaSimplified
          ? {
              text: (attempt.parsed.text as string).trim(),
              blocks: normalizeBlocks(attempt.parsed.blocks),
              retryRaw: null as ParsedGeminiResponse | null,
            }
          : await enforceRequiredBlocks<ParsedGeminiResponse>(
              {
                text: (attempt.parsed.text as string).trim(),
                blocks: normalizeBlocks(attempt.parsed.blocks),
                intent: resolvedIntent,
              },
              context,
              async (stillMissing: BlockType[]) => {
                if (performance.now() - requestStartedAt >= 13_000) return null;
                attemptCount += 1;
                const stricterInstruction = `${instruction}\n\nYour previous reply for this turn was missing a required ${stillMissing.join(" and ")} block — it answered in plain prose instead. Write it again, and this time you MUST include ${stillMissing.length === 1 ? "that block" : "those blocks"}. Do not explain the plan/answer in "text" — put the substance in the block(s).`;
                const stricterPrompt = `${buildContextPrompt(context, intentHint)}\n\n${stricterInstruction}`;
                const retryAttempt = await callGeminiOnce(
                  apiKey,
                  model,
                  context,
                  stricterPrompt,
                  intentHint,
                  buildRequiredBlocksSchema(resolvedIntent, stillMissing),
                  emitText,
                  remainingTimeout(),
                );
                if (!retryAttempt.ok) return null;

                return {
                  text: (retryAttempt.parsed.text as string).trim(),
                  blocks: normalizeBlocks(retryAttempt.parsed.blocks),
                  intent: resolvedIntent,
                  raw: retryAttempt.parsed,
                };
              },
            );

        const finalParsed = enforcement.retryRaw ?? attempt.parsed;
        const finalIntent = resolvedIntent;
        const groundingBlock = shouldGroundIntent(finalIntent)
          ? buildGroundingBlock(attempt.sources, context.user.locale)
          : undefined;
        const finalBlocks = groundingBlock
          ? [...(enforcement.blocks ?? []), groundingBlock]
          : enforcement.blocks;

        const quickReplies = normalizeQuickReplies(
          finalParsed.quickReplies,
          finalIntent,
          context.user.locale,
        );

        const kaiMessage: KaiMessage = {
          id: `kai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: "kai",
          createdAt: new Date().toISOString(),
          text: enforcement.text,
          blocks: finalBlocks,
          quickReplies:
            quickReplies && quickReplies.length > 0 ? quickReplies : undefined,
          intent: finalIntent,
        };

        const summary =
          typeof finalParsed.summary === "string"
            ? finalParsed.summary.trim()
            : context.conversation.summary;
        const memoryUpdates = buildMemoryCandidates(finalParsed.memoryUpdates);
        const personSummary =
          typeof finalParsed.personSummary === "string"
            ? finalParsed.personSummary.trim()
            : undefined;

        const result: KaiChatResult = {
          message: kaiMessage,
          summary,
          source: "gemini",
          memoryUpdates: memoryUpdates.length > 0 ? memoryUpdates : undefined,
          personSummary: personSummary || undefined,
          timings: {
            firstTextMs,
            modelMs: Math.round(performance.now() - modelStartedAt),
            totalMs: Math.round(performance.now() - requestStartedAt),
            attempts: attemptCount,
            ...(recoveredViaSimplified ? { recoveredViaSimplified: true } : {}),
          },
        };
        if (repositoryAvailable) {
          try {
            await completeKaiRun(supabase, validated.value, result);
          } catch (error) {
            console.error(
              "[kai/chat] Failed to persist completed reply",
              error,
            );
          }
        }
        console.info("[kai/chat] completed", {
          totalMs: result.timings?.totalMs,
          modelMs: result.timings?.modelMs,
          attempts: attemptCount,
          source: result.source,
          intent: kaiMessage.intent,
          groundedSources: groundingBlock?.sources.length ?? 0,
        });
        send({ type: "complete", data: result });
        close();
      })().catch(async (error) => {
        console.error("[kai/chat] Unhandled generation failure", error);
        if (repositoryAvailable) {
          try {
            await failKaiRun(supabase, validated.value, "generation_failed");
          } catch (persistenceError) {
            console.error(
              "[kai/chat] Failed to persist request failure",
              persistenceError,
            );
          }
        }
        send({
          type: "error",
          error: "Kai could not finish that reply.",
          retryable: true,
        });
        close();
      });
    },
    cancel() {
      // Generation intentionally continues so the durable reply can be
      // recovered if the browser reloads or suspends the page mid-turn.
      clientConnected = false;
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
