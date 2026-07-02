import { describe, expect, it } from "vitest";
import {
  buildAnswerOutcomePairs,
  computeOutcomeCorrelation,
  CORRELATION_MIN_SAMPLE,
  describeCorrelation,
  MIN_ANSWER_SAMPLE,
  type AnswerOutcomePair,
} from "./question-correlation";

function pairs(spec: Array<[string, string]>): AnswerOutcomePair[] {
  return spec.map(([answer, outcome]) => ({ answer, outcome }));
}

describe("computeOutcomeCorrelation — answer choice correlation to final profile", () => {
  it("finds a strong predictor: one answer's dominant outcome far exceeds its baseline share", () => {
    // 20 respondents total. TECH is the outcome for 10/20 = 50% baseline.
    // Everyone who picked "D" (5 people) got TECH — 100% within that
    // answer vs 50% baseline → lift 2.0. "A" (15 people) splits toward BUS
    // at a much weaker lift (66.7% / 50% baseline BUS = 1.33x), so D is
    // unambiguously the stronger predictor — no rarer-outcome distractor
    // that could out-lift it by virtue of a smaller baseline share alone.
    const data = pairs([
      ...Array(5).fill(["D", "TECH"]),
      ...Array(5).fill(["A", "TECH"]),
      ...Array(10).fill(["A", "BUS"]),
    ] as Array<[string, string]>);

    const result = computeOutcomeCorrelation(data, "topCluster");
    expect(result.strongestAnswer).toBe("D");
    expect(result.strongestOutcome).toBe("TECH");
    expect(result.strongestLift).toBe(2);

    const summary = describeCorrelation("Question 5", result);
    expect(summary).toContain("Question 5");
    expect(summary).toContain("TECH");
    expect(summary).toMatch(/strongly predicts/);
  });
});

describe("computeOutcomeCorrelation — weak/no correlation", () => {
  it("reports a lift near 1.0 when every answer produces roughly the baseline distribution", () => {
    // Both answers split 50/50 between TECH and BUS — same as the overall
    // baseline, so neither answer carries extra information.
    const data = pairs([
      ...Array(5).fill(["A", "TECH"]),
      ...Array(5).fill(["A", "BUS"]),
      ...Array(5).fill(["B", "TECH"]),
      ...Array(5).fill(["B", "BUS"]),
    ] as Array<[string, string]>);

    const result = computeOutcomeCorrelation(data, "topCluster");
    expect(result.strongestLift).toBeCloseTo(1, 1);
    expect(describeCorrelation("Question 18", result)).toMatch(
      /almost no predictive value/,
    );
  });
});

describe("computeOutcomeCorrelation — missing final result", () => {
  it("buildAnswerOutcomePairs drops rows with no result at all", () => {
    const rows = [
      { answers: { Q5: "D" }, result: { topCluster: "TECH" } },
      { answers: { Q5: "D" }, result: null }, // started, never completed/scored
    ];
    const built = buildAnswerOutcomePairs(rows, "Q5", "topCluster");
    expect(built).toEqual([{ answer: "D", outcome: "TECH" }]);
  });

  it("buildAnswerOutcomePairs drops rows whose result has no value for this outcome field", () => {
    // e.g. a Custom-assessment result shape with no topCluster at all.
    const rows = [
      { answers: { Q5: "D" }, result: { archetype: "Explorer" } },
      { answers: { Q5: "D" }, result: { topCluster: "TECH" } },
    ];
    const built = buildAnswerOutcomePairs(rows, "Q5", "topCluster");
    expect(built).toEqual([{ answer: "D", outcome: "TECH" }]);
  });
});

