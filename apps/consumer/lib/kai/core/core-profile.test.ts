import { describe, expect, it } from "vitest";
import { coreStudentProfile } from "./core-profile";

describe("coreStudentProfile", () => {
  it("maps the background answers to STUDENT_PROFILE", () => {
    expect(coreStudentProfile({ QD1: "B", QD2: "Saudi Arabia", QD3: "A", QD4: "A" })).toEqual({
      gender: "female",
      ageBand: "13-17",
      academicStage: "Final two years of high school",
      country: "Saudi Arabia",
    });
    expect(coreStudentProfile({ QD1: "D", QD3: "C", QD4: "B" })).toMatchObject({
      gender: "male",
      ageBand: "18+",
      academicStage: "University, year 1 or 2",
      country: null,
    });
  });

  it("leaves gender unset for prefer not to say, and unknown answers empty", () => {
    expect(coreStudentProfile({ QD1: "Z", QD3: "", QD4: "C", QD2: "  " })).toEqual({
      gender: null,
      ageBand: null,
      academicStage: null,
      country: null,
    });
  });
});
