import { describe, expect, it } from "vitest";
import {
  type CoverageInput,
  coverageByLocale,
  findMissingTranslations,
} from "./translation-coverage";

const base: CoverageInput = {
  supportedLocales: ["en", "ar"],
  categories: [{ code: "LEAD", name: { en: "Leadership", ar: "القيادة" } }],
  questions: [
    {
      external_id: "Q1",
      title: { en: "What energizes you?", ar: "ما الذي يحفزك؟" },
      options: [
        { letter: "A", text: { en: "Leading", ar: "القيادة" } },
        { letter: "B", text: { en: "Coding" } }, // missing ar
      ],
    },
  ],
  profiles: [{ code: "LEADER", name: { en: "Leader" } }], // missing ar
};

describe("findMissingTranslations", () => {
  it("reports each required field missing a supported locale", () => {
    const gaps = findMissingTranslations(base);
    expect(gaps).toEqual([
      { kind: "option", ref: "Q1/B", field: "text", locale: "ar" },
      { kind: "profile", ref: "LEADER", field: "name", locale: "ar" },
    ]);
  });

  it("returns no gaps when fully translated", () => {
    const gaps = findMissingTranslations({
      ...base,
      questions: [
        {
          external_id: "Q1",
          title: { en: "x", ar: "س" },
          options: [{ letter: "A", text: { en: "a", ar: "أ" } }],
        },
      ],
      profiles: [{ code: "LEADER", name: { en: "Leader", ar: "قائد" } }],
    });
    expect(gaps).toEqual([]);
  });

  it("treats a single-locale assessment (en only) as complete", () => {
    const gaps = findMissingTranslations({ ...base, supportedLocales: ["en"] });
    expect(gaps).toEqual([]);
  });

  it("summarises gaps per locale", () => {
    expect(coverageByLocale(findMissingTranslations(base), ["en", "ar"])).toEqual({
      en: 0,
      ar: 2,
    });
  });
});
