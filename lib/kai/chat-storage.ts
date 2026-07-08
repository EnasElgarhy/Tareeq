import type { KaiConversation, KaiConversationGoal, KaiMessage } from "@/lib/kai/chat-types";

export const kaiConversationStorageKey = "tareeq.kai.conversation.v1";

/**
 * A single ongoing conversation with Kai, stored locally. Deliberately
 * shaped to migrate to a Supabase table later without a rewrite: plain,
 * serializable fields only, an id, ISO timestamps — never a raw Gemini
 * payload, only normalized KaiMessage entries (see lib/kai/chat-types.ts).
 */
function isKaiConversation(value: unknown): value is KaiConversation {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KaiConversation>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.goal === "string" &&
    Array.isArray(candidate.messages) &&
    typeof candidate.summary === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.lastOpened === "string"
  );
}

export function readActiveConversation(): KaiConversation | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(kaiConversationStorageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isKaiConversation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeConversation(conversation: KaiConversation): KaiConversation {
  if (typeof window === "undefined") return conversation;
  window.localStorage.setItem(kaiConversationStorageKey, JSON.stringify(conversation));
  return conversation;
}

export function startConversation(goal: KaiConversationGoal, now = new Date().toISOString()): KaiConversation {
  return writeConversation({
    id: `kai-${now}-${Math.random().toString(36).slice(2, 8)}`,
    goal,
    messages: [],
    summary: "",
    createdAt: now,
    lastOpened: now,
  });
}

export function touchConversation(
  conversation: KaiConversation,
  now = new Date().toISOString(),
): KaiConversation {
  return writeConversation({ ...conversation, lastOpened: now });
}

export function appendMessage(conversation: KaiConversation, message: KaiMessage): KaiConversation {
  return writeConversation({
    ...conversation,
    messages: [...conversation.messages, message],
    lastOpened: message.createdAt,
  });
}

export function updateSummary(conversation: KaiConversation, summary: string): KaiConversation {
  return writeConversation({ ...conversation, summary });
}

/** Only the last N messages ride along with each request — the summary
 * field carries anything older than that. */
export function recentMessages(conversation: KaiConversation, limit = 8): KaiMessage[] {
  return conversation.messages.slice(-limit);
}
