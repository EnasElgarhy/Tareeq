import { describe, expect, it } from "vitest";
import { compareQuestionVersions, type QuestionVersionSnapshot } from "./question-version-comparison";
import type { QuestionMetrics } from "./question-events";
import type { HealthScoreResult } from "./question-health";

function metrics(overrides: Partial<QuestionMetrics> = {}): QuestionMetrics {
  return {
    views: 20,
    revisits: 0,
    answers: 20,
    changes: 0,
    skips: 0,
    completions: 16,
    abandonments: 0,
    completionRatePct: 80,
    dropOffRatePct: 20,
    revisitRatePct: 0,
    skipRatePct: 0,
    abandonmentRatePct: 0,
    answerChangeRatePct: 0,
    time: { avgMs: 20_000, medianMs: 20_000, fastestMs: 15_000, slowestMs: 25_000, sampleCount: 20 },
    answerDistribution: { A: 10, B: 10 },
    ...overrides,
  };
}

const HEALTH: HealthScoreResult = {
  score: 70,
  status: "Needs Review",
  factors: { completion: 80, time: 70, entropy: 70, changeRate: 70, abandonment: 70 },
};

function snapshot(overrides: Partial<QuestionVersionSnapshot> = {}): QuestionVersionSnapshot {
  return {
    versionLabel: "v3",
    title: { en: "How do you prefer to learn?" },
    options: [
      { letter: "A", text: { en: "By reading" } },
      { letter: "B", text: { en: "By doing" } },
    ],
    metrics: metrics(),
    health: HEALTH,
    ...overrides,
  };
}

describe("compareQuestionVersions — wording diff", () => {
  it("detects an unchanged title and options", () => {
    const result = compareQuestionVersions(snapshot(), snapshot({ versionLabel: "v4" }));
    expect(result.wording.titleChanged).toBe(false);
    expect(result.wording.optionsChanged).toBe(false);
  });

  it("detects a changed title", () => {
    const result = compareQuestionVersions(
      snapshot(),
      snapshot({ versionLabel: "v4", title: { en: "How do you like to learn new things?" } }),
    );
    expect(result.wording.titleChanged).toBe(true);
    expect(result.wording.oldTitle.en).toBe("How do you prefer to learn?");
    expect(result.wording.newTitle.en).toBe("How do you like to learn new things?");
  });

  it("detects changed option text without a title change", () => {
    const result = compareQuestionVersions(
      snapshot(),
      snapshot({
        versionLabel: "v4",
        options: [
          { letter: "A", text: { en: "Reading" } },
          { letter: "B", text: { en: "By doing" } },
        ],
      }),
    );
    expect(result.wording.titleChanged).toBe(false);
    expect(result.wording.optionsChanged).toBe(true);
  });

  it("detects a changed option count as an options change", () => {
    const result = compareQuestionVersions(
      snapshot(),
      snapshot({
        versionLabel: "v4",
        options: [
          { letter: "A", text: { en: "By reading" } },
          { letter: "B", text: { en: "By doing" } },
          { letter: "C", text: { en: "By discussing" } },
        ],
      }),
    );
    expect(result.wording.optionsChanged).toBe(true);
  });

  it("does not flag a change when only whitespace-irrelevant locale ordering differs", () => {
    const result = compareQuestionVersions(
      snapshot({ title: { en: "Same", ar: "نفس الشيء" } }),
      snapshot({ versionLabel: "v4", title: { ar: "نفس الشيء", en: "Same" } }),
    );
    expect(result.wording.titleChanged).toBe(false);
  });
});

describe("compareQuestionVersions — completion rate delta", () => {
  it("reports an improvement when completion rate rises", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ completionRatePct: 60 }) }),
      snapshot({ versionLabel: "v4", metrics: metrics({ completionRatePct: 85 }) }),
    );
    expect(result.completionRate.delta).toBe(25);
    expect(result.completionRate.improved).toBe(true);
  });

  it("reports a regression when completion rate falls", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ completionRatePct: 85 }) }),
      snapshot({ versionLabel: "v4", metrics: metrics({ completionRatePct: 60 }) }),
    );
    expect(result.completionRate.improved).toBe(false);
  });
});

describe("compareQuestionVersions — time spent delta", () => {
  it("treats a time reduction as an improvement (lower is better)", () => {
    const result = compareQuestionVersions(
      snapshot({
        metrics: metrics({
          time: { avgMs: 30_000, medianMs: 30_000, fastestMs: 25_000, slowestMs: 35_000, sampleCount: 20 },
        }),
      }),
      snapshot({
        versionLabel: "v4",
        metrics: metrics({
          time: { avgMs: 15_000, medianMs: 15_000, fastestMs: 10_000, slowestMs: 20_000, sampleCount: 20 },
        }),
      }),
    );
    expect(result.avgTime.delta).toBe(-15_000);
    expect(result.avgTime.improved).toBe(true);
  });

  it("treats a time increase as a regression", () => {
    const result = compareQuestionVersions(
      snapshot({
        metrics: metrics({
          time: { avgMs: 15_000, medianMs: 15_000, fastestMs: 10_000, slowestMs: 20_000, sampleCount: 20 },
        }),
      }),
      snapshot({
        versionLabel: "v4",
        metrics: metrics({
          time: { avgMs: 30_000, medianMs: 30_000, fastestMs: 25_000, slowestMs: 35_000, sampleCount: 20 },
        }),
      }),
    );
    expect(result.avgTime.improved).toBe(false);
  });
});

