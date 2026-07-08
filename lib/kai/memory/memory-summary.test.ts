import { describe, expect, it } from "vitest";
import { capSummary } from "@/lib/kai/memory/memory-summary";

describe("capSummary", () => {
  it("returns a short summary unchanged", () => {
    expect(capSummary("Ahmed is interested in AI.")).toBe("Ahmed is interested in AI.");
  });

  it("keeps up to 3 paragraphs", () => {
    const summary = ["Paragraph one.", "Paragraph two.", "Paragraph three."].join("\n\n");
    expect(capSummary(summary)).toBe(summary);
  });

  it("drops anything past the third paragraph", () => {
    const summary = ["One.", "Two.", "Three.", "Four.", "Five."].join("\n\n");
    expect(capSummary(summary)).toBe(["One.", "Two.", "Three."].join("\n\n"));
  });

  it("trims and drops empty paragraphs", () => {
    const summary = "  First.  \n\n\n\n  \n\nSecond.  ";
    expect(capSummary(summary)).toBe("First.\n\nSecond.");
  });

  it("handles an empty string", () => {
    expect(capSummary("")).toBe("");
  });
});
