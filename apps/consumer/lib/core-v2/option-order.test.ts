import { describe, expect, it } from "vitest";
import { positionLetter, shuffledFor } from "./option-order";

const OPTIONS = ["A", "B", "C", "D"];

describe("shuffledFor", () => {
  it("keeps every option", () => {
    expect([...shuffledFor(OPTIONS, "attempt", "P1-01")].sort()).toEqual(OPTIONS);
  });

  it("gives a student the same order when they return to a question", () => {
    expect(shuffledFor(OPTIONS, "attempt", "P1-01")).toEqual(shuffledFor(OPTIONS, "attempt", "P1-01"));
  });

  it("varies between students and between questions", () => {
    const byStudent = new Set(
      Array.from({ length: 40 }, (_, i) => shuffledFor(OPTIONS, `student-${i}`, "P1-01").join("")),
    );
    const byQuestion = new Set(
      Array.from({ length: 40 }, (_, i) => shuffledFor(OPTIONS, "student", `P1-${i}`).join("")),
    );
    expect(byStudent.size).toBeGreaterThan(8);
    expect(byQuestion.size).toBeGreaterThan(8);
  });

  it("puts each option first about equally often", () => {
    const first: Record<string, number> = {};
    for (let i = 0; i < 2000; i += 1) {
      const top = shuffledFor(OPTIONS, `student-${i}`, "P3-02")[0] as string;
      first[top] = (first[top] ?? 0) + 1;
    }
    for (const option of OPTIONS) expect(first[option]).toBeGreaterThan(400);
  });

  it("does not change the list it is given", () => {
    const list = [...OPTIONS];
    shuffledFor(list, "attempt", "P1-01");
    expect(list).toEqual(OPTIONS);
  });
});

describe("positionLetter", () => {
  it("labels by position on screen", () => {
    expect([0, 1, 2, 3].map(positionLetter)).toEqual(["A", "B", "C", "D"]);
  });
});
