import { assertNoExcludedFields } from "@/lib/kai/context";
import type { KaiConversationGoal, KaiChatRole, KaiMessage } from "@/lib/kai/chat-types";
import type { KaiMemoryCategory, KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import type { KaiContext } from "@/lib/kai/types";

export interface KaiChatContext extends KaiContext {
  conversation: {
    goal: KaiConversationGoal;
    /** A rolling summary of anything older than `recentMessages` — kept
     * short so the request stays bounded as a conversation grows. */
    summary: string;
    recentMessages: Array<{ role: KaiChatRole; text: string }>;
  };
  /** What Kai remembers about the PERSON, across every past
   * conversation — never the full transcript. See lib/kai/memory/. */
  memories: {
    items: Array<{ category: KaiMemoryCategory; value: string }>;
    personSummary: string;
  };
}

/**
 * Extends Phase 1's `buildKaiContext()` with conversation state AND
 * long-term memory for a single Gemini request — same
 * deterministic-result-as-truth base, same PII guard, plus only what's
 * needed to keep the reply on-topic and personalized: the conversation's
 * goal, its rolling summary, its recent turns (text only — no ids, no
 * blocks, no quick replies), and structured memory (ids stripped —
 * Gemini never needs them, only category + value).
 */
export function buildKaiChatContext(input: {
  base: KaiContext;
  goal: KaiConversationGoal;
  summary: string;
  messages: KaiMessage[];
  memory: KaiMemoryProfile;
}): KaiChatContext {
  const context: KaiChatContext = {
    ...input.base,
    conversation: {
      goal: input.goal,
      summary: input.summary,
      recentMessages: input.messages.map((message) => ({
        role: message.role,
        text: message.text,
      })),
    },
    memories: {
      items: input.memory.items.map((item) => ({ category: item.category, value: item.value })),
      personSummary: input.memory.personSummary,
    },
  };

  assertNoExcludedFields(context);
  return context;
}
