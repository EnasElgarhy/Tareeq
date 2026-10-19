import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scoreCore } from "@/lib/core-v2/scoring";
import { SAMPLE_STUDENT } from "@/lib/core-v2/content/sample";
import { coreProfileFixture } from "./core-profile.test-data";
import {
  CORE_OUTPUT_FORMAT,
  buildCoreResponseSchema,
  buildCoreSystemPrompt,
  buildCoreTurnPrompt,
} from "./core-prompt";
import { coreKaiPayload } from "./core-turn";
import { CORE_KAI_SYSTEM_PROMPT } from "./system-prompt";

const clientPrompt = readFileSync(
  join(process.cwd(), "lib/core-v2/content/data/kai-system-prompt.txt"),
  "utf8",
);

describe("CORE Kai system prompt", () => {
  it("is the client's text, character for character", () => {
    expect(CORE_KAI_SYSTEM_PROMPT).toBe(clientPrompt);
  });

  it("starts with the client prompt and only appends the output format", () => {
    expect(buildCoreSystemPrompt()).toBe(`${clientPrompt}\n\n${CORE_OUTPUT_FORMAT}`);
  });

  it("adds no behaviour that the client rules forbid", () => {
    // The appendix must not invite links, cards, plans, facts or memory.
    expect(CORE_OUTPUT_FORMAT).not.toMatch(
      /\b(url|links?|search|salar(y|ies)|universit(y|ies)|family|plans?|career_card|remember|memory|scores?|cluster)\b/i,
    );
    const schema = JSON.stringify(buildCoreResponseSchema());
    expect(schema).not.toMatch(/blocks|learning_resources|family_script|university|memoryUpdates|search_query/);
  });

  it("names exactly the tools the client prompt names", () => {
    const tools = [...clientPrompt.matchAll(/\b(record_[a-z_]+|safeguarding_alert)\b/g)].map((m) => m[1]);
    const schema = buildCoreResponseSchema() as {
      properties: { events: { items: { properties: { tool: { enum: string[] } } } } };
    };
    expect(new Set(schema.properties.events.items.properties.tool.enum)).toEqual(new Set(tools));
  });
});

describe("buildCoreTurnPrompt", () => {
  const core = {
    result: scoreCore(SAMPLE_STUDENT),
    previousResult: null,
    isFlagged: true,
    entryPromptId: "S3-KAI-Q" as const,
    profile: coreProfileFixture,
    priorDisagreements: [],
  };

  it("carries the payload, the conversation and the opening ask", () => {
    const payload = coreKaiPayload(core, "en");
    const prompt = buildCoreTurnPrompt({
      payload,
      conversationSummary: "",
      recentMessages: [],
      kind: "open",
    });
    expect(prompt).toContain(JSON.stringify(payload, null, 2));
    expect(prompt).toContain('"ENTRY_PROMPT": "Which of these curiosities');
    expect(prompt.trim().endsWith("Write Kai's first message now.")).toBe(true);
  });

  it("opens with a short welcome when Kai is opened directly", () => {
    const prompt = buildCoreTurnPrompt({
      payload: coreKaiPayload({ ...core, entryPromptId: null }, "en"),
      conversationSummary: "",
      recentMessages: [],
      kind: "open",
    });
    expect(prompt).toContain("a short welcome and one open question about the report");
  });

  it("tells Kai a first reply answers the entry prompt", () => {
    const prompt = buildCoreTurnPrompt({
      payload: coreKaiPayload(core, "en"),
      conversationSummary: "Talked about curiosities.",
      recentMessages: [{ role: "user", text: "Research feels most like me" }],
      kind: "reply",
      message: "Research feels most like me",
    });
    expect(prompt).toContain("CONVERSATION SUMMARY: Talked about curiosities.");
    expect(prompt).toContain("Student: Research feels most like me");
    expect(prompt).toContain("is answering it");
  });

  it("does not hold back a flag students cannot see yet", () => {
    expect(coreKaiPayload(core, "en").ATTEMPT_FLAGGED).toBe(false);
  });

  it("sends no name, email or memory", () => {
    const prompt = buildCoreTurnPrompt({
      payload: coreKaiPayload(core, "ar"),
      conversationSummary: "",
      recentMessages: [],
      kind: "open",
    });
    expect(prompt).not.toMatch(/displayName|email|personSummary|Learner/);
  });
});
