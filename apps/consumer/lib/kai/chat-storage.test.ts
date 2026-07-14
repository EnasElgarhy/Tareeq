import { beforeEach, describe, expect, it } from "vitest";
import {
  appendMessage,
  kaiConversationStorageKey,
  readActiveConversation,
  recentMessages,
  startConversation,
  touchConversation,
  updateSummary,
} from "@/lib/kai/chat-storage";
import type { KaiMessage } from "@/lib/kai/chat-types";

function makeMessage(overrides: Partial<KaiMessage> = {}): KaiMessage {
  return {
    id: "msg-1",
    role: "kai",
    createdAt: "2026-07-01T10:00:00.000Z",
    text: "Hi there.",
    ...overrides,
  };
}

describe("chat-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no conversation has been started", () => {
    expect(readActiveConversation()).toBeNull();
  });

  it("starts a conversation with the given goal and persists it", () => {
    const conversation = startConversation("find_majors", "2026-07-01T09:00:00.000Z");
    expect(conversation.goal).toBe("find_majors");
    expect(conversation.messages).toEqual([]);
    expect(conversation.summary).toBe("");
    expect(readActiveConversation()).toEqual(conversation);
  });

  it("ignores malformed stored JSON", () => {
    window.localStorage.setItem(kaiConversationStorageKey, "{not json");
    expect(readActiveConversation()).toBeNull();
  });

  it("ignores a stored value missing required fields", () => {
    window.localStorage.setItem(kaiConversationStorageKey, JSON.stringify({ id: "x" }));
    expect(readActiveConversation()).toBeNull();
  });

  it("appendMessage adds to the message list and persists", () => {
    const conversation = startConversation("build_plan");
    const message = makeMessage();
    const next = appendMessage(conversation, message);

    expect(next.messages).toEqual([message]);
    expect(readActiveConversation()?.messages).toEqual([message]);
  });

  it("appendMessage never mutates the input conversation (immutability)", () => {
    const conversation = startConversation("build_plan");
    const before = JSON.stringify(conversation);
    appendMessage(conversation, makeMessage());
    expect(JSON.stringify(conversation)).toBe(before);
  });

  it("touchConversation updates lastOpened without touching messages", () => {
    const conversation = appendMessage(startConversation("explain_results"), makeMessage());
    const touched = touchConversation(conversation, "2026-07-02T00:00:00.000Z");
    expect(touched.lastOpened).toBe("2026-07-02T00:00:00.000Z");
    expect(touched.messages).toEqual(conversation.messages);
  });

  it("updateSummary replaces the summary field only", () => {
    const conversation = startConversation("challenge_result");
    const updated = updateSummary(conversation, "User is skeptical of the Technology cluster.");
    expect(updated.summary).toBe("User is skeptical of the Technology cluster.");
    expect(updated.goal).toBe(conversation.goal);
  });

  it("recentMessages returns only the last N messages", () => {
    let conversation = startConversation("compare_careers");
    for (let i = 0; i < 12; i += 1) {
      conversation = appendMessage(conversation, makeMessage({ id: `msg-${i}`, text: `#${i}` }));
    }
    const recent = recentMessages(conversation, 8);
    expect(recent).toHaveLength(8);
    expect(recent[0]?.id).toBe("msg-4");
    expect(recent.at(-1)?.id).toBe("msg-11");
  });
});
