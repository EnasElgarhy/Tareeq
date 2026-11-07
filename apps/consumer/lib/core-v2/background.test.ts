import { describe, expect, it } from "vitest";
import { ageGroupOf, CORE_BACKGROUND_QUESTIONS } from "./background";

describe("the About you questions", () => {
  it("runs age, country, stage, gender", () => {
    expect(CORE_BACKGROUND_QUESTIONS.map((q) => q.externalId)).toEqual(["QD1", "QD2", "QD3", "QD4"]);
  });

  it("offers six age bands, eight stages and two genders", () => {
    const counts = CORE_BACKGROUND_QUESTIONS.map((q) => q.options.length);
    expect(counts).toEqual([6, 0, 8, 2]);
  });

  it("has Arabic for every question and option", () => {
    for (const question of CORE_BACKGROUND_QUESTIONS) {
      expect(question.title.ar).toBeTruthy();
      for (const option of question.options) expect(option.text.ar).toBeTruthy();
    }
  });
});

describe("ageGroupOf", () => {
  it("treats 13 to 17 as under 18 and 18 up as adult", () => {
    expect(ageGroupOf("AGE-13-15")).toBe("minor");
    expect(ageGroupOf("AGE-16-17")).toBe("minor");
    expect(ageGroupOf("AGE-18-19")).toBe("adult");
    expect(ageGroupOf("AGE-22P")).toBe("adult");
  });

  it("still reads attempts saved with the old options", () => {
    expect(ageGroupOf("B")).toBe("minor");
    expect(ageGroupOf("C")).toBe("adult");
  });

  it("does not guess", () => {
    expect(ageGroupOf(undefined)).toBe("unknown");
    expect(ageGroupOf("AGE-U13")).toBe("unknown");
  });
});