describe("computeOutcomeCorrelation — low sample size", () => {
  it("returns no correlation below CORRELATION_MIN_SAMPLE overall respondents", () => {
    const data = pairs(
      Array.from({ length: CORRELATION_MIN_SAMPLE - 1 }, () => ["A", "TECH"] as [string, string]),
    );
    const result = computeOutcomeCorrelation(data, "topCluster");
    expect(result.perAnswer).toEqual([]);
    expect(result.strongestLift).toBeNull();
    expect(describeCorrelation("Question 1", result)).toMatch(/not enough data/);
  });

  it("scores normally right at the minimum overall sample size", () => {
    const data = pairs(
      Array.from({ length: CORRELATION_MIN_SAMPLE }, () => ["A", "TECH"] as [string, string]),
    );
    expect(computeOutcomeCorrelation(data, "topCluster").perAnswer.length).toBeGreaterThan(0);
  });

  it("excludes an individual answer from strongestLift if too few people picked it, even with enough total respondents", () => {
    // 20 total (over CORRELATION_MIN_SAMPLE), but only 2 picked "D" —
    // below MIN_ANSWER_SAMPLE — so even a perfect 100%-TECH result for D
    // must not become the reported strongest predictor.
    expect(MIN_ANSWER_SAMPLE).toBeGreaterThan(2);
    const data = pairs([
      ...Array(2).fill(["D", "TECH"]), // too small a sample on its own
      ...Array(9).fill(["A", "TECH"]),
      ...Array(9).fill(["A", "BUS"]),
    ] as Array<[string, string]>);

    const result = computeOutcomeCorrelation(data, "topCluster");
    const dBreakdown = result.perAnswer.find((a) => a.answer === "D");
    expect(dBreakdown?.dominantSharePct).toBe(100); // still reported...
    expect(result.strongestAnswer).not.toBe("D"); // ...but not "the finding"
  });
});

describe("computeOutcomeCorrelation — ties", () => {
  it("breaks a tie in dominant outcome deterministically by first-seen order", () => {
    // Within answer "A": 5 TECH then 5 BUS — exact tie. TECH was seen
    // first in the input order, so it wins deterministically.
    const data = pairs([
      ...Array(5).fill(["A", "TECH"]),
      ...Array(5).fill(["A", "BUS"]),
      ...Array(10).fill(["B", "ART"]),
    ] as Array<[string, string]>);

    const result = computeOutcomeCorrelation(data, "topCluster");
    const aBreakdown = result.perAnswer.find((a) => a.answer === "A");
    expect(aBreakdown?.dominantOutcome).toBe("TECH");

    // Re-running with the same input must reproduce the identical tie-break.
    const again = computeOutcomeCorrelation(data, "topCluster");
    expect(again.perAnswer.find((a) => a.answer === "A")?.dominantOutcome).toBe("TECH");
  });

  it("breaks a strongestLift tie by larger sample size (perAnswer sort order)", () => {
    // "A" (10 people) and "B" (10 people) end up with the identical lift —
    // both fully deterministic given equal sample sizes and outcomes.
    const data = pairs([
      ...Array(10).fill(["A", "TECH"]),
      ...Array(10).fill(["B", "BUS"]),
      ...Array(10).fill(["C", "TECH"]),
      ...Array(10).fill(["C", "BUS"]),
    ] as Array<[string, string]>);

    const result = computeOutcomeCorrelation(data, "topCluster");
    // Deterministic: re-running produces the exact same winner every time.
    const again = computeOutcomeCorrelation(data, "topCluster");
    expect(again.strongestAnswer).toBe(result.strongestAnswer);
    expect(again.strongestLift).toBe(result.strongestLift);
  });
});

describe("buildAnswerOutcomePairs — invalid/missing question_id", () => {
  it("skips rows whose answers blob has no entry for the given external_id", () => {
    const rows = [
      { answers: { Q1: "A" }, result: { topCluster: "TECH" } }, // no Q5 at all
      { answers: { Q5: "D" }, result: { topCluster: "TECH" } },
    ];
    const built = buildAnswerOutcomePairs(rows, "Q5", "topCluster");
    expect(built).toEqual([{ answer: "D", outcome: "TECH" }]);
  });

  it("returns an empty array when the question_id matches nothing in any row", () => {
    const rows = [
      { answers: { Q1: "A" }, result: { topCluster: "TECH" } },
      { answers: { Q2: "B" }, result: { topCluster: "BUS" } },
    ];
    expect(buildAnswerOutcomePairs(rows, "Q999-does-not-exist", "topCluster")).toEqual([]);
  });

  it("skips a row with a null answers blob entirely", () => {
    const rows = [{ answers: null, result: { topCluster: "TECH" } }];
    expect(buildAnswerOutcomePairs(rows, "Q5", "topCluster")).toEqual([]);
  });

  it("skips a row whose answer value for this question is not a string", () => {
    const rows = [{ answers: { Q5: 42 }, result: { topCluster: "TECH" } }];
    expect(buildAnswerOutcomePairs(rows, "Q5", "topCluster")).toEqual([]);
  });
});
