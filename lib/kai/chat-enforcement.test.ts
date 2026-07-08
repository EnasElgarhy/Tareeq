import { describe, expect, it } from "vitest";
import { buildFallbackBlocks, enforceRequiredBlocks, repairRequiredBlocks } from "@/lib/kai/chat-enforcement";
import type { KaiChatContext } from "@/lib/kai/chat-context";

function makeContext(overrides: Partial<KaiChatContext> = {}): KaiChatContext {
  return {
    user: { displayName: "Sara", locale: "en" },
    assessment: {
      primaryCluster: "Law and Diplomacy",
      confidence: 44,
      archetype: "Explorer",
      rewardDriver: "Mastery",
      ecosystemFit: "Solo Sprinter",
      topClusters: ["Law and Diplomacy"],
    },
    report: null,
    journey: { completedAssessments: [], lockedModules: [] },
    conversation: { goal: "explain_results", summary: "", recentMessages: [] },
    memories: { items: [], personSummary: "" },
    ...overrides,
  };
}

describe("repairRequiredBlocks", () => {
  it("does nothing when the required block is already present", () => {
    const result = repairRequiredBlocks({
      text: "Here you go.",
      blocks: [{ type: "learning_resources", title: "x", resources: [{ type: "book", title: "x", authorOrProvider: "x", reason: "x", difficulty: "beginner", estimatedTime: "1h" }] }],
      intent: "resource_recommendation",
      locale: "en",
    });
    expect(result.stillMissing).toEqual([]);
  });

  it("converts a Day-N plain-text plan into an action_plan block (never leaves it as plain text)", () => {
    const result = repairRequiredBlocks({
      text: "Here's how to start:\nDay 1: Watch a career video\nDay 2: Message a professional\nDay 3: Read about majors",
      blocks: undefined,
      intent: "action_plan",
      locale: "en",
    });
    expect(result.stillMissing).toEqual([]);
    expect(result.blocks).toHaveLength(1);
    const plan = result.blocks?.[0];
    expect(plan?.type).toBe("action_plan");
    if (plan?.type === "action_plan") {
      expect(plan.tasks.map((t) => t.text)).toEqual([
        "Watch a career video",
        "Message a professional",
        "Read about majors",
      ]);
    }
    expect(result.text).toBe("Here's how to start:");
  });

  it("converts markdown bullets into a checklist block for family_conversation", () => {
    const result = repairRequiredBlocks({
      text: "Before you talk to them:\n- Pick a calm moment\n- Bring one example",
      blocks: [
        { type: "talking_points", title: "Points", points: ["One"] },
        { type: "family_script", title: "Script", script: ["Line"] },
      ],
      intent: "family_conversation",
      locale: "en",
    });
    expect(result.stillMissing).toEqual([]);
    const checklist = result.blocks?.find((b) => b.type === "checklist");
    expect(checklist).toMatchObject({ items: ["Pick a calm moment", "Bring one example"] });
  });

  it("leaves resource_recommendation unrepaired — resource metadata is never synthesized from prose", () => {
    const result = repairRequiredBlocks({
      text: "I recommend watching some videos about diplomacy careers.",
      blocks: undefined,
      intent: "resource_recommendation",
      locale: "en",
    });
    expect(result.stillMissing).toEqual(["learning_resources"]);
  });

  it("leaves family_conversation partially unrepaired when the text has no bullets to extract", () => {
    const result = repairRequiredBlocks({
      text: "I understand this is a hard conversation to have with your family.",
      blocks: undefined,
      intent: "family_conversation",
      locale: "en",
    });
    expect(result.stillMissing).toEqual(["talking_points", "family_script", "checklist"]);
  });

  it("uses Arabic titles for repaired blocks when locale is ar", () => {
    const result = repairRequiredBlocks({
      text: "خطتك:\nDay 1: شيء ما\nDay 2: شيء آخر",
      blocks: undefined,
      intent: "action_plan",
      locale: "ar",
    });
    const plan = result.blocks?.[0];
    expect(plan?.type === "action_plan" && plan.title).toBe("خطتك");
  });
});

