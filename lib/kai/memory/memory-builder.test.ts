import { describe, expect, it } from "vitest";
import { buildMemoryCandidates } from "@/lib/kai/memory/memory-builder";

describe("buildMemoryCandidates", () => {
  it("returns an empty array for a non-array", () => {
    expect(buildMemoryCandidates("nope")).toEqual([]);
    expect(buildMemoryCandidates(null)).toEqual([]);
    expect(buildMemoryCandidates(undefined)).toEqual([]);
  });

  it("accepts a well-formed candidate", () => {
    const result = buildMemoryCandidates([{ category: "career_interest", value: "Artificial Intelligence" }]);
    expect(result).toEqual([{ category: "career_interest", value: "Artificial Intelligence" }]);
  });

  it("drops an entry with an unknown category", () => {
    const result = buildMemoryCandidates([{ category: "favorite_color", value: "Blue" }]);
    expect(result).toEqual([]);
  });

  it("drops an entry with a missing or blank value", () => {
    expect(buildMemoryCandidates([{ category: "goal" }])).toEqual([]);
    expect(buildMemoryCandidates([{ category: "goal", value: "   " }])).toEqual([]);
  });

  it("trims whitespace from the value", () => {
    const result = buildMemoryCandidates([{ category: "goal", value: "  Study abroad  " }]);
    expect(result).toEqual([{ category: "goal", value: "Study abroad" }]);
  });

  it("rejects a value that looks like an email address", () => {
    const result = buildMemoryCandidates([{ category: "goal", value: "ahmed@example.com" }]);
    expect(result).toEqual([]);
  });

  it("rejects a value containing a long digit run (phone numbers, ids)", () => {
    const result = buildMemoryCandidates([{ category: "goal", value: "Call me at 5551234567" }]);
    expect(result).toEqual([]);
  });

  it("rejects a value longer than the max length", () => {
    const longValue = "a".repeat(200);
    const result = buildMemoryCandidates([{ category: "goal", value: longValue }]);
    expect(result).toEqual([]);
  });

  it("keeps well-formed candidates while dropping malformed ones in the same array", () => {
    const result = buildMemoryCandidates([
      { category: "career_interest", value: "Product Design" },
      { category: "goal", value: "ahmed@example.com" },
      { category: "not_a_real_category", value: "x" },
      { category: "learning_style", value: "Visual" },
    ]);
    expect(result).toEqual([
      { category: "career_interest", value: "Product Design" },
      { category: "learning_style", value: "Visual" },
    ]);
  });

  it("caps the number of candidates from a single turn", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ category: "question_topic", value: `Topic ${i}` }));
    const result = buildMemoryCandidates(many);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
