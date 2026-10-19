import { describe, expect, it } from "vitest";
import {
  CORE_ASSESSMENT_QUESTIONS,
  coreAnswersFromLetters,
  isCoreQuestionSet,
} from "./assessment";
import { coreBank } from "./content/core-content";
import { scoreCore } from "./scoring";
import { CURIOSITY_CODES } from "./types";

function answerEvery(letter: (index: number, optionCount: number) => string) {
  return Object.fromEntries(
    CORE_ASSESSMENT_QUESTIONS.map((question, i) => [
      question.externalId,
      letter(i, question.options.length),
    ]),
  );
}

describe("question set 5.2 in the assessment", () => {
  it("has 46 questions in part order (spec §2)", () => {
    expect(CORE_ASSESSMENT_QUESTIONS).toHaveLength(46);
    const parts = CORE_ASSESSMENT_QUESTIONS.map((q) => q.pillar);
    expect(parts).toEqual([...parts].sort());
    expect(isCoreQuestionSet(CORE_ASSESSMENT_QUESTIONS)).toBe(true);
  });

  it("turns any complete set of answers into totals the scorer accepts", () => {
    const answers = coreAnswersFromLetters(answerEvery(() => "A"));
    expect(answers.curiosities).toHaveLength(16);
    expect(answers.motivators).toHaveLength(14);
    expect(answers.axes).toHaveLength(16);

    const result = scoreCore(answers);
    const total = Object.values(result.curiosityCounts).reduce(
      (a, b) => a + b,
      0,
    );
    expect(total).toBe(16);
  });

  it("scores by what an option counts toward, not by its letter", () => {
    const first = coreAnswersFromLetters(answerEvery(() => "A"));
    const last = coreAnswersFromLetters(
      answerEvery((_, count) => (count === 2 ? "B" : "D")),
    );
    expect(first.curiosities).not.toEqual(last.curiosities);
  });

  it("refuses an incomplete attempt (spec §3.1)", () => {
    const answers = answerEvery(() => "A");
    delete answers["P3-05"];
    expect(() => coreAnswersFromLetters(answers)).toThrow(/P3-05/);
  });
});

describe("career bank v1.1", () => {
  const bank = coreBank("en");

  it("has 76 families of 4 jobs (file 05 shape)", () => {
    expect(bank.families).toHaveLength(76);
    for (const family of bank.families) expect(family.jobs).toHaveLength(4);
  });

  it("has six single families per curiosity and one meet family per pair", () => {
    for (const code of CURIOSITY_CODES) {
      const singles = bank.families.filter(
        (f) => f.curiosities.length === 1 && f.curiosities[0] === code,
      );
      expect(singles).toHaveLength(6);
    }
    const pairs = new Set(
      bank.families
        .filter((f) => f.curiosities.length === 2)
        .map((f) => [...f.curiosities].sort().join("-")),
    );
    expect(pairs.size).toBe(28);
  });

  it("has Arabic family, study-field and job names with no Latin letters (step 9.4)", () => {
    const ar = coreBank("ar");
    for (const family of ar.families) {
      expect(family.name).not.toMatch(/[A-Za-z]/);
      for (const field of family.studyFields) expect(field).not.toMatch(/[A-Za-z]/);
      for (const job of family.jobs) expect(job.name, job.id).not.toMatch(/[A-Za-z]/);
    }
  });

  it("marks exactly six jobs as changing work", () => {
    const changing = coreBank("en").families.flatMap((f) => f.jobs).filter((j) => j.isChangingWork);
    expect(changing).toHaveLength(6);
  });
});
