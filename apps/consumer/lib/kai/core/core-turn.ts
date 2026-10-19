import { coreBank, coreWording } from "@/lib/core-v2/content/core-content";
import type { KaiChatContext } from "@/lib/kai/chat-context";
import { fallbackMessage, normalizeQuickReplies } from "@/lib/kai/chat-server";
import type { KaiMessage } from "@/lib/kai/chat-types";
import { GENERIC_RECOVERY_HINT } from "@/lib/kai/artifact/artifact-kinds";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import { buildCoreKaiContext, type CoreKaiContext } from "./core-context";
import { normalizeCoreEvents, type CoreKaiEvent } from "./core-events";
import {
  buildCoreRecoverySchema,
  buildCoreResponseSchema,
  buildCoreSystemPrompt,
  buildCoreTurnPrompt,
} from "./core-prompt";
import type { CoreKaiRequest } from "./core-request";

/**
 * One Kai turn for a CORE student. Compared with the legacy turn there is no
 * intent contract, no required blocks, no Google Search and no long-term
 * memory: the client's prompt rules out the cards those produced (links,
 * family scripts, single-career answers, salary facts) and limits what Kai
 * knows about the student to the payload.
 */

/** flags_live (spec §5): off until the founder calibrates; CompassScreen uses the same. */
const IS_FLAGS_LIVE = false;
const MAX_RETRIES = 2;

export type CoreModelAttempt =
  | { ok: true; parsed: Record<string, unknown> }
  | { ok: false; reason: string; retryable: boolean };

export type CoreModelCall = (request: {
  systemPrompt: string;
  prompt: string;
  responseSchema: object;
}) => Promise<CoreModelAttempt>;

export interface CoreTurnResult {
  message: KaiMessage;
  summary?: string;
  events: CoreKaiEvent[];
  source: "gemini" | "fallback";
  attempts: number;
  recoveredViaSimplified: boolean;
}

export function coreKaiPayload(core: CoreKaiRequest, locale: string): CoreKaiContext {
  const language: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return buildCoreKaiContext({
    locale: language,
    result: core.result,
    bank: coreBank(language),
    wording: (blockId) => coreWording(language, blockId),
    profile: core.profile,
    entryPromptId: core.entryPromptId,
    previousResult: core.previousResult,
    isAttemptFlagged: core.isFlagged && IS_FLAGS_LIVE,
    priorDisagreements: core.priorDisagreements,
  });
}

function parsedText(parsed: Record<string, unknown>): string | null {
  return typeof parsed.text === "string" && parsed.text.trim() ? parsed.text.trim() : null;
}

export async function runCoreKaiTurn(input: {
  core: CoreKaiRequest;
  context: KaiChatContext;
  kind: "open" | "reply";
  message?: string;
  callModel: CoreModelCall;
  /** Stop retrying once the request has used most of its time budget. */
  canRetry?: () => boolean;
}): Promise<CoreTurnResult> {
  const { context } = input;
  const locale = context.user.locale;
  const systemPrompt = buildCoreSystemPrompt();
  const prompt = buildCoreTurnPrompt({
    payload: coreKaiPayload(input.core, locale),
    conversationSummary: context.conversation.summary,
    recentMessages: context.conversation.recentMessages,
    kind: input.kind,
    message: input.message,
  });
  const canRetry = input.canRetry ?? (() => true);

  let attempts = 1;
  let attempt = await input.callModel({
    systemPrompt,
    prompt,
    responseSchema: buildCoreResponseSchema(),
  });
  while (!attempt.ok && attempt.retryable && attempts <= MAX_RETRIES && canRetry()) {
    attempts += 1;
    attempt = await input.callModel({ systemPrompt, prompt, responseSchema: buildCoreResponseSchema() });
  }

  let recoveredViaSimplified = false;
  if (!attempt.ok && attempt.reason === "provider_repetition_loop") {
    attempts += 1;
    const recovered = await input.callModel({
      systemPrompt,
      prompt: `${prompt}\n\n${GENERIC_RECOVERY_HINT}`,
      responseSchema: buildCoreRecoverySchema(),
    });
    if (recovered.ok && parsedText(recovered.parsed)) {
      attempt = {
        ok: true,
        parsed: {
          text: recovered.parsed.text,
          events: recovered.parsed.safeguarding_alert === true ? [{ tool: "safeguarding_alert" }] : [],
        },
      };
      recoveredViaSimplified = true;
    }
  }

  const text = attempt.ok ? parsedText(attempt.parsed) : null;
  if (!attempt.ok || !text) {
    return {
      message: fallbackMessage(locale),
      events: [],
      source: "fallback",
      attempts,
      recoveredViaSimplified: false,
    };
  }

  // general_question keeps normalizeQuickReplies from swapping in canned replies.
  const quickReplies = normalizeQuickReplies(attempt.parsed.quickReplies, "general_question", locale)?.slice(0, 3);
  const message: KaiMessage = {
    id: `kai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "kai",
    createdAt: new Date().toISOString(),
    text,
    quickReplies: quickReplies && quickReplies.length > 0 ? quickReplies : undefined,
  };
  return {
    message,
    summary:
      typeof attempt.parsed.summary === "string" && attempt.parsed.summary.trim()
        ? attempt.parsed.summary.trim()
        : context.conversation.summary,
    events: normalizeCoreEvents(attempt.parsed.events),
    source: "gemini",
    attempts,
    recoveredViaSimplified,
  };
}
