import { describe, expect, it } from "vitest";
import {
  describeBackgroundAnswer,
  labelBackgroundAnswers,
} from "./background-answers";

describe("describeBackgroundAnswer", () => {
  it("reads the 6 Nov option IDs", () => {
    expect(describeBackgroundAnswer("QD1", "AGE-16-17")).toEqual({
      question: "Age",
      answer: "16–17",
    });
    expect(describeBackgroundAnswer("QD2b", "QD2b-Y")).toEqual({
      question: "Citizen of that country",
      answer: "Yes",
    });
    expect(describeBackgroundAnswer("QD3", "QD3-B")).toEqual({
      question: "Stage of study",
      answer: "Grade 9 or 10 (Year 10 or 11)",
    });
    expect(describeBackgroundAnswer("QD4", "QD4-F")).toEqual({
      question: "Gender",
      answer: "Female",
    });
  });

  it("reads question set 5.2 letters saved before 6 Nov", () => {
    expect(describeBackgroundAnswer("QD1", "E")?.answer).toBe("22 or older");
    expect(describeBackgroundAnswer("QD3", "A")?.answer).toBe("Middle school");
    expect(describeBackgroundAnswer("QD3", "G")?.answer).toBe(
      "Not currently studying",
    );
    expect(describeBackgroundAnswer("QD4", "B")?.answer).toBe("Male");
  });

  it("shows the country as typed", () => {
    expect(describeBackgroundAnswer("QD2", "Jordan")).toEqual({
      question: "Country",
      answer: "Jordan",
    });
  });

  it("keeps an unknown value visible rather than hiding it", () => {
    expect(describeBackgroundAnswer("QD3", "QD3-Z")).toEqual({
      question: "Stage of study",
      answer: "QD3-Z",
    });
  });

  it("ignores keys that aren't background questions", () => {
    expect(describeBackgroundAnswer("P1-01", "A")).toBeNull();
  });

  it("labels only the About you rows of a decoded attempt", () => {
    const rows = labelBackgroundAnswers([
      {
        itemId: "QD1",
        pillar: null,
        stem: "QD1",
        letter: "AGE-13-15",
        optionId: null,
        code: null,
        codeName: null,
        answerText: null,
      },
      {
        itemId: "P1-01",
        pillar: "P1",
        stem: "Sports day",
        letter: "A",
        optionId: "P1-01-A",
        code: "RD",
        codeName: "Research",
        answerText: "Posters",
      },
    ] as Parameters<typeof labelBackgroundAnswers>[0]);
    expect(rows[0]).toMatchObject({
      stem: "Age",
      answerText: "13–15",
      letter: "AGE-13-15",
    });
    expect(rows[1]).toMatchObject({
      stem: "Sports day",
      answerText: "Posters",
    });
  });
});
