import { describe, expect, it } from "vitest";
import { buildRecoverySchema, buildResponseSchema } from "@/lib/kai/chat-prompt";

type SchemaObject = {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
};

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
