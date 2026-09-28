import { describe, expect, it } from "vitest";
import { detectDegenerateOutput } from "@/lib/kai/repetition";

describe("detectDegenerateOutput", () => {
  it("flags MAX_TOKENS finishReason regardless of content", () => {
    const v = detectDegenerateOutput('{"text":"hi"}', "MAX_TOKENS");
    expect(v.degenerate).toBe(true);
    expect(v.reason).toBe("max_tokens");
  });

  it("passes a normal completed JSON reply (STOP)", () => {
    const raw = JSON.stringify({
      text: "Your compass points to law and diplomacy.",
      intent: "explain_result",
      quickReplies: ["Tell me more", "What next?"],
    });
    expect(detectDegenerateOutput(raw, "STOP")).toEqual({
      degenerate: false,
      reason: null,
    });
  });

  it("flags the observed newline repetition loop", () => {
    const raw = `{"text":"ok"${"\n".repeat(200)}`;
    const v = detectDegenerateOutput(raw, "STOP");
    expect(v.degenerate).toBe(true);
    expect(v.reason).toBe("repeated_char_run");
  });

  it("flags a long output with pathologically low character diversity", () => {
    const raw = "a".repeat(3000);
    const v = detectDegenerateOutput(raw, "STOP");
    expect(v.degenerate).toBe(true);
    // long run of one char trips the run check first — either signal is valid
    expect(["repeated_char_run", "low_unique_ratio"]).toContain(v.reason);
  });

  it("flags long output with unbalanced braces (truncated mid-object)", () => {
    // High character diversity (so run + ratio checks pass) but the JSON is
    // truncated mid-structure and never closes its braces.
    const tasks = Array.from(
      { length: 30 },
      (_, i) =>
        `{"text":"Task ${i}: research legal specialization ${i} and summarize the day's findings clearly"`,
    ).join(",");
    const raw = `{"blocks":[{"type":"action_plan","title":"Explore Law","tasks":[${tasks}`;
    const v = detectDegenerateOutput(raw, "STOP");
    expect(v.degenerate).toBe(true);
    expect(v.reason).toBe("unbalanced_json");
  });

  it("does not flag short answers with few distinct chars", () => {
    expect(detectDegenerateOutput('{"text":"ok"}', "STOP").degenerate).toBe(false);
  });

  it("handles empty / null output", () => {
    expect(detectDegenerateOutput("", "STOP").degenerate).toBe(false);
    expect(detectDegenerateOutput(null, "STOP").degenerate).toBe(false);
    expect(detectDegenerateOutput(undefined, undefined).degenerate).toBe(false);
  });

  it("treats balanced normal JSON with newlines inside strings as fine", () => {
    const raw = JSON.stringify({ text: "line one\nline two\nline three", intent: "next_step" });
    expect(detectDegenerateOutput(raw, "STOP").degenerate).toBe(false);
  });
});