describe("buildFallbackBlocks", () => {
  it("builds an insight_block from real assessment data, never invented", () => {
    const blocks = buildFallbackBlocks(["insight_block"], makeContext());
    const insight = blocks.find((b) => b.type === "insight_block");
    expect(insight?.type === "insight_block" && insight.body).toContain("Law and Diplomacy");
    expect(insight?.type === "insight_block" && insight.body).toContain("44%");
  });

  it("builds a bullet_list guidance card for resource_recommendation, never fake resource cards", () => {
    const blocks = buildFallbackBlocks(["learning_resources"], makeContext());
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("bullet_list");
  });

  it("builds generic-but-honest content for family_conversation requirements", () => {
    const blocks = buildFallbackBlocks(["talking_points", "family_script", "checklist"], makeContext());
    expect(blocks.map((b) => b.type).sort()).toEqual(["checklist", "family_script", "talking_points"]);
  });

  it("renders Arabic fallback content when locale is ar", () => {
    const blocks = buildFallbackBlocks(["insight_block"], makeContext({ user: { displayName: "سارة", locale: "ar" } }));
    const insight = blocks.find((b) => b.type === "insight_block");
    expect(insight?.type === "insight_block" && insight.title).toBe("لماذا هذا مهم لك");
  });
});

describe("enforceRequiredBlocks", () => {
  it("skips the retry entirely when the first attempt already satisfies the contract", async () => {
    let retryCalled = false;
    const outcome = await enforceRequiredBlocks(
      { text: "Here's a plan.", blocks: [{ type: "action_plan", title: "Plan", tasks: [{ id: "1", text: "Do it" }] }], intent: "action_plan" },
      makeContext(),
      async () => {
        retryCalled = true;
        return null;
      },
    );
    expect(retryCalled).toBe(false);
    expect(outcome.retryRaw).toBeNull();
  });

  it("skips the retry when deterministic repair alone satisfies the contract", async () => {
    let retryCalled = false;
    const outcome = await enforceRequiredBlocks(
      { text: "Day 1: Watch a video\nDay 2: Talk to someone", blocks: undefined, intent: "action_plan" },
      makeContext(),
      async () => {
        retryCalled = true;
        return null;
      },
    );
    expect(retryCalled).toBe(false);
    expect(outcome.blocks?.some((b) => b.type === "action_plan")).toBe(true);
  });

  it("calls retryOnce when repair can't satisfy the contract, and uses its blocks on success", async () => {
    const outcome = await enforceRequiredBlocks(
      { text: "I can recommend some great videos for you.", blocks: undefined, intent: "resource_recommendation" },
      makeContext(),
      async (stillMissing) => {
        expect(stillMissing).toEqual(["learning_resources"]);
        return {
          text: "Here you go.",
          blocks: [
            {
              type: "learning_resources",
              title: "Worth checking out",
              resources: [{ type: "youtube_video", title: "x", authorOrProvider: "x", reason: "x", difficulty: "beginner", estimatedTime: "10 min" }],
            },
          ],
          intent: "resource_recommendation",
          raw: { marker: "retry-succeeded" },
        };
      },
    );
    expect(outcome.blocks?.some((b) => b.type === "learning_resources")).toBe(true);
    expect(outcome.retryRaw).toEqual({ marker: "retry-succeeded" });
  });

  it("action_plan never ends up rendered as plain text — falls back to a deterministic block when both repair and retry fail", async () => {
    const outcome = await enforceRequiredBlocks(
      { text: "I think you should take it one step at a time and explore your options.", blocks: undefined, intent: "action_plan" },
      makeContext(),
      async () => null, // retry call itself failed (network/parse error)
    );
    expect(outcome.blocks?.some((b) => b.type === "action_plan")).toBe(true);
  });

  it("falls back for whatever the retry still didn't provide", async () => {
    const outcome = await enforceRequiredBlocks(
      { text: "Let's talk about how to approach your family.", blocks: undefined, intent: "family_conversation" },
      makeContext(),
      async () => ({
        text: "Here's a script for you.",
        blocks: [{ type: "family_script", title: "Script", script: ["I've thought about this."] }],
        intent: "family_conversation",
        raw: {},
      }),
    );
    // retry supplied family_script but not talking_points/checklist — fallback should cover those
    const types = outcome.blocks?.map((b) => b.type) ?? [];
    expect(types).toContain("family_script");
    expect(types).toContain("talking_points");
    expect(types).toContain("checklist");
  });

  it("does nothing for an intent with no requirement (general_question stays plain text if that's genuinely simple)", async () => {
    let retryCalled = false;
    const outcome = await enforceRequiredBlocks(
      { text: "Sure, that's a great question!", blocks: undefined, intent: "general_question" },
      makeContext(),
      async () => {
        retryCalled = true;
        return null;
      },
    );
    expect(retryCalled).toBe(false);
    expect(outcome.blocks).toBeUndefined();
  });
});