describe("compareQuestionVersions — drop-off delta", () => {
  it("treats a drop-off reduction as an improvement", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ dropOffRatePct: 40 }) }),
      snapshot({ versionLabel: "v4", metrics: metrics({ dropOffRatePct: 10 }) }),
    );
    expect(result.dropOffRate.delta).toBe(-30);
    expect(result.dropOffRate.improved).toBe(true);
  });
});

describe("compareQuestionVersions — health score delta", () => {
  it("reports the health score change directly", () => {
    const result = compareQuestionVersions(
      snapshot({ health: { ...HEALTH, score: 55 } }),
      snapshot({ versionLabel: "v4", health: { ...HEALTH, score: 80 } }),
    );
    expect(result.healthScore.delta).toBe(25);
    expect(result.healthScore.improved).toBe(true);
  });

  it("handles a null score on either side without crashing", () => {
    const result = compareQuestionVersions(
      snapshot({ health: { score: null, status: "Insufficient Data", factors: { completion: null, time: null, entropy: null, changeRate: null, abandonment: null } } }),
      snapshot({ versionLabel: "v4", health: { ...HEALTH, score: 80 } }),
    );
    expect(result.healthScore.oldValue).toBeNull();
    expect(result.healthScore.delta).toBeNull();
    expect(result.healthScore.improved).toBeNull();
  });
});

describe("compareQuestionVersions — answer distribution delta", () => {
  it("computes the share shift per answer", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ answerDistribution: { A: 15, B: 5 } }) }), // 75% / 25%
      snapshot({ versionLabel: "v4", metrics: metrics({ answerDistribution: { A: 10, B: 10 } }) }), // 50% / 50%
    );
    const a = result.answerDistributionShift.find((d) => d.answer === "A");
    const b = result.answerDistributionShift.find((d) => d.answer === "B");
    expect(a).toEqual({ answer: "A", oldSharePct: 75, newSharePct: 50, deltaPct: -25 });
    expect(b).toEqual({ answer: "B", oldSharePct: 25, newSharePct: 50, deltaPct: 25 });
  });

  it("reports a genuine 0% (not null) for an answer that only exists in one version, since old respondents genuinely couldn't have picked it", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ answerDistribution: { A: 20 } }) }),
      snapshot({ versionLabel: "v4", metrics: metrics({ answerDistribution: { A: 10, C: 10 } }) }),
    );
    const c = result.answerDistributionShift.find((d) => d.answer === "C");
    expect(c?.oldSharePct).toBe(0);
    expect(c?.newSharePct).toBe(50);
    expect(c?.deltaPct).toBe(50);
  });

  it("reports oldSharePct as null (not 0) when the old version had zero respondents at all", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ answerDistribution: {} }) }), // no one answered this version yet
      snapshot({ versionLabel: "v4", metrics: metrics({ answerDistribution: { A: 10, C: 10 } }) }),
    );
    const c = result.answerDistributionShift.find((d) => d.answer === "C");
    expect(c?.oldSharePct).toBeNull(); // genuinely no baseline to compare against
    expect(c?.newSharePct).toBe(50);
    expect(c?.deltaPct).toBeNull();
  });

  it("returns an empty shift list when neither version has any answers yet", () => {
    const result = compareQuestionVersions(
      snapshot({ metrics: metrics({ answerDistribution: {} }) }),
      snapshot({ versionLabel: "v4", metrics: metrics({ answerDistribution: {} }) }),
    );
    expect(result.answerDistributionShift).toEqual([]);
  });
});

describe("compareQuestionVersions — missing data on one side", () => {
  it("does not crash when the new version has no metrics data yet (all-null)", () => {
    const noData = metrics({
      views: 0,
      completionRatePct: null,
      dropOffRatePct: null,
      time: { avgMs: null, medianMs: null, fastestMs: null, slowestMs: null, sampleCount: 0 },
      answerDistribution: {},
    });
    const result = compareQuestionVersions(
      snapshot(),
      snapshot({
        versionLabel: "v4",
        metrics: noData,
        health: { score: null, status: "Insufficient Data", factors: { completion: null, time: null, entropy: null, changeRate: null, abandonment: null } },
      }),
    );
    expect(result.completionRate.newValue).toBeNull();
    expect(result.completionRate.delta).toBeNull();
    expect(result.avgTime.delta).toBeNull();
    expect(result.healthScore.delta).toBeNull();
  });
});
