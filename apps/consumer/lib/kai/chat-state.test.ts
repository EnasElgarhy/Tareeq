import { describe, expect, it } from "vitest";
import { mergeConversations, updateMessage } from "@/lib/kai/chat-state";
import type { KaiConversation } from "@/lib/kai/chat-types";

function thread(messages: KaiConversation["messages"]): KaiConversation {
  return {
    id: "thread-1",
    goal: "build_plan",
    summary: "",
    messages,
    createdAt: "2026-07-01T10:00:00.000Z",
    lastOpened: "2026-07-01T10:00:00.000Z",
  };
}

describe("chat state", () => {
  it("updates only the message with the expected id", () => {
    const original = thread([
      {
        id: "one",
        role: "user",
        text: "Hello",
        createdAt: "2026-07-01T10:00:00.000Z",
      },
      {
        id: "two",
        role: "kai",
        text: "Hi",
        createdAt: "2026-07-01T10:00:01.000Z",
      },
    ]);
    const next = updateMessage(original, "one", { status: "failed" });
    expect(next.messages[0]?.status).toBe("failed");
    expect(next.messages[1]).toEqual(original.messages[1]);
  });

  it("merges a server reply without dropping an unsynced local message", () => {
    const local = thread([
      {
        id: "user-1",
        requestId: "request-1",
        role: "user",
        status: "pending",
        text: "Help me plan",
        createdAt: "2026-07-01T10:00:00.000Z",
      },
    ]);
    const remote = thread([
      { ...local.messages[0]!, status: "complete" },
      {
        id: "kai-1",
        requestId: "request-1",
        role: "kai",
        status: "complete",
        text: "Let's start.",
        createdAt: "2026-07-01T10:00:01.000Z",
      },
    ]);
    const [merged] = mergeConversations([local], [remote]);
    expect(merged?.messages).toHaveLength(2);
    expect(merged?.messages[0]?.status).toBe("complete");
    expect(merged?.messages[1]?.text).toBe("Let's start.");
  });
});
