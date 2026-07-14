import { describe, expect, it } from "vitest";
import { mergeMemoryCandidates, removeMemoryItem } from "@/lib/kai/memory/memory-updater";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";

function emptyProfile(overrides: Partial<KaiMemoryProfile> = {}): KaiMemoryProfile {
  return { items: [], personSummary: "", updatedAt: "2026-07-01T00:00:00.000Z", ...overrides };
}

describe("mergeMemoryCandidates", () => {
  it("adds a new item when nothing matches", () => {
    const result = mergeMemoryCandidates(
      emptyProfile(),
      [{ category: "career_interest", value: "Artificial Intelligence" }],
      undefined,
      "2026-07-02T00:00:00.000Z",
    );
    expect(result.profile.items).toHaveLength(1);
    expect(result.profile.items[0]).toMatchObject({
      category: "career_interest",
      value: "Artificial Intelligence",
    });
    expect(result.created).toHaveLength(1);
    expect(result.updated).toHaveLength(0);
  });

  it("does not duplicate an existing item in the same category (case-insensitive)", () => {
    const current = emptyProfile({
      items: [
        {
          id: "mem-1",
          category: "career_interest",
          value: "Artificial Intelligence",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const result = mergeMemoryCandidates(
      current,
      [{ category: "career_interest", value: "artificial intelligence" }],
      undefined,
      "2026-07-02T00:00:00.000Z",
    );

    expect(result.profile.items).toHaveLength(1);
    expect(result.profile.items[0].id).toBe("mem-1");
    expect(result.profile.items[0].updatedAt).toBe("2026-07-02T00:00:00.000Z");
    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(1);
  });

  it("treats the same value in a different category as a distinct item", () => {
    const current = emptyProfile({
      items: [
        {
          id: "mem-1",
          category: "career_interest",
          value: "Design",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const result = mergeMemoryCandidates(
      current,
      [{ category: "question_topic", value: "Design" }],
      undefined,
      "2026-07-02T00:00:00.000Z",
    );

    expect(result.profile.items).toHaveLength(2);
    expect(result.created).toHaveLength(1);
  });

  it("skips a blank-value candidate", () => {
    const result = mergeMemoryCandidates(emptyProfile(), [{ category: "goal", value: "   " }], undefined);
    expect(result.profile.items).toHaveLength(0);
  });

  it("merges several candidates in one call, some new and some duplicates", () => {
    const current = emptyProfile({
      items: [
        {
          id: "mem-1",
          category: "goal",
          value: "Study abroad",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const result = mergeMemoryCandidates(
      current,
      [
        { category: "goal", value: "Study abroad" },
        { category: "career_interest", value: "Product Design" },
      ],
      undefined,
      "2026-07-02T00:00:00.000Z",
    );

    expect(result.profile.items).toHaveLength(2);
    expect(result.created).toHaveLength(1);
    expect(result.updated).toHaveLength(1);
  });

  it("updates personSummary when provided, capped at 3 paragraphs", () => {
    const result = mergeMemoryCandidates(
      emptyProfile(),
      [],
      ["One.", "Two.", "Three.", "Four."].join("\n\n"),
      "2026-07-02T00:00:00.000Z",
    );
    expect(result.profile.personSummary).toBe(["One.", "Two.", "Three."].join("\n\n"));
  });

  it("leaves personSummary untouched when not provided", () => {
    const current = emptyProfile({ personSummary: "Existing summary." });
    const result = mergeMemoryCandidates(current, [], undefined, "2026-07-02T00:00:00.000Z");
    expect(result.profile.personSummary).toBe("Existing summary.");
  });
});

describe("removeMemoryItem", () => {
  it("removes only the targeted item", () => {
    const current = emptyProfile({
      items: [
        {
          id: "mem-1",
          category: "goal",
          value: "Study abroad",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
        {
          id: "mem-2",
          category: "goal",
          value: "Become entrepreneur",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });

    const next = removeMemoryItem(current, "mem-1", "2026-07-02T00:00:00.000Z");
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe("mem-2");
    expect(next.updatedAt).toBe("2026-07-02T00:00:00.000Z");
  });

  it("is a no-op when the id doesn't exist", () => {
    const current = emptyProfile({
      items: [
        {
          id: "mem-1",
          category: "goal",
          value: "Study abroad",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });
    const next = removeMemoryItem(current, "does-not-exist");
    expect(next.items).toHaveLength(1);
  });
});
