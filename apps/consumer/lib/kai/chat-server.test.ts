import { describe, expect, it } from "vitest";
import {
  normalizeBlocks,
  normalizeIntent,
  validateChatRequest,
} from "@/lib/kai/chat-server";

function validContext() {
  return {
    user: { displayName: "Ahmed", locale: "en" },
    assessment: null,
    report: null,
    journey: { completedAssessments: [], lockedModules: [] },
    conversation: { goal: "find_majors", summary: "", recentMessages: [] },
    memories: {
      items: [] as Array<{ category: string; value: string }>,
      personSummary: "",
    },
  };
}

describe("validateChatRequest", () => {
  it("accepts a well-formed 'open' request", () => {
    const result = validateChatRequest({
      kind: "open",
      context: validContext(),
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a well-formed 'reply' request with a message", () => {
    const result = validateChatRequest({
      kind: "reply",
      context: validContext(),
      message: "Tell me more",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts durable request ids only as a complete UUID set", () => {
    const ids = {
      threadId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222",
      userMessageId: "33333333-3333-4333-8333-333333333333",
      assistantMessageId: "44444444-4444-4444-8444-444444444444",
    };
    expect(
      validateChatRequest({
        kind: "reply",
        context: validContext(),
        message: "Hello",
        ...ids,
      }).ok,
    ).toBe(true);
    expect(
      validateChatRequest({
        kind: "reply",
        context: validContext(),
        message: "Hello",
        threadId: ids.threadId,
      }).ok,
    ).toBe(false);
    expect(
      validateChatRequest({
        kind: "reply",
        context: validContext(),
        message: "Hello",
        ...ids,
        requestId: "not-a-uuid",
      }).ok,
    ).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(validateChatRequest("nope").ok).toBe(false);
    expect(validateChatRequest(null).ok).toBe(false);
    expect(validateChatRequest(42).ok).toBe(false);
  });

  it("rejects an invalid kind", () => {
    const result = validateChatRequest({
      kind: "delete",
      context: validContext(),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects 'reply' with no message", () => {
    const result = validateChatRequest({
      kind: "reply",
      context: validContext(),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects 'reply' with a blank message", () => {
    const result = validateChatRequest({
      kind: "reply",
      context: validContext(),
      message: "   ",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing context", () => {
    const result = validateChatRequest({ kind: "open" });
    expect(result.ok).toBe(false);
  });

  it("rejects a context with an unknown goal", () => {
    const context = validContext();
    context.conversation.goal = "become_president";
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(false);
  });

  it("rejects a context missing user.displayName", () => {
    const context = validContext();
    // @ts-expect-error deliberately malformed for the test
    delete context.user.displayName;
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(false);
  });

  it("rejects a context whose recentMessages isn't an array", () => {
    const context = validContext();
    // @ts-expect-error deliberately malformed for the test
    context.conversation.recentMessages = "nope";
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(false);
  });

  it("rejects a context missing memories entirely", () => {
    const context = validContext();
    // @ts-expect-error deliberately malformed for the test
    delete context.memories;
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(false);
  });

  it("rejects a context whose memories.items isn't an array", () => {
    const context = validContext();
    // @ts-expect-error deliberately malformed for the test
    context.memories.items = "nope";
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(false);
  });

  it("rejects a context whose memories.personSummary isn't a string", () => {
    const context = validContext();
    // @ts-expect-error deliberately malformed for the test
    context.memories.personSummary = 42;
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(false);
  });

  it("accepts a context with populated memories", () => {
    const context = validContext();
    context.memories = {
      items: [
        { category: "career_interest", value: "Artificial Intelligence" },
      ],
      personSummary: "Ahmed is exploring AI.",
    };
    const result = validateChatRequest({ kind: "open", context });
    expect(result.ok).toBe(true);
  });
});

describe("normalizeBlocks (Gemini response → KaiMessageBlock[])", () => {
  it("returns undefined for a non-array", () => {
    expect(normalizeBlocks("nope")).toBeUndefined();
    expect(normalizeBlocks(null)).toBeUndefined();
  });

  it("returns undefined for an empty array", () => {
    expect(normalizeBlocks([])).toBeUndefined();
  });

  it("drops entries with an unknown or missing type", () => {
    const result = normalizeBlocks([
      { type: "made_up_type", title: "x" },
      { title: "no type" },
    ]);
    expect(result).toBeUndefined();
  });

  it("normalizes a career_card, dropping it if title is missing", () => {
    expect(
      normalizeBlocks([{ type: "career_card", description: "no title" }]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "career_card",
        title: "UX Designer",
        description: "Fits your Explorer style.",
      },
    ]);
    expect(result).toEqual([
      {
        type: "career_card",
        title: "UX Designer",
        description: "Fits your Explorer style.",
      },
    ]);
  });

  it("normalizes an action_plan, dropping malformed tasks and empty plans", () => {
    expect(
      normalizeBlocks([{ type: "action_plan", title: "Plan", tasks: [] }]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "action_plan",
        title: "This week",
        duration_label: "7 days",
        tasks: [
          { text: "Watch a day-in-the-life video", estimated_time: "20 min" },
          { text: "" }, // dropped — blank text
          { estimated_time: "no text field" }, // dropped — missing text
          { text: "Message one professional" },
        ],
      },
    ]);
    expect(result).toHaveLength(1);
    const block = result?.[0];
    expect(block?.type).toBe("action_plan");
    if (block?.type === "action_plan") {
      expect(block.title).toBe("This week");
      expect(block.durationLabel).toBe("7 days");
      expect(block.tasks).toHaveLength(2);
      expect(block.tasks[0]).toMatchObject({
        text: "Watch a day-in-the-life video",
        estimatedTime: "20 min",
      });
      expect(block.tasks[0].id).toEqual(expect.any(String));
      expect(block.tasks[1]).toMatchObject({
        text: "Message one professional",
      });
    }
  });

  it("normalizes a comparison, requiring both labels", () => {
    expect(
      normalizeBlocks([
        { type: "comparison", leftLabel: "A", leftPoints: [], rightPoints: [] },
      ]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "comparison",
        leftLabel: "Software Engineering",
        leftPoints: ["More solo focus"],
        rightLabel: "Product Design",
        rightPoints: ["More collaboration"],
      },
    ]);
    expect(result).toEqual([
      {
        type: "comparison",
        leftLabel: "Software Engineering",
        leftPoints: ["More solo focus"],
        rightLabel: "Product Design",
        rightPoints: ["More collaboration"],
      },
    ]);
  });

  it("normalizes a journey block, defaulting the title if Gemini omits it", () => {
    const result = normalizeBlocks([{ type: "journey" }]);
    expect(result).toEqual([{ type: "journey", title: "Your journey" }]);
  });

  it("silently drops malformed entries while keeping valid ones in the same array", () => {
    const result = normalizeBlocks([
      { type: "made_up" },
      { type: "career_card", title: "Data Analyst", description: "" },
    ]);
    expect(result).toEqual([
      { type: "career_card", title: "Data Analyst", description: "" },
    ]);
  });

  it("normalizes a memory_card, defaulting the title if Gemini omits it", () => {
    expect(normalizeBlocks([{ type: "memory_card" }])).toEqual([
      { type: "memory_card", title: "What I remember about you" },
    ]);
  });

  it("normalizes a recommendation_history, defaulting the title if omitted", () => {
    expect(normalizeBlocks([{ type: "recommendation_history" }])).toEqual([
      { type: "recommendation_history", title: "What I've suggested so far" },
    ]);
  });

  it("normalizes a resume_conversation, dropping it if title is missing", () => {
    expect(
      normalizeBlocks([
        { type: "resume_conversation", description: "no title" },
      ]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "resume_conversation",
        title: "Continue exploring Biomedical Engineering?",
        description: "We were comparing it against Software Engineering.",
      },
    ]);
    expect(result).toEqual([
      {
        type: "resume_conversation",
        title: "Continue exploring Biomedical Engineering?",
        description: "We were comparing it against Software Engineering.",
      },
    ]);
  });

  it("normalizes a goal_card, dropping it if title is missing", () => {
    expect(
      normalizeBlocks([{ type: "goal_card", description: "no title" }]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      { type: "goal_card", title: "Study abroad", description: "" },
    ]);
    expect(result).toEqual([
      { type: "goal_card", title: "Study abroad", description: "" },
    ]);
  });

  it("normalizes a milestone_card, defaulting the title if omitted", () => {
    expect(normalizeBlocks([{ type: "milestone_card" }])).toEqual([
      { type: "milestone_card", title: "Your next milestone" },
    ]);
  });

  it("normalizes a well-formed learning_resources block", () => {
    const result = normalizeBlocks([
      {
        type: "learning_resources",
        title: "Worth checking out",
        resources: [
          {
            type: "book",
            title: "Deep Work",
            author_or_provider: "Cal Newport",
            reason: "Fits your Mastery driver.",
            difficulty: "beginner",
            estimated_time: "6 hours",
          },
        ],
      },
    ]);
    expect(result).toEqual([
      {
        type: "learning_resources",
        title: "Worth checking out",
        resources: [
          {
            type: "book",
            title: "Deep Work",
            authorOrProvider: "Cal Newport",
            reason: "Fits your Mastery driver.",
            difficulty: "beginner",
            estimatedTime: "6 hours",
          },
        ],
      },
    ]);
  });

  it("does not require an invented time estimate for a website resource", () => {
    const result = normalizeBlocks([
      {
        type: "learning_resources",
        title: "Official sources",
        resources: [
          {
            type: "website",
            title: "Study in Spain",
            author_or_provider: "SEPIE",
            reason: "Official guidance for international students.",
            difficulty: "beginner",
          },
        ],
      },
    ]);
    const resource =
      result?.[0].type === "learning_resources"
        ? result[0].resources[0]
        : undefined;
    expect(resource).toMatchObject({
      type: "website",
      title: "Study in Spain",
      authorOrProvider: "SEPIE",
    });
    expect(resource).not.toHaveProperty("estimatedTime");
  });

  it("drops model-authored source lists because verified URLs are server-owned", () => {
    expect(
      normalizeBlocks([
        {
          type: "source_list",
          title: "Sources",
          sources: [{ title: "Invented source", url: "https://example.com" }],
        },
      ]),
    ).toBeUndefined();
  });

  it("drops the whole learning_resources block when the resources array is empty", () => {
    expect(
      normalizeBlocks([
        { type: "learning_resources", title: "x", resources: [] },
      ]),
    ).toBeUndefined();
  });

  it("drops an individual resource missing a required field, keeping the rest", () => {
    const result = normalizeBlocks([
      {
        type: "learning_resources",
        title: "Worth checking out",
        resources: [
          {
            type: "book",
            title: "No reason here",
            author_or_provider: "x",
            difficulty: "beginner",
            estimated_time: "1h",
          },
          {
            type: "course",
            title: "CS50",
            author_or_provider: "Harvard",
            reason: "Matches your Technology cluster.",
            difficulty: "intermediate",
            estimated_time: "10 weeks",
          },
        ],
      },
    ]);
    expect(result?.[0]).toMatchObject({
      resources: [
        {
          type: "course",
          title: "CS50",
          authorOrProvider: "Harvard",
          reason: "Matches your Technology cluster.",
          difficulty: "intermediate",
          estimatedTime: "10 weeks",
        },
      ],
    });
  });

  it("rejects a resource with an unknown type or invalid difficulty", () => {
    const badType = normalizeBlocks([
      {
        type: "learning_resources",
        title: "x",
        resources: [
          {
            type: "not_a_real_type",
            title: "x",
            author_or_provider: "x",
            reason: "x",
            difficulty: "beginner",
            estimated_time: "1h",
          },
        ],
      },
    ]);
    expect(badType).toBeUndefined();

    const badDifficulty = normalizeBlocks([
      {
        type: "learning_resources",
        title: "x",
        resources: [
          {
            type: "book",
            title: "x",
            author_or_provider: "x",
            reason: "x",
            difficulty: "expert",
            estimated_time: "1h",
          },
        ],
      },
    ]);
    expect(badDifficulty).toBeUndefined();
  });

  it("caps a learning_resources block at 3 resources", () => {
    const resources = Array.from({ length: 5 }, (_, i) => ({
      type: "article",
      title: `Article ${i}`,
      author_or_provider: "x",
      reason: "x",
      difficulty: "beginner",
      estimated_time: "10 min",
    }));
    const result = normalizeBlocks([
      { type: "learning_resources", title: "x", resources },
    ]);
    expect(
      result?.[0].type === "learning_resources"
        ? result[0].resources.length
        : -1,
    ).toBe(3);
  });

  it("ignores any url field Gemini might invent — it was never part of the schema", () => {
    const result = normalizeBlocks([
      {
        type: "learning_resources",
        title: "x",
        resources: [
          {
            type: "website",
            title: "freeCodeCamp",
            author_or_provider: "freeCodeCamp.org",
            reason: "Hands-on, self-paced.",
            difficulty: "beginner",
            estimated_time: "ongoing",
            url: "https://freecodecamp.org",
          },
        ],
      },
    ]);
    const resource =
      result?.[0].type === "learning_resources"
        ? result[0].resources[0]
        : undefined;
    expect(resource).not.toHaveProperty("url");
  });

  it("normalizes an insight_block, requiring both title and body", () => {
    expect(
      normalizeBlocks([{ type: "insight_block", title: "Only a title" }]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "insight_block",
        title: "Why this fits",
        body: "You're driven by Mastery, and this path rewards it.",
      },
    ]);
    expect(result).toEqual([
      {
        type: "insight_block",
        title: "Why this fits",
        body: "You're driven by Mastery, and this path rewards it.",
      },
    ]);
  });

  it("normalizes a bullet_list, title is optional but items are required", () => {
    expect(
      normalizeBlocks([{ type: "bullet_list", title: "Empty", items: [] }]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      { type: "bullet_list", items: ["First", "Second"] },
    ]);
    expect(result).toEqual([
      { type: "bullet_list", items: ["First", "Second"] },
    ]);
  });

  it("normalizes a checklist, requiring both title and items", () => {
    expect(
      normalizeBlocks([{ type: "checklist", items: ["No title"] }]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "checklist",
        title: "Before you talk to them",
        items: ["Pick a calm moment", "Bring one example"],
      },
    ]);
    expect(result).toEqual([
      {
        type: "checklist",
        title: "Before you talk to them",
        items: ["Pick a calm moment", "Bring one example"],
      },
    ]);
  });

  it("normalizes talking_points", () => {
    const result = normalizeBlocks([
      {
        type: "talking_points",
        title: "What to lead with",
        points: [
          "It's a research-backed direction",
          "You've thought this through",
        ],
      },
    ]);
    expect(result).toEqual([
      {
        type: "talking_points",
        title: "What to lead with",
        points: [
          "It's a research-backed direction",
          "You've thought this through",
        ],
      },
    ]);
  });

  it("normalizes a family_script", () => {
    const result = normalizeBlocks([
      {
        type: "family_script",
        title: "What you can say",
        script: ["I've thought about this a lot.", "Here's why it fits me."],
      },
    ]);
    expect(result).toEqual([
      {
        type: "family_script",
        title: "What you can say",
        script: ["I've thought about this a lot.", "Here's why it fits me."],
      },
    ]);
  });

  it("normalizes an objection_response_list, dropping incomplete pairs", () => {
    const result = normalizeBlocks([
      {
        type: "objection_response_list",
        title: "Likely concerns",
        objections: [
          {
            objection: "Will you find a job?",
            response: "This field has strong, growing demand.",
          },
          { objection: "Missing a response" },
          { response: "Missing an objection" },
        ],
      },
    ]);
    expect(result).toEqual([
      {
        type: "objection_response_list",
        title: "Likely concerns",
        items: [
          {
            objection: "Will you find a job?",
            response: "This field has strong, growing demand.",
          },
        ],
      },
    ]);
  });

  it("normalizes a reflection_question", () => {
    const result = normalizeBlocks([
      {
        type: "reflection_question",
        question: "What would make this feel worth it in 5 years?",
      },
    ]);
    expect(result).toEqual([
      {
        type: "reflection_question",
        question: "What would make this feel worth it in 5 years?",
      },
    ]);
  });

  it("drops a reflection_question with a blank question", () => {
    expect(
      normalizeBlocks([{ type: "reflection_question", question: "   " }]),
    ).toBeUndefined();
  });

  it("normalizes a comparison_table, requiring title, columns, and rows", () => {
    expect(
      normalizeBlocks([
        { type: "comparison_table", title: "x", columns: ["A"] },
      ]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "comparison_table",
        title: "Three paths",
        columns: ["Lawyer", "Diplomat", "Policy Analyst"],
        table_rows: [
          { label: "Typical hours", values: ["Long", "Moderate", "Moderate"] },
          {
            label: "Requires postgrad?",
            values: ["Yes", "Often", "Sometimes"],
          },
        ],
      },
    ]);
    expect(result).toEqual([
      {
        type: "comparison_table",
        title: "Three paths",
        columns: ["Lawyer", "Diplomat", "Policy Analyst"],
        rows: [
          { label: "Typical hours", values: ["Long", "Moderate", "Moderate"] },
          {
            label: "Requires postgrad?",
            values: ["Yes", "Often", "Sometimes"],
          },
        ],
      },
    ]);
  });

  it("normalizes a decision_matrix, requiring title, options, and rows", () => {
    expect(
      normalizeBlocks([
        { type: "decision_matrix", title: "x", options: ["A", "B"] },
      ]),
    ).toBeUndefined();
    const result = normalizeBlocks([
      {
        type: "decision_matrix",
        title: "Weighing your options",
        options: ["Law", "Business"],
        matrix_rows: [
          { criterion: "Matches your reward driver", scores: [5, 3] },
          { criterion: "Job market strength", scores: [4, 4] },
        ],
        recommendation: "Law edges ahead on what actually motivates you.",
      },
    ]);
    expect(result).toEqual([
      {
        type: "decision_matrix",
        title: "Weighing your options",
        options: ["Law", "Business"],
        rows: [
          { criterion: "Matches your reward driver", scores: [5, 3] },
          { criterion: "Job market strength", scores: [4, 4] },
        ],
        recommendation: "Law edges ahead on what actually motivates you.",
      },
    ]);
  });

  it("drops a decision_matrix row with no valid numeric scores", () => {
    const result = normalizeBlocks([
      {
        type: "decision_matrix",
        title: "x",
        options: ["A", "B"],
        matrix_rows: [
          { criterion: "Kept", scores: [1, 2] },
          { criterion: "Dropped", scores: ["not", "numbers"] },
        ],
      },
    ]);
    expect(result?.[0]).toMatchObject({
      rows: [{ criterion: "Kept", scores: [1, 2] }],
    });
  });
});

describe("normalizeIntent", () => {
  it("accepts a known intent value", () => {
    expect(normalizeIntent("family_conversation")).toBe("family_conversation");
  });

  it("falls back to the provided fallback for an unknown value", () => {
    expect(normalizeIntent("not_a_real_intent", "career_comparison")).toBe(
      "career_comparison",
    );
  });

  it("falls back to general_question by default when no fallback is given", () => {
    expect(normalizeIntent(undefined)).toBe("general_question");
    expect(normalizeIntent(42)).toBe("general_question");
  });
});
