import type { KaiConversation, KaiMessage } from "@/lib/kai/chat-types";

export function updateMessage(
  conversation: KaiConversation,
  messageId: string,
  update: Partial<KaiMessage>,
): KaiConversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.id === messageId ? { ...message, ...update } : message,
    ),
  };
}

/** Server-completed messages win; unsynced local pending/failed messages remain visible. */
export function mergeConversation(
  local: KaiConversation | undefined,
  remote: KaiConversation,
): KaiConversation {
  if (!local) return remote;
  const remoteById = new Map(
    remote.messages.map((message) => [message.id, message]),
  );
  const messages = local.messages.map(
    (message) => remoteById.get(message.id) ?? message,
  );
  const seen = new Set(messages.map((message) => message.id));
  for (const message of remote.messages) {
    if (!seen.has(message.id)) messages.push(message);
  }
  messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    ...local,
    ...remote,
    messages,
    summary: remote.summary || local.summary,
    lastOpened:
      local.lastOpened > remote.lastOpened
        ? local.lastOpened
        : remote.lastOpened,
  };
}

export function mergeConversations(
  local: KaiConversation[],
  remote: KaiConversation[],
): KaiConversation[] {
  const localById = new Map(local.map((thread) => [thread.id, thread]));
  const merged = remote.map((thread) =>
    mergeConversation(localById.get(thread.id), thread),
  );
  const remoteIds = new Set(remote.map((thread) => thread.id));
  merged.push(...local.filter((thread) => !remoteIds.has(thread.id)));
  return merged.sort((a, b) => b.lastOpened.localeCompare(a.lastOpened));
}
