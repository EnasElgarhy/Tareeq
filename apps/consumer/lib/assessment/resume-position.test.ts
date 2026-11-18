import { describe, expect, it } from "vitest";
import { resumePosition } from "./resume-position";

// 50 screens in all: 4 About you questions, then the 46 counted ones.
const TOTAL = 50;
const COUNTED = 46;

describe("resumePosition", () => {
  it("says About you while the student is still in it", () => {
    expect(resumePosition(1, TOTAL, COUNTED)).toEqual({ inAboutYou: true, current: 0, total: 46 });
    expect(resumePosition(4, TOTAL, COUNTED)).toEqual({ inAboutYou: true, current: 0, total: 46 });
  });

  it("counts only the assessment questions after About you", () => {
    expect(resumePosition(5, TOTAL, COUNTED)).toEqual({ inAboutYou: false, current: 1, total: 46 });
    expect(resumePosition(10, TOTAL, COUNTED)).toEqual({ inAboutYou: false, current: 6, total: 46 });
    expect(resumePosition(50, TOTAL, COUNTED)).toEqual({ inAboutYou: false, current: 46, total: 46 });
  });

  it("treats a flow without About you as all counted", () => {
    expect(resumePosition(3, 40, 40)).toEqual({ inAboutYou: false, current: 3, total: 40 });
  });
});
