import { describe, expect, it } from "vitest";
import { computeQuestionHealth, HEALTH_MIN_SAMPLE } from "./question-health";
import type { QuestionMetrics } from "./question-events";

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

describe("computeQuestionHealth — insufficient data gate", () => {
  it("returns Insufficient Data below the minimum sample size", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ views: HEALTH_MIN_SAMPLE - 1 }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.status).toBe("Insufficient Data");
    expect(result.score).toBeNull();
  });

  it("scores normally right at the minimum sample size", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ views: HEALTH_MIN_SAMPLE }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.status).not.toBe("Insufficient Data");
    expect(result.score).not.toBeNull();
  });
});

describe("computeQuestionHealth — a perfectly healthy question", () => {
  it("scores near 100 and reports Healthy for 100% completion, on-baseline time, even answer spread, no changes/abandonment", () => {
    const result = computeQuestionHealth({
      metrics: metrics(),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.status).toBe("Healthy");
    expect(result.score).toBeGreaterThanOrEqual(95);
  });
});

describe("computeQuestionHealth — a critical question", () => {
  it("scores low and reports Critical for low completion, slow time, degenerate answers, high change/abandonment", () => {
    const result = computeQuestionHealth({
      metrics: metrics({
        completionRatePct: 20,
        answerChangeRatePct: 60,
        abandonmentRatePct: 40,
        time: { avgMs: 40_000, medianMs: 40_000, fastestMs: 35_000, slowestMs: 45_000, sampleCount: 20 },
        answerDistribution: { A: 19, B: 1, C: 0, D: 0 },
      }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.status).toBe("Critical");
    expect(result.score).toBeLessThan(50);
  });
});

describe("computeQuestionHealth — factor behavior", () => {
  it("gives full time credit at or under the baseline", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ time: { avgMs: 5_000, medianMs: 5_000, fastestMs: 5_000, slowestMs: 5_000, sampleCount: 20 } }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.factors.time).toBe(100);
  });

  it("zeroes out time credit at 3x the baseline or slower", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ time: { avgMs: 30_000, medianMs: 30_000, fastestMs: 30_000, slowestMs: 30_000, sampleCount: 20 } }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.factors.time).toBe(0);
  });

  it("scores entropy as 0 when every respondent picks the same answer", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ answerDistribution: { A: 20, B: 0, C: 0, D: 0 } }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.factors.entropy).toBe(0);
  });

  it("scores entropy as 100 when answers are perfectly evenly spread", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ answerDistribution: { A: 5, B: 5, C: 5, D: 5 } }),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.factors.entropy).toBe(100);
  });

  it("drops the entropy factor entirely for free-text questions rather than penalizing them", () => {
    const result = computeQuestionHealth({
      metrics: metrics({ answerDistribution: {} }),
      hasDiscreteAnswers: false,
      optionCount: 0,
      baselineMedianTimeMs: 10_000,
    });
    expect(result.factors.entropy).toBeNull();
    // Should still produce a real score from the remaining factors, not
    // silently null/zero just because one factor was inapplicable.
    expect(result.score).not.toBeNull();
  });

  it("does not let a missing baseline (no assessment-wide time data yet) crash or zero the whole score", () => {
    const result = computeQuestionHealth({
      metrics: metrics(),
      hasDiscreteAnswers: true,
      optionCount: 4,
      baselineMedianTimeMs: null,
    });
    expect(result.factors.time).toBeNull();
    expect(result.score).not.toBeNull();
  });
});
