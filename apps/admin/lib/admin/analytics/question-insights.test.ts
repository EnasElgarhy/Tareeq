import { describe, expect, it } from "vitest";
import { generateQuestionInsights, type QuestionInsightInput } from "./question-insights";
import type { QuestionMetrics } from "./question-events";
import type { HealthScoreResult } from "./question-health";

function metrics(overrides: Partial<QuestionMetrics> = {}): QuestionMetrics {
  return {
    views: 20,
    revisits: 0,
    answers: 20,
    changes: 0,
    skips: 0,
    completions: 20,
    abandonments: 0,
    completionRatePct: 100,
    dropOffRatePct: 0,
    revisitRatePct: 0,
    skipRatePct: 0,
    abandonmentRatePct: 0,
    answerChangeRatePct: 0,
    time: { avgMs: 10_000, medianMs: 10_000, fastestMs: 8_000, slowestMs: 12_000, sampleCount: 20 },
    answerDistribution: { A: 5, B: 5, C: 5, D: 5 },
    ...overrides,
  };
}

const HEALTHY: HealthScoreResult = {
  score: 90,
  status: "Healthy",
  factors: { completion: 90, time: 90, entropy: 90, changeRate: 90, abandonment: 90 },
};

function q(
  externalId: string,
  label: string,
  metricOverrides: Partial<QuestionMetrics> = {},
  health: HealthScoreResult = HEALTHY,
): QuestionInsightInput {
  return { externalId, label, metrics: metrics(metricOverrides), health };
}

describe("generateQuestionInsights — highest abandonment", () => {
  it("flags the single worst abandonment above threshold", () => {
    const insights = generateQuestionInsights([
      q("Q1", "Question 1", { abandonmentRatePct: 5 }),
      q("Q18", "Question 18", { abandonmentRatePct: 35 }),
      q("Q2", "Question 2", { abandonmentRatePct: 12 }),
    ]);
    const hit = insights.find((i) => i.id.includes("abandonment"));
    expect(hit?.text).toContain("Question 18");
    expect(hit?.text).toContain("35%");
  });

  it("stays silent when no question crosses the abandonment threshold", () => {
    const insights = generateQuestionInsights([
      q("Q1", "Question 1", { abandonmentRatePct: 2 }),
      q("Q2", "Question 2", { abandonmentRatePct: 3 }),
    ]);
    expect(insights.some((i) => i.id.includes("abandonment"))).toBe(false);
  });

  it("ignores questions below the minimum sample size", () => {
    const insights = generateQuestionInsights([
      q("Q1", "Question 1", { views: 2, abandonmentRatePct: 90 }),
    ]);
    expect(insights.some((i) => i.id.includes("abandonment"))).toBe(false);
  });
});

describe("generateQuestionInsights — slow questions", () => {
  it("flags a question that takes 2x+ the group average", () => {
    const insights = generateQuestionInsights([
      q("Q7", "Question 7", {
        time: { avgMs: 40_000, medianMs: 40_000, fastestMs: 35_000, slowestMs: 45_000, sampleCount: 20 },
      }),
      q("Q1", "Question 1", {
        time: { avgMs: 10_000, medianMs: 10_000, fastestMs: 8_000, slowestMs: 12_000, sampleCount: 20 },
      }),
      q("Q2", "Question 2", {
        time: { avgMs: 10_000, medianMs: 10_000, fastestMs: 8_000, slowestMs: 12_000, sampleCount: 20 },
      }),
    ]);
    const hit = insights.find((i) => i.id.includes("slow"));
    expect(hit?.text).toContain("Question 7");
    expect(hit?.text).toMatch(/x longer than average/);
  });

  it("caps slow-question insights at 3 even if many qualify", () => {
    const questions = Array.from({ length: 6 }, (_, i) =>
      q(`Q${i}`, `Question ${i}`, {
        time: { avgMs: 30_000 + i, medianMs: 30_000, fastestMs: 30_000, slowestMs: 30_000, sampleCount: 20 },
      }),
    ).concat(
      Array.from({ length: 3 }, (_, i) =>
        q(`Fast${i}`, `Fast ${i}`, {
          time: { avgMs: 1_000, medianMs: 1_000, fastestMs: 1_000, slowestMs: 1_000, sampleCount: 20 },
        }),
      ),
    );
    const slowInsights = generateQuestionInsights(questions).filter((i) => i.id.includes("slow"));
    expect(slowInsights.length).toBeLessThanOrEqual(3);
  });
});

describe("generateQuestionInsights — dominant answer", () => {
  it("flags a question where one answer dominates", () => {
    const insights = generateQuestionInsights([
      q("Q9", "Question 9", { answerDistribution: { A: 2, B: 18 } }),
    ]);
    const hit = insights.find((i) => i.id.includes("dominant-answer"));
    expect(hit?.text).toContain("90%");
    expect(hit?.text).toContain("B");
    expect(hit?.text).toContain("Question 9");
  });

  it("does not flag a healthy, evenly-spread distribution", () => {
    const insights = generateQuestionInsights([
      q("Q1", "Question 1", { answerDistribution: { A: 5, B: 5, C: 5, D: 5 } }),
    ]);
    expect(insights.some((i) => i.id.includes("dominant-answer"))).toBe(false);
  });
});

describe("generateQuestionInsights — rarely changed", () => {
  it("flags the question with the lowest change rate under the threshold", () => {
    const insights = generateQuestionInsights([
      q("Q12", "Question 12", { answerChangeRatePct: 0 }),
      q("Q1", "Question 1", { answerChangeRatePct: 15 }),
    ]);
    const hit = insights.find((i) => i.id.includes("rarely-changed"));
    expect(hit?.text).toContain("Question 12");
  });
});

describe("generateQuestionInsights — critical health", () => {
  it("surfaces questions flagged Critical by the health score", () => {
    const critical: HealthScoreResult = {
      score: 30,
      status: "Critical",
      factors: { completion: 20, time: 20, entropy: 20, changeRate: 20, abandonment: 20 },
    };
    const insights = generateQuestionInsights([q("Q31", "Question 31", {}, critical)]);
    const hit = insights.find((i) => i.id.includes("critical"));
    expect(hit?.text).toContain("Question 31");
    expect(hit?.text).toContain("Critical");
  });
});

describe("generateQuestionInsights — empty input", () => {
  it("returns an empty array for no questions", () => {
    expect(generateQuestionInsights([])).toEqual([]);
  });
});
