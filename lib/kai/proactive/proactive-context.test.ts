import { describe, expect, it } from "vitest";
import type { KaiConversation } from "@/lib/kai/chat-types";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import { buildProactiveContext, pickGreetingKey } from "@/lib/kai/proactive/proactive-context";
import { proactiveMomentHref, renderProactiveMomentText } from "@/lib/kai/proactive/proactive-render";
import type { KaiContext } from "@/lib/kai/types";
import type { ProfileSnapshot } from "@/lib/profile/journey";
import { translate } from "@/lib/i18n/strings";

function makeKaiContext(overrides: Partial<KaiContext> = {}): KaiContext {
  return {
    user: { displayName: "Sara", locale: "en" },
    assessment: {
      primaryCluster: "Law and Diplomacy",
      confidence: 82,
      archetype: "Precisionist",
      rewardDriver: "Mastery",
      ecosystemFit: "Solo Specialist",
      topClusters: ["Law and Diplomacy", "Business"],
    },
    report: null,
    journey: { completedAssessments: ["CORE Compass"], lockedModules: [] },
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  const modules: ProfileSnapshot["modules"] = [
    {
      id: "core-compass",
      name: "CORE Compass",
      tagline: "tagline",
      description: "desc",
      durationLabel: "12 min",
      icon: "compass",
      status: "completed",
      completedAt: "2026-06-01T00:00:00.000Z",
      route: "/results",
    },
    {
      id: "deep-dive",
      name: "Deep Dive Interview",
      tagline: "tagline",
      description: "desc",
      durationLabel: "~25 min",
      icon: "interview",
      status: "locked",
      completedAt: null,
      route: undefined,
    },
  ];

  return {
    registration: null,
    coreReport: null,
    modules,
    completedCount: 1,
    totalCount: modules.length,
    completionPct: 50,
    hasAnyResult: true,
    ...overrides,
  };
}

function makeMemory(overrides: Partial<KaiMemoryProfile> = {}): KaiMemoryProfile {
  return { items: [], personSummary: "", updatedAt: "2026-06-01T00:00:00.000Z", ...overrides };
}

function makeConversation(overrides: Partial<KaiConversation> = {}): KaiConversation {
  return {
    id: "conv-1",
    goal: "explain_results",
    messages: [{ id: "m1", role: "kai", createdAt: "2026-06-01T00:00:00.000Z", text: "Hi Sara" }],
    summary: "",
    createdAt: "2026-06-01T00:00:00.000Z",
    lastOpened: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("pickGreetingKey", () => {
  it("picks the morning greeting before noon", () => {
    expect(pickGreetingKey(new Date(2026, 5, 1, 9))).toBe("kai.panel.greeting_morning");
  });

  it("picks the afternoon greeting between noon and 6pm", () => {
    expect(pickGreetingKey(new Date(2026, 5, 1, 14))).toBe("kai.panel.greeting_afternoon");
  });

  it("picks the evening greeting after 6pm", () => {
    expect(pickGreetingKey(new Date(2026, 5, 1, 20))).toBe("kai.panel.greeting_evening");
  });
});

describe("buildProactiveContext — no assessment state", () => {
  it("recommends CORE Compass as the next step, even with memory or a conversation present", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext({ assessment: null }),
      snapshot: makeSnapshot({ hasAnyResult: false, modules: [{ ...makeSnapshot().modules[0]!, status: "available" }] }),
      memory: makeMemory({ items: [{ id: "1", category: "goal", value: "Study abroad", createdAt: "x", updatedAt: "x" }] }),
      conversation: makeConversation(),
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment).toEqual({
      kind: "next_step",
      params: { module: "CORE Compass", duration: "12 min" },
    });
  });
});

describe("buildProactiveContext — completed assessment state", () => {
  it("highlights the Compass result when there's no memory or active conversation", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory(),
      conversation: null,
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment).toEqual({
      kind: "compass_highlight",
      goal: "explain_results",
      params: { cluster: "Law and Diplomacy", archetype: "Precisionist" },
    });
  });

  it("does not recommend the next journey module — it's a locked placeholder, not real", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory(),
      conversation: null,
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment?.kind).not.toBe("next_step");
  });
});

