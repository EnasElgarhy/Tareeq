import { describe, expect, it } from "vitest";
import {
  ABOUT_YOU_PATH,
  assessmentCounter,
  DIVIDER_PATH,
  END_PATH,
  firstQuestionOfPart,
  partIntroPath,
  pathAfterQuestion,
  pathBeforePart,
  pathBeforeQuestion,
} from "./flow";

type Pillar = 0 | 1 | 2 | 3 | 4;
const run = (pillar: Pillar, count: number) => Array.from({ length: count }, () => ({ pillar }));
/** 4 About you, then parts of 16, 8, 14 and 8. */
const CORE = [...run(0, 4), ...run(1, 16), ...run(2, 8), ...run(3, 14), ...run(4, 8)];
const OLD = [...run(0, 4), ...run(1, 3)];

describe("pathAfterQuestion", () => {
  it("moves through About you, then to the dividing page", () => {
    expect(pathAfterQuestion(0, CORE)).toBe("/q/1");
    expect(pathAfterQuestion(3, CORE)).toBe(DIVIDER_PATH);
  });

  it("stops at each part's intro", () => {
    expect(pathAfterQuestion(19, CORE)).toBe(partIntroPath(2));
    expect(pathAfterQuestion(27, CORE)).toBe(partIntroPath(3));
    expect(pathAfterQuestion(41, CORE)).toBe(partIntroPath(4));
  });

  it("ends on the end screen", () => {
    expect(pathAfterQuestion(49, CORE)).toBe(END_PATH);
  });

  it("leaves older question sets running straight through", () => {
    expect(pathAfterQuestion(3, OLD)).toBe("/q/4");
    expect(pathAfterQuestion(6, OLD)).toBe("/register");
  });
});

describe("back navigation", () => {
  it("returns to the opening screen, the intro or the previous question", () => {
    expect(pathBeforeQuestion(0, CORE)).toBe(ABOUT_YOU_PATH);
    expect(pathBeforeQuestion(2, CORE)).toBe("/q/1");
    expect(pathBeforeQuestion(4, CORE)).toBe(partIntroPath(1));
    expect(pathBeforeQuestion(20, CORE)).toBe(partIntroPath(2));
  });

  it("goes from a part intro to the last screen before it", () => {
    expect(pathBeforePart(1, CORE)).toBe(DIVIDER_PATH);
    expect(pathBeforePart(2, CORE)).toBe("/q/19");
  });
});

describe("firstQuestionOfPart", () => {
  it("finds each part's start", () => {
    expect([1, 2, 3, 4].map((part) => firstQuestionOfPart(part, CORE))).toEqual([4, 20, 28, 42]);
  });
});

describe("assessmentCounter", () => {
  it("counts only the 46 assessment questions", () => {
    expect(assessmentCounter(4, CORE)).toEqual({ current: 1, total: 46 });
    expect(assessmentCounter(49, CORE)).toEqual({ current: 46, total: 46 });
  });

  it("shows no counter on About you", () => {
    expect(assessmentCounter(0, CORE)).toBeNull();
    expect(assessmentCounter(3, CORE)).toBeNull();
  });
});
