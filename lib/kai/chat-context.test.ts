import { describe, expect, it } from "vitest";
import { buildKaiChatContext } from "@/lib/kai/chat-context";
import type { KaiMessage } from "@/lib/kai/chat-types";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import type { KaiContext } from "@/lib/kai/types";

function baseContext(overrides: Partial<KaiContext> = {}): KaiContext {
  return {
    user: { displayName: "Ahmed", locale: "en" },
    assessment: {
      primaryCluster: "Technology",
      confidence: 78,
      archetype: "Explorer",
      rewardDriver: "Mastery",
      ecosystemFit: "Solo Sprinter",
      topClusters: ["Technology", "Science"],
    },
    report: {
      headline: "You're drawn to building things.",
      summary: "A summary.",
      recommendedMajors: ["Computer Science"],
      recommendedCareers: ["Software Engineer"],
    },
    journey: { completedAssessments: ["CORE Compass"], lockedModules: ["Deep Dive Interview"] },
    ...overrides,
  };
}

function makeMessage(overrides: Partial<KaiMessage> = {}): KaiMessage {
  return {
    id: "m1",
    role: "user",
    createdAt: "2026-07-01T10:00:00.000Z",
    text: "Tell me more",
    ...overrides,
  };
}

function emptyMemory(overrides: Partial<KaiMemoryProfile> = {}): KaiMemoryProfile {
  return { items: [], personSummary: "", updatedAt: "2026-07-01T10:00:00.000Z", ...overrides };
}

describe("buildKaiChatContext", () => {
  it("carries the base context through unchanged", () => {
    const base = baseContext();
    const context = buildKaiChatContext({
      base,
      goal: "find_majors",
      summary: "",
      messages: [],
      memory: emptyMemory(),
    });
    expect(context.user).toEqual(base.user);
    expect(context.assessment).toEqual(base.assessment);
    expect(context.report).toEqual(base.report);
    expect(context.journey).toEqual(base.journey);
  });

  it("attaches the goal and summary", () => {
    const context = buildKaiChatContext({
      base: baseContext(),
      goal: "challenge_result",
      summary: "User pushed back on the Technology cluster.",
      messages: [],
      memory: emptyMemory(),
    });
    expect(context.conversation.goal).toBe("challenge_result");
    expect(context.conversation.summary).toBe("User pushed back on the Technology cluster.");
  });

  it("maps messages down to role + text only — no ids, blocks, or quick replies", () => {
    const messages: KaiMessage[] = [
      makeMessage({ role: "user", text: "Why Technology?" }),
      makeMessage({
        id: "m2",
        role: "kai",
        text: "Because your answers pointed that way.",
        blocks: [{ type: "journey", title: "Recap" }],
        quickReplies: ["Tell me more"],
      }),
    ];

    const context = buildKaiChatContext({
      base: baseContext(),
      goal: "find_majors",
      summary: "",
      messages,
      memory: emptyMemory(),
    });

    expect(context.conversation.recentMessages).toEqual([
      { role: "user", text: "Why Technology?" },
      { role: "kai", text: "Because your answers pointed that way." },
    ]);
  });

  it("still passes the PII guard — no email or raw answers leak through", () => {
    const context = buildKaiChatContext({
      base: baseContext(),
      goal: "build_plan",
      summary: "",
      messages: [],
      memory: emptyMemory(),
    });
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("answers");
  });

  it("handles a null assessment/report (no completed CORE Compass yet)", () => {
    const context = buildKaiChatContext({
      base: baseContext({ assessment: null, report: null }),
      goal: "explain_results",
      summary: "",
      messages: [],
      memory: emptyMemory(),
    });
    expect(context.assessment).toBeNull();
    expect(context.report).toBeNull();
  });

  it("maps memory items down to category + value only — no ids or timestamps", () => {
    const memory: KaiMemoryProfile = {
      items: [
        {
          id: "mem-1",
          category: "career_interest",
          value: "Artificial Intelligence",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-15T00:00:00.000Z",
        },
      ],
      personSummary: "Ahmed is exploring AI and product design.",
      updatedAt: "2026-06-15T00:00:00.000Z",
    };

    const context = buildKaiChatContext({
      base: baseContext(),
      goal: "find_majors",
      summary: "",
      messages: [],
      memory,
    });

    expect(context.memories.items).toEqual([{ category: "career_interest", value: "Artificial Intelligence" }]);
    expect(context.memories.personSummary).toBe("Ahmed is exploring AI and product design.");
    expect(JSON.stringify(context)).not.toContain("mem-1");
    expect(JSON.stringify(context)).not.toContain("2026-06-01T00:00:00.000Z");
  });

  it("passes an empty memory profile through untouched", () => {
    const context = buildKaiChatContext({
      base: baseContext(),
      goal: "find_majors",
      summary: "",
      messages: [],
      memory: emptyMemory(),
    });
    expect(context.memories.items).toEqual([]);
    expect(context.memories.personSummary).toBe("");
  });
});
