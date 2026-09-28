import type {
  KaiConversation,
  KaiConversationGoal,
  KaiMessage,
  KaiThreadStore,
} from "@/lib/kai/chat-types";

export const kaiConversationStorageKey = "tareeq.kai.threads.v2";
export const legacyKaiConversationStorageKey = "tareeq.kai.conversation.v1";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * A versioned local thread cache. Supabase is authoritative when available;
 * this keeps the chat usable offline and migrates the original single thread.
 */
function isKaiMessage(value: unknown): value is KaiMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KaiMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "kai") &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.text === "string"
  );
}

function isKaiConversation(value: unknown): value is KaiConversation {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KaiConversation>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.goal === "string" &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(isKaiMessage) &&
    typeof candidate.summary === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.lastOpened === "string"
  );
}

function isThreadStore(value: unknown): value is KaiThreadStore {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KaiThreadStore>;
  return (
    candidate.version === 2 &&
    (candidate.activeThreadId === null ||
      typeof candidate.activeThreadId === "string") &&
    Array.isArray(candidate.threads) &&
    candidate.threads.every(isKaiConversation)
  );
}

function emptyStore(): KaiThreadStore {
  return { version: 2, activeThreadId: null, threads: [] };
}

function writeStore(store: KaiThreadStore): KaiThreadStore {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      kaiConversationStorageKey,
      JSON.stringify(store),
    );
  }
  return store;
}

function readStore(): KaiThreadStore {
  if (typeof window === "undefined") return emptyStore();
  const raw = window.localStorage.getItem(kaiConversationStorageKey);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isThreadStore(parsed) ? parsed : emptyStore();
    } catch {
      return emptyStore();
    }
  }

  const legacyRaw = window.localStorage.getItem(
    legacyKaiConversationStorageKey,
  );
  if (!legacyRaw) return emptyStore();
  try {
    const parsed: unknown = JSON.parse(legacyRaw);
    if (!isKaiConversation(parsed)) return emptyStore();
    const conversation = {
      ...parsed,
      id: UUID_PATTERN.test(parsed.id) ? parsed.id : crypto.randomUUID(),
    };
    const migrated: KaiThreadStore = {
      version: 2,
      activeThreadId: conversation.id,
      threads: [conversation],
    };
    writeStore(migrated);
    return migrated;
  } catch {
    return emptyStore();
  }
}

export function readConversations(): KaiConversation[] {
  return [...readStore().threads].sort((a, b) =>
    b.lastOpened.localeCompare(a.lastOpened),
  );
}

export function readActiveConversation(): KaiConversation | null {
  const store = readStore();
  return (
    store.threads.find((thread) => thread.id === store.activeThreadId) ?? null
  );
}

export function writeConversation(
  conversation: KaiConversation,
  activate = true,
): KaiConversation {
  const store = readStore();
  const existingIndex = store.threads.findIndex(
    (thread) => thread.id === conversation.id,
  );
  const threads = [...store.threads];
  if (existingIndex >= 0) threads[existingIndex] = conversation;
  else threads.push(conversation);
  writeStore({
    version: 2,
    activeThreadId: activate ? conversation.id : store.activeThreadId,
    threads,
  });
  return conversation;
}

export function replaceConversations(
  threads: KaiConversation[],
  activeThreadId: string | null,
): KaiThreadStore {
  const resolvedActive = threads.some((thread) => thread.id === activeThreadId)
    ? activeThreadId
    : (threads[0]?.id ?? null);
  return writeStore({ version: 2, activeThreadId: resolvedActive, threads });
}

export function setActiveConversation(id: string | null): void {
  const store = readStore();
  writeStore({
    ...store,
    activeThreadId:
      id && store.threads.some((thread) => thread.id === id) ? id : null,
  });
}

export function startConversation(
  goal: KaiConversationGoal,
  now = new Date().toISOString(),
): KaiConversation {
  return writeConversation({
    id: crypto.randomUUID(),
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

export function appendMessage(
  conversation: KaiConversation,
  message: KaiMessage,
): KaiConversation {
  return writeConversation({
    ...conversation,
    messages: [...conversation.messages, message],
    lastOpened: message.createdAt,
  });
}

export function replaceMessage(
  conversation: KaiConversation,
  message: KaiMessage,
): KaiConversation {
  const index = conversation.messages.findIndex(
    (candidate) => candidate.id === message.id,
  );
  if (index < 0) return appendMessage(conversation, message);
  const messages = [...conversation.messages];
  messages[index] = message;
  return writeConversation({
    ...conversation,
    messages,
    lastOpened: message.createdAt,
  });
}

export function updateSummary(
  conversation: KaiConversation,
  summary: string,
): KaiConversation {
  return writeConversation({ ...conversation, summary });
}

/** Only the last N messages ride along with each request — the summary
 * field carries anything older than that. */
export function recentMessages(
  conversation: KaiConversation,
  limit = 8,
): KaiMessage[] {
  return conversation.messages.slice(-limit);
}
