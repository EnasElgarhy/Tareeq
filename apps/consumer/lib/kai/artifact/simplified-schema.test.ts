import { describe, expect, it } from "vitest";
import {
  buildRecoverySchema,
  buildRequiredBlocksSchema,
  buildResponseSchema,
} from "@/lib/kai/chat-prompt";
import { KAI_MESSAGE_INTENTS } from "@/lib/kai/intent";
import { INTENT_REQUIRED_BLOCKS } from "@/lib/kai/required-blocks";

type SchemaObject = {
  type: string;
  properties: Record<
    string,
    {
      enum?: string[];
      items?: { properties: Record<string, { enum?: string[] }> };
    }
  >;
  required: string[];
};

describe("buildResponseSchema intent contract", () => {
  it("locks the model-reported intent to the server-classified intent", () => {
    const schema = buildResponseSchema(
      "fact_lookup",
    ) as unknown as SchemaObject;
    expect(schema.properties.intent.enum).toEqual(["fact_lookup"]);
  });

  it("allows every block that enforcement can require for the same intent", () => {
    for (const intent of KAI_MESSAGE_INTENTS) {
      const schema = buildResponseSchema(intent) as unknown as SchemaObject;
      const allowedTypes = schema.properties.blocks.items?.properties.type
        .enum as string[];
      for (const requiredType of INTENT_REQUIRED_BLOCKS[intent] ?? []) {
        expect(allowedTypes, `${intent} must allow ${requiredType}`).toContain(
          requiredType,
        );
      }
    }
  });

  it("requires structured blocks for artifact intents but not factual lookups", () => {
    const action = buildResponseSchema(
      "action_plan",
    ) as unknown as SchemaObject;
    const comparison = buildResponseSchema(
      "career_comparison",
    ) as unknown as SchemaObject;
    const factual = buildResponseSchema(
      "fact_lookup",
    ) as unknown as SchemaObject;
    expect(action.required).toContain("blocks");
    expect(comparison.required).toContain("blocks");
    expect(factual.required).not.toContain("blocks");
    expect(action.required).toContain("quickReplies");
    expect(factual.required).toContain("quickReplies");
  });

  it("builds a strict retry schema with only the missing block types", () => {
    const schema = buildRequiredBlocksSchema("action_plan", [
      "action_plan",
    ]) as unknown as SchemaObject;
    expect(schema.required).toContain("blocks");
    expect(schema.properties.blocks.items?.properties.type.enum).toEqual([
      "action_plan",
    ]);
    expect(schema.properties.intent.enum).toEqual(["action_plan"]);
  });
});

describe("buildRecoverySchema (Phase 2C text-only recovery)", () => {
  it("has no `blocks` property — nothing structured to loop on", () => {
    const schema = buildRecoverySchema() as unknown as SchemaObject;
    expect(Object.keys(schema.properties)).not.toContain("blocks");
  });

  it("requires only text + intent", () => {
    const schema = buildRecoverySchema() as unknown as SchemaObject;
    expect(schema.required).toEqual(["text", "intent"]);
  });

  it("drops the heavy full-schema fields (summary/memory/personSummary)", () => {
    const schema = buildRecoverySchema() as unknown as SchemaObject;
    const keys = Object.keys(schema.properties);
    expect(keys).not.toContain("summary");
    expect(keys).not.toContain("memoryUpdates");
    expect(keys).not.toContain("personSummary");
  });

  it("is strictly smaller than the full per-intent schema", () => {
    const full = buildResponseSchema("action_plan") as unknown as SchemaObject;
    const recovery = buildRecoverySchema() as unknown as SchemaObject;
    expect(Object.keys(recovery.properties).length).toBeLessThan(
      Object.keys(full.properties).length,
    );
  });
});
