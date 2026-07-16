import { describe, expect, it } from "vitest";
import {
  ARTIFACT_SIMPLIFY_HINT,
  needsArtifact,
} from "@/lib/kai/artifact/artifact-kinds";
import { KAI_MESSAGE_INTENTS } from "@/lib/kai/intent";

describe("needsArtifact", () => {
  it("maps the heavy nested-array intents to an artifact kind", () => {
    expect(needsArtifact("action_plan")).toEqual({ kind: "action_plan", intent: "action_plan" });
    expect(needsArtifact("study_plan")).toEqual({ kind: "action_plan", intent: "study_plan" });
    expect(needsArtifact("family_conversation")).toEqual({
      kind: "family_script",
      intent: "family_conversation",
    });
    expect(needsArtifact("career_comparison")).toEqual({
      kind: "comparison",
      intent: "career_comparison",
    });
  });

  it("returns null for light conversational intents", () => {
    for (const intent of [
      "explain_result",
      "resource_recommendation",
      "university_guidance",
      "challenge_result",
      "confidence_building",
      "next_step",
      "general_question",
    ] as const) {
      expect(needsArtifact(intent)).toBeNull();
    }
  });

  it("never throws for any known intent", () => {
    for (const intent of KAI_MESSAGE_INTENTS) {
      expect(() => needsArtifact(intent)).not.toThrow();
    }
  });

  it("every artifact kind steers recovery away from structured blocks", () => {
    for (const kind of ["action_plan", "family_script", "comparison"] as const) {
      expect(ARTIFACT_SIMPLIFY_HINT[kind]).toMatch(/do NOT use structured blocks/i);
    }
    expect(ARTIFACT_SIMPLIFY_HINT.action_plan).toMatch(/plain text/i);
    expect(ARTIFACT_SIMPLIFY_HINT.family_script).toMatch(/plain text/i);
    expect(ARTIFACT_SIMPLIFY_HINT.comparison).toMatch(/do NOT use .*arrays/i);
  });
});
