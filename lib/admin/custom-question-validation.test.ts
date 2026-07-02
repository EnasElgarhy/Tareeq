import { describe, expect, it } from "vitest";
import {
  type CustomQuestionInput,
  validateCustomQuestion,
} from "./custom-question-validation";

const CATEGORIES = ["LEAD", "ANALYTIC"];

function q(overrides: Partial<CustomQuestionInput> = {}): CustomQuestionInput {
  return {
    kind: "single",
    title: { en: "What do you enjoy?", ar: "ماذا تستمتع؟" },
    options: [
      { letter: "A", text: { en: "Leading", ar: "القيادة" }, categoryCode: "LEAD", points: 2 },
      { letter: "B", text: { en: "Analysing", ar: "التحليل" }, categoryCode: "ANALYTIC", points: 2 },
    ],
    ...overrides,
  };
}

describe("validateCustomQuestion", () => {
  it("accepts a well-formed bilingual single-choice question", () => {
    expect(validateCustomQuestion(q(), CATEGORIES)).toEqual([]);
  });

  it("requires a non-empty English title", () => {
    expect(validateCustomQuestion(q({ title: { en: "  ", ar: "نص" } }), CATEGORIES)).toContain(
      "English title is required.",
    );
  });

  it("allows a missing Arabic title (EN is the only hard requirement)", () => {
    expect(validateCustomQuestion(q({ title: { en: "Only English" } }), CATEGORIES)).toEqual([]);
  });

  it("rejects duplicate answer letters", () => {
    const input = q({
      options: [
        { letter: "A", text: { en: "x" }, categoryCode: "LEAD", points: 1 },
        { letter: "A", text: { en: "y" }, categoryCode: "ANALYTIC", points: 1 },
      ],
    });
    expect(validateCustomQuestion(input, CATEGORIES)).toContain(
      "Answer letters must be unique.",
    );
  });

  it("requires at least 2 answers for single choice", () => {
    const input = q({ options: [{ letter: "A", text: { en: "x" }, categoryCode: "LEAD", points: 1 }] });
    expect(validateCustomQuestion(input, CATEGORIES)).toContain(
      "A single-choice question needs at least 2 answers.",
    );
  });

  it("requires exactly 2 answers for binary", () => {
    const three = q({
      kind: "binary",
      options: [
        { letter: "A", text: { en: "x" }, categoryCode: "LEAD", points: 1 },
        { letter: "B", text: { en: "y" }, categoryCode: "ANALYTIC", points: 1 },
        { letter: "C", text: { en: "z" }, categoryCode: "LEAD", points: 1 },
      ],
    });
    expect(validateCustomQuestion(three, CATEGORIES)).toContain(
      "A binary question needs exactly 2 answers.",
    );
  });

  it("rejects scoring mappings that reference an unknown category", () => {
    const input = q({
      options: [
        { letter: "A", text: { en: "x" }, categoryCode: "GHOST", points: 1 },
        { letter: "B", text: { en: "y" }, categoryCode: "LEAD", points: 1 },
      ],
    });
    expect(validateCustomQuestion(input, CATEGORIES)).toContain(
      'Answer A: unknown category "GHOST".',
    );
  });

  it("allows a null category (unscored answer)", () => {
    const input = q({
      options: [
        { letter: "A", text: { en: "x" }, categoryCode: null, points: 0 },
        { letter: "B", text: { en: "y" }, categoryCode: "LEAD", points: 1 },
      ],
    });
    expect(validateCustomQuestion(input, CATEGORIES)).toEqual([]);
  });

  it("rejects non-positive or non-finite points on a scored answer", () => {
    const input = q({
      options: [
        { letter: "A", text: { en: "x" }, categoryCode: "LEAD", points: 0 },
        { letter: "B", text: { en: "y" }, categoryCode: "ANALYTIC", points: Number.NaN },
      ],
    });
    const errors = validateCustomQuestion(input, CATEGORIES);
    expect(errors).toContain("Answer A: a scored answer needs points greater than 0.");
    expect(errors).toContain("Answer B: a scored answer needs points greater than 0.");
  });

  it("ignores points on an unscored answer (no category)", () => {
    const input = q({
      options: [
        { letter: "A", text: { en: "Neutral" }, categoryCode: null, points: 0 },
        { letter: "B", text: { en: "y" }, categoryCode: "LEAD", points: 2 },
      ],
    });
    expect(validateCustomQuestion(input, CATEGORIES)).toEqual([]);
  });

  it("requires English text on each answer", () => {
    const input = q({
      options: [
        { letter: "A", text: { ar: "عربي فقط" }, categoryCode: "LEAD", points: 1 },
        { letter: "B", text: { en: "y" }, categoryCode: "ANALYTIC", points: 1 },
      ],
    });
    expect(validateCustomQuestion(input, CATEGORIES)).toContain(
      "Answer A: English text is required.",
    );
  });

  it("skips answer/scoring checks for text questions", () => {
    expect(
      validateCustomQuestion({ kind: "text", title: { en: "Reflect" }, options: [] }, CATEGORIES),
    ).toEqual([]);
  });
});
