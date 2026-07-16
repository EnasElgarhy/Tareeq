import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  KaiChatProvider,
  useKaiChat,
} from "@/components/kai/chat/KaiChatProvider";
import { readConversations } from "@/lib/kai/chat-storage";

const KAI_CONTEXT = {
  user: { displayName: "Test User", locale: "en" as const },
  assessment: null,
  report: null,
  journey: { completedAssessments: [], lockedModules: [] },
};

vi.mock("@/lib/kai/useKaiProfile", () => ({
  useKaiProfile: () => ({
    authState: "signed-in" as const,
    displayName: "Test User",
    email: "test@example.com",
    snapshot: null,
    kaiContext: KAI_CONTEXT,
    locale: "en" as const,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/kai/memory/memory", () => ({
  readMemory: vi.fn(async () => ({
    version: 1,
    items: [],
    personSummary: "",
    updatedAt: "",
  })),
  applyMemoryUpdates: vi.fn(),
}));

type ChatValue = ReturnType<typeof useKaiChat>;
let currentChat: ChatValue | null = null;

function Probe({ visible }: { visible: boolean }) {
  const chat = useKaiChat();
  useEffect(() => {
    currentChat = chat;
  }, [chat]);
  return visible ? (
    <div data-testid="chat-page" />
  ) : (
    <div data-testid="other-page" />
  );
}

describe("KaiChatProvider lifecycle", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    window.localStorage.clear();
    currentChat = null;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("persists Kai's reply after the chat page is replaced by another app page", async () => {
    let finishRequest: ((response: Response) => void) | null = null;
    const pendingResponse = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (String(input).endsWith("/api/kai/threads")) {
          return Promise.resolve(
            new Response(JSON.stringify({ available: false, threads: [] }), {
              headers: { "content-type": "application/json" },
            }),
          );
        }
        return pendingResponse;
      }),
    );

    await act(async () => {
      root.render(
        <KaiChatProvider>
          <Probe visible />
        </KaiChatProvider>,
      );
    });
    expect(currentChat?.startWithPrompt("Help me explore technology")).toBe(
      true,
    );
    expect(
      readConversations()[0]?.messages.map((message) => message.role),
    ).toEqual(["user"]);

    await act(async () => {
      root.render(
        <KaiChatProvider>
          <Probe visible={false} />
        </KaiChatProvider>,
      );
    });

    const complete = {
      type: "complete",
      data: {
        message: {
          id: "server-message",
          role: "kai",
          createdAt: "2026-07-16T12:00:01.000Z",
          text: "Start with a small coding project.",
        },
        source: "gemini",
      },
    };
    await act(async () => {
      finishRequest?.(
        new Response(
          `${JSON.stringify({ type: "text", text: "Start with" })}\n${JSON.stringify(complete)}\n`,
          {
            headers: { "content-type": "application/x-ndjson" },
          },
        ),
      );
      await pendingResponse;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      readConversations()[0]?.messages.map((message) => message.role),
    ).toEqual(["user", "kai"]);
    expect(readConversations()[0]?.messages[1]?.text).toBe(
      "Start with a small coding project.",
    );
  });
});