describe("buildProactiveContext — memory-based resume", () => {
  it("picks up the most recently updated memory item", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory({
        items: [
          { id: "1", category: "career_interest", value: "AI research", createdAt: "x", updatedAt: "2026-05-01T00:00:00.000Z" },
          { id: "2", category: "question_topic", value: "law abroad", createdAt: "x", updatedAt: "2026-06-01T00:00:00.000Z" },
        ],
      }),
      conversation: null,
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment).toEqual({
      kind: "resume_topic",
      goal: "compare_careers",
      params: { topic: "law abroad" },
    });
  });

  it("prioritizes resuming an active conversation over a remembered topic", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory({
        items: [{ id: "1", category: "goal", value: "Study abroad", createdAt: "x", updatedAt: "x" }],
      }),
      conversation: makeConversation({
        messages: [
          { id: "m1", role: "kai", createdAt: "x", text: "Hi" },
          { id: "m2", role: "user", createdAt: "x", text: "Tell me about law" },
        ],
      }),
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment).toEqual({ kind: "resume_conversation", params: { summary: "" } });
  });

  it("carries the conversation's real summary for the resume moment", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory(),
      conversation: makeConversation({
        summary: "Comparing law programs abroad",
        messages: [
          { id: "m1", role: "kai", createdAt: "x", text: "Hi" },
          { id: "m2", role: "user", createdAt: "x", text: "Tell me about law" },
        ],
      }),
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment).toEqual({
      kind: "resume_conversation",
      params: { summary: "Comparing law programs abroad" },
    });
  });

  it("does not treat a single unread opener as a resumable conversation", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory({
        items: [{ id: "1", category: "goal", value: "Study abroad", createdAt: "x", updatedAt: "x" }],
      }),
      conversation: makeConversation(),
      daysSinceLastSeen: null,
    });

    expect(context.primaryMoment?.kind).toBe("resume_topic");
  });
});

describe("buildProactiveContext — goal chip ordering", () => {
  it("leads with the primary moment's goal without dropping any other action", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory({
        items: [{ id: "1", category: "question_topic", value: "law abroad", createdAt: "x", updatedAt: "x" }],
      }),
      conversation: null,
      daysSinceLastSeen: null,
    });

    expect(context.goalOrder[0]).toBe("compare_careers");
    expect(context.goalOrder).toHaveLength(6);
    expect(new Set(context.goalOrder).size).toBe(6);
  });
});

describe("buildProactiveContext — inactivity nudge", () => {
  it("does not show a nudge under the threshold", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory(),
      conversation: null,
      daysSinceLastSeen: 1,
    });
    expect(context.showInactivityNudge).toBe(false);
  });

  it("shows a nudge at the threshold", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory(),
      conversation: null,
      daysSinceLastSeen: 3,
    });
    expect(context.showInactivityNudge).toBe(true);
  });

  it("shows no nudge on a first-ever visit (no prior timestamp to compare)", () => {
    const context = buildProactiveContext({
      now: new Date(2026, 5, 1, 9),
      kaiContext: makeKaiContext(),
      snapshot: makeSnapshot(),
      memory: makeMemory(),
      conversation: null,
      daysSinceLastSeen: null,
    });
    expect(context.showInactivityNudge).toBe(false);
  });
});

describe("Arabic/RTL copy safety", () => {
  it("renders every moment kind in Arabic with placeholders fully substituted", () => {
    const ar = (key: Parameters<typeof translate>[1]) => translate("ar", key);
    const moments: Array<Parameters<typeof renderProactiveMomentText>[0]> = [
      { kind: "resume_conversation", params: { summary: "" } },
      { kind: "resume_conversation", params: { summary: "Comparing law programs abroad" } },
      { kind: "resume_topic", goal: "compare_careers", params: { topic: "law abroad" } },
      { kind: "next_step", params: { module: "CORE Compass", duration: "12 min" } },
      { kind: "compass_highlight", goal: "explain_results", params: { cluster: "Law and Diplomacy", archetype: "Precisionist" } },
    ];

    for (const moment of moments) {
      const text = renderProactiveMomentText(moment, ar);
      expect(text).not.toContain("{");
      expect(text).not.toContain("}");
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("builds a valid href for every moment kind", () => {
    expect(proactiveMomentHref({ kind: "next_step", params: { module: "x", duration: "y" } })).toBe("/start");
    expect(
      proactiveMomentHref({ kind: "resume_topic", goal: "build_plan", params: { topic: "x" } }),
    ).toBe("/kai-chat?goal=build_plan");
    expect(proactiveMomentHref({ kind: "resume_conversation", params: { summary: "" } })).toBe("/kai-chat");
  });
});
