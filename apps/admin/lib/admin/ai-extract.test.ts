import { describe, expect, it } from "vitest";
import { normalizeExtractedDraft } from "./ai-extract";

describe("normalizeExtractedDraft", () => {
  it("normalises a well-formed draft", () => {
    const d = normalizeExtractedDraft({
      detectedLanguage: "en",
      confidence: 0.8,
      categories: [
        { code: "lead", name: { en: "Leadership", ar: "القيادة" } },
        { code: "tech", name: { en: "Technology" } },
      ],
      questions: [
        {
          kind: "single",
          title: { en: "What do you enjoy?", ar: "ماذا تحب؟" },
          options: [
            { letter: "a", text: { en: "Leading" }, categoryCode: "lead", points: 2 },
            { letter: "b", text: { en: "Coding" }, category: "tech", weight: 1 },
          ],
        },
      ],
      profiles: [{ code: "leader", title: { en: "Leader" }, categoryCode: "lead" }],
      rules: [
        {
          resultProfileCode: "leader",
          combinator: "and",
          conditions: [{ cluster: "lead", operator: ">=", value: 2 }],
          priority: 1,
        },
      ],
    });
    expect(d.categories.map((c) => c.code)).toEqual(["LEAD", "TECH"]);
    expect(d.questions[0].options[0]).toMatchObject({ letter: "A", categoryCode: "LEAD", points: 2 });
    expect(d.questions[0].options[1]).toMatchObject({ categoryCode: "TECH", points: 1 }); // `category`/`weight` aliases
    expect(d.profiles[0]).toMatchObject({ code: "LEADER", categoryCode: "LEAD" });
    expect(d.rules[0]).toMatchObject({ resultProfileCode: "LEADER", combinator: "AND" });
    expect(d.confidence).toBe(0.8);
  });

  it("nulls options that map to an unknown category", () => {
    const d = normalizeExtractedDraft({
      categories: [{ code: "LEAD", name: { en: "Leadership" } }],
      questions: [
        { kind: "single", title: { en: "Q" }, options: [{ text: { en: "x" }, categoryCode: "GHOST", points: 1 }] },
      ],
    });
    expect(d.questions[0].options[0].categoryCode).toBeNull();
  });

  it("drops rules referencing an unknown profile or with no valid conditions", () => {
    const d = normalizeExtractedDraft({
      categories: [{ code: "LEAD", name: { en: "L" } }],
      profiles: [{ code: "P", title: { en: "P" } }],
      rules: [
        { resultProfileCode: "GHOST", conditions: [{ cluster: "LEAD", operator: ">=", value: 1 }] },
        { resultProfileCode: "P", conditions: [{ cluster: "PHANTOM", operator: ">=", value: 1 }] },
        { resultProfileCode: "P", conditions: [{ cluster: "LEAD", operator: ">=", value: 1 }] },
      ],
    });
    expect(d.rules).toHaveLength(1);
    expect(d.rules[0].resultProfileCode).toBe("P");
  });

  it("keeps category-vs-category conditions and dedupes categories/profiles", () => {
    const d = normalizeExtractedDraft({
      categories: [
        { code: "LEAD", name: { en: "L" } },
        { code: "LEAD", name: { en: "dup" } },
        { code: "TECH", name: { en: "T" } },
      ],
      profiles: [{ code: "P", title: { en: "P" } }, { code: "P", title: { en: "dup" } }],
      rules: [
        { resultProfileCode: "P", conditions: [{ cluster: "TECH", operator: ">", valueCategory: "LEAD" }] },
      ],
    });
    expect(d.categories).toHaveLength(2);
    expect(d.profiles).toHaveLength(1);
    expect(d.rules[0].conditions[0]).toMatchObject({ cluster: "TECH", valueCategory: "LEAD" });
  });

  it("text questions carry no options; clamps confidence; tolerates garbage", () => {
    const d = normalizeExtractedDraft({
      confidence: 5,
      questions: [{ kind: "text", title: { en: "Reflect" }, options: [{ text: { en: "x" } }] }],
    });
    expect(d.questions[0].options).toEqual([]);
    expect(d.confidence).toBe(1);

    const empty = normalizeExtractedDraft("not an object");
    expect(empty).toMatchObject({ categories: [], questions: [], profiles: [], rules: [] });
  });
});
