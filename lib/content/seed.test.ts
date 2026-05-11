import { describe, expect, it } from "vitest";
import { clusters, seedQuestions } from "./seed";

function optionsForPillars(pillars: number[]) {
  const options: Array<Record<string, unknown>> = [];

  for (const question of seedQuestions) {
    if (!pillars.includes(question.pillar)) continue;
    for (const option of question.options) {
      options.push(option);
    }
  }

  return options;
}

describe("seed content", () => {
  it("matches the locked assessment contract", () => {
    expect(clusters).toHaveLength(8);
    expect(seedQuestions).toHaveLength(44);

    expect(seedQuestions.filter((q) => q.pillar === 0)).toHaveLength(4);
    expect(seedQuestions.filter((q) => q.pillar === 1)).toHaveLength(16);
    expect(seedQuestions.filter((q) => q.pillar === 2)).toHaveLength(8);
    expect(seedQuestions.filter((q) => q.pillar === 3)).toHaveLength(10);
    expect(seedQuestions.filter((q) => q.pillar === 4)).toHaveLength(6);
  });

  it("keeps option mappings in the expected pillars", () => {
    const optionCount = seedQuestions.reduce(
      (total, question) => total + question.options.length,
      0,
    );

    expect(optionCount).toBe(125);
    expect(
      optionsForPillars([1]).every((option) => "clusterCode" in option),
    ).toBe(true);
    expect(
      optionsForPillars([3]).every((option) => "driverCode" in option),
    ).toBe(true);
    expect(
      optionsForPillars([2, 4]).every((option) => "axisValue" in option),
    ).toBe(true);
  });
});
