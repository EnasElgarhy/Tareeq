import { describe, expect, it } from "vitest";
import { scoreCore } from "@/lib/core-v2/scoring";
import { SAMPLE_STUDENT } from "@/lib/core-v2/content/sample";
import { validateChatRequest } from "@/lib/kai/chat-server";
import { parseCoreKaiRequest } from "./core-request";

const result = scoreCore(SAMPLE_STUDENT);

function request(overrides: Record<string, unknown> = {}) {
  return {
    result,
    isFlagged: false,
    entryPromptId: "S4-KAI-Q",
    profile: { gender: "male", ageBand: "18+", academicStage: null, country: "Egypt" },
    priorDisagreements: [],
    ...overrides,
  };
}

const chatContext = {
  user: { displayName: "Sara", locale: "en" },
  assessment: null,
  report: null,
  journey: { completedAssessments: [], lockedModules: [] },
  conversation: { goal: "explain_results", summary: "", recentMessages: [] },
  memories: { items: [], personSummary: "" },
};

describe("parseCoreKaiRequest", () => {
  it("accepts a scored result with a profile and entry prompt", () => {
    const parsed = parseCoreKaiRequest(request());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.entryPromptId).toBe("S4-KAI-Q");
    expect(parsed.value.previousResult).toBeNull();
    expect(parsed.value.result.leadingCuriosities).toEqual(result.leadingCuriosities);
  });

  it("treats a missing entry prompt as none", () => {
    const parsed = parseCoreKaiRequest(request({ entryPromptId: undefined }));
    expect(parsed.ok && parsed.value.entryPromptId).toBeNull();
  });

  it.each([
    ["another scoring version", { result: { ...result, scoringVersion: "1.0" } }],
    ["an unknown curiosity code", { result: { ...result, leadingCuriosities: ["XX"] } }],
    ["a count out of range", { result: { ...result, curiosityCounts: { ...result.curiosityCounts, RD: 99 } } }],
    ["an unknown entry prompt", { entryPromptId: "S9-KAI-Q" }],
    ["free text where a gender goes", { profile: { gender: "other", ageBand: null, academicStage: null, country: null } }],
    ["an oversized disagreement", { priorDisagreements: [{ result: "x", studentVersion: "y".repeat(301), reason: null }] }],
  ])("rejects %s", (_label, overrides) => {
    expect(parseCoreKaiRequest(request(overrides)).ok).toBe(false);
  });
});

describe("validateChatRequest with core", () => {
  it("keeps a valid core request", () => {
    const validated = validateChatRequest({ kind: "open", context: chatContext, core: request() });
    expect(validated.ok && validated.value.core?.entryPromptId).toBe("S4-KAI-Q");
  });

  it("leaves legacy requests without core", () => {
    const validated = validateChatRequest({ kind: "open", context: chatContext });
    expect(validated.ok && validated.value.core).toBeUndefined();
  });

  it("rejects a malformed core request instead of falling back to the legacy prompt", () => {
    const validated = validateChatRequest({ kind: "open", context: chatContext, core: { result: {} } });
    expect(validated.ok).toBe(false);
  });
});
