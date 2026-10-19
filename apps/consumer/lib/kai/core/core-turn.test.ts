import { describe, expect, it, vi } from "vitest";
import { scoreCore } from "@/lib/core-v2/scoring";
import { SAMPLE_STUDENT } from "@/lib/core-v2/content/sample";
import type { KaiChatContext } from "@/lib/kai/chat-context";
import { coreProfileFixture } from "./core-profile.test-data";
import { buildCoreSystemPrompt } from "./core-prompt";
import { runCoreKaiTurn, type CoreModelAttempt, type CoreModelCall } from "./core-turn";

const core = {
  result: scoreCore(SAMPLE_STUDENT),
  previousResult: null,
  isFlagged: false,
  entryPromptId: null,
  profile: coreProfileFixture,
  priorDisagreements: [],
};

const context: KaiChatContext = {
  user: { displayName: "Sara", locale: "en" },
  assessment: null,
  report: null,
  journey: { completedAssessments: [], lockedModules: [] },
  conversation: { goal: "explain_results", summary: "earlier", recentMessages: [] },
  memories: { items: [], personSummary: "" },
};

function model(...attempts: CoreModelAttempt[]) {
  return vi.fn<CoreModelCall>(async () => attempts.shift() ?? { ok: false, reason: "gemini_error", retryable: false });
}

describe("runCoreKaiTurn", () => {
  it("asks the model with the client prompt and returns its reply and tool calls", async () => {
    const callModel = model({
      ok: true,
      parsed: {
        text: "That's really useful to know. What feels more like you?",
        quickReplies: ["The idea part", "Building it", "Not sure", "Something else"],
        events: [{ tool: "record_disagreement", result: "Planning & Execution", student_version: "I hate lists" }],
        summary: "The student disagreed with Planning & Execution.",
      },
    });
    const turn = await runCoreKaiTurn({ core, context, kind: "reply", message: "Not me", callModel });

    expect(callModel).toHaveBeenCalledTimes(1);
    expect(callModel.mock.calls[0][0].systemPrompt).toBe(buildCoreSystemPrompt());
    expect(turn.source).toBe("gemini");
    expect(turn.message.text).toBe("That's really useful to know. What feels more like you?");
    expect(turn.message.quickReplies).toEqual(["The idea part", "Building it", "Not sure"]);
    expect(turn.message.blocks).toBeUndefined();
    expect(turn.events).toEqual([
      { tool: "record_disagreement", result: "Planning & Execution", studentVersion: "I hate lists", reason: null },
    ]);
    expect(turn.summary).toBe("The student disagreed with Planning & Execution.");
  });

  it("retries a transient failure", async () => {
    const callModel = model(
      { ok: false, reason: "network_error", retryable: true },
      { ok: true, parsed: { text: "Hello" } },
    );
    const turn = await runCoreKaiTurn({ core, context, kind: "open", callModel });
    expect(callModel).toHaveBeenCalledTimes(2);
    expect(turn.message.text).toBe("Hello");
    expect(turn.summary).toBe("earlier");
  });

  it("keeps a safeguarding alert through the repetition-loop recovery", async () => {
    const callModel = model(
      { ok: false, reason: "provider_repetition_loop", retryable: false },
      { ok: true, parsed: { text: "That sounds really heavy.", safeguarding_alert: true } },
    );
    const turn = await runCoreKaiTurn({ core, context, kind: "reply", message: "...", callModel });
    expect(turn.recoveredViaSimplified).toBe(true);
    expect(turn.events).toEqual([{ tool: "safeguarding_alert" }]);
    expect(JSON.stringify(callModel.mock.calls[1][0].responseSchema)).not.toContain("ARRAY");
  });

  it("falls back to the standard message when the model cannot answer", async () => {
    const callModel = model({ ok: false, reason: "gemini_error", retryable: false });
    const turn = await runCoreKaiTurn({ core, context, kind: "open", callModel });
    expect(turn.source).toBe("fallback");
    expect(turn.events).toEqual([]);
  });
});
