import { describe, expect, it } from "vitest";
import type { KaiMessageBlock } from "@/lib/kai/chat-types";
import { getMissingRequiredBlocks } from "@/lib/kai/required-blocks";

function block(type: KaiMessageBlock["type"]): KaiMessageBlock {
  switch (type) {
    case "action_plan":
      return { type, title: "Plan", tasks: [{ id: "1", text: "Do a thing" }] };
    case "learning_resources":
      return { type, title: "Resources", resources: [] };
    case "talking_points":
      return { type, title: "Points", points: ["One"] };
    case "family_script":
      return { type, title: "Script", script: ["Line one"] };
    case "checklist":
      return { type, title: "Checklist", items: ["Item one"] };
    case "insight_block":
      return { type, title: "Insight", body: "Because reasons." };
    default:
      throw new Error(`unhandled block type in test helper: ${type}`);
  }
}

describe("getMissingRequiredBlocks", () => {
  it("returns empty for an intent with no requirement", () => {
    expect(getMissingRequiredBlocks("general_question", [])).toEqual([]);
    expect(getMissingRequiredBlocks("next_step", undefined)).toEqual([]);
  });

  it("returns the required type when blocks are missing entirely", () => {
    expect(getMissingRequiredBlocks("action_plan", undefined)).toEqual(["action_plan"]);
    expect(getMissingRequiredBlocks("resource_recommendation", [])).toEqual(["learning_resources"]);
    expect(getMissingRequiredBlocks("explain_result", [])).toEqual(["insight_block"]);
  });

  it("returns empty once the required block is present", () => {
    expect(getMissingRequiredBlocks("action_plan", [block("action_plan")])).toEqual([]);
    expect(getMissingRequiredBlocks("resource_recommendation", [block("learning_resources")])).toEqual([]);
    expect(getMissingRequiredBlocks("explain_result", [block("insight_block")])).toEqual([]);
  });

  it("returns every still-missing type for a multi-block requirement", () => {
    const missing = getMissingRequiredBlocks("family_conversation", [block("talking_points")]);
    expect(missing).toEqual(["family_script", "checklist"]);
  });

  it("returns empty once ALL required types for a multi-block requirement are present", () => {
    const missing = getMissingRequiredBlocks("family_conversation", [
      block("talking_points"),
      block("family_script"),
      block("checklist"),
    ]);
    expect(missing).toEqual([]);
  });

  it("study_plan requires action_plan just like action_plan intent", () => {
    expect(getMissingRequiredBlocks("study_plan", [])).toEqual(["action_plan"]);
  });
});
