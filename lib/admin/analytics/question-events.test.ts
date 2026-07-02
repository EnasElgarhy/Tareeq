import { describe, expect, it } from "vitest";
import {
  computeAnswerDistribution,
  computeQuestionMetrics,
  computeSessionFinalAnswers,
  computeTimeStats,
  type QuestionEventRecord,
} from "./question-events";

function event(
  eventName: string,
  sessionId: string,
  occurredAt: string,
  metadata: Record<string, unknown> = {},
): QuestionEventRecord {
  return { eventName, sessionId, occurredAt, metadata };
}

describe("computeTimeStats", () => {
  it("returns nulls for no samples", () => {
    expect(computeTimeStats([])).toEqual({
      avgMs: null,
      medianMs: null,
      fastestMs: null,
      slowestMs: null,
      sampleCount: 0,
    });
  });

  it("computes avg/median/fastest/slowest from question_time_spent events", () => {
    const events = [10_000, 20_000, 30_000, 40_000].map((ms, i) =>
      event("question_time_spent", `s${i}`, `2026-07-01T00:0${i}:00Z`, { timeSpentMs: ms }),
    );
    const stats = computeTimeStats(events);
    expect(stats.avgMs).toBe(25_000);
    expect(stats.medianMs).toBe(25_000);
    expect(stats.fastestMs).toBe(10_000);
    expect(stats.slowestMs).toBe(40_000);
    expect(stats.sampleCount).toBe(4);
  });

  it("computes the median correctly for an odd sample count", () => {
    const events = [5_000, 15_000, 45_000].map((ms, i) =>
      event("question_time_spent", `s${i}`, `2026-07-01T00:0${i}:00Z`, { timeSpentMs: ms }),
    );
    expect(computeTimeStats(events).medianMs).toBe(15_000);
  });

  it("ignores events from other question event names", () => {
    const events = [
      event("question_viewed", "s1", "2026-07-01T00:00:00Z"),
      event("question_time_spent", "s1", "2026-07-01T00:01:00Z", { timeSpentMs: 12_000 }),
    ];
    const stats = computeTimeStats(events);
    expect(stats.sampleCount).toBe(1);
    expect(stats.avgMs).toBe(12_000);
  });

  it("ignores malformed/negative time values", () => {
    const events = [
      event("question_time_spent", "s1", "2026-07-01T00:00:00Z", { timeSpentMs: "oops" }),
      event("question_time_spent", "s2", "2026-07-01T00:01:00Z", { timeSpentMs: -5 }),
      event("question_time_spent", "s3", "2026-07-01T00:02:00Z", { timeSpentMs: 9_000 }),
    ];
    const stats = computeTimeStats(events);
    expect(stats.sampleCount).toBe(1);
    expect(stats.avgMs).toBe(9_000);
  });
});

describe("computeSessionFinalAnswers / computeAnswerDistribution", () => {
  it("takes each session's latest answer, not every answer event", () => {
    const events = [
      event("question_answered", "s1", "2026-07-01T00:00:00Z", { selectedAnswer: "A" }),
      event("question_answer_changed", "s1", "2026-07-01T00:01:00Z", { selectedAnswer: "B" }),
      event("question_answered", "s2", "2026-07-01T00:00:00Z", { selectedAnswer: "B" }),
    ];
    const finals = computeSessionFinalAnswers(events);
    expect(finals.get("s1")).toBe("B");
    expect(finals.get("s2")).toBe("B");
    expect(computeAnswerDistribution(events)).toEqual({ B: 2 });
  });

  it("is not fooled by out-of-order timestamps in the input array", () => {
    const events = [
      event("question_answer_changed", "s1", "2026-07-01T00:05:00Z", { selectedAnswer: "C" }),
      event("question_answered", "s1", "2026-07-01T00:00:00Z", { selectedAnswer: "A" }),
    ];
    expect(computeSessionFinalAnswers(events).get("s1")).toBe("C");
  });

  it("ignores answer events with no selectedAnswer metadata", () => {
    const events = [event("question_answered", "s1", "2026-07-01T00:00:00Z", {})];
    expect(computeAnswerDistribution(events)).toEqual({});
  });

  it("returns an empty distribution for no answer events", () => {
    expect(computeAnswerDistribution([])).toEqual({});
  });
});

describe("computeQuestionMetrics", () => {
  it("returns all nulls/zeros for a question with no events at all", () => {
    const metrics = computeQuestionMetrics([]);
    expect(metrics.views).toBe(0);
    expect(metrics.completionRatePct).toBeNull();
    expect(metrics.dropOffRatePct).toBeNull();
    expect(metrics.answerDistribution).toEqual({});
  });

  it("computes completion rate as completions / views", () => {
    const events = [
      event("question_viewed", "s1", "t"),
      event("question_viewed", "s2", "t"),
      event("question_viewed", "s3", "t"),
      event("question_viewed", "s4", "t"),
      event("question_completed", "s1", "t"),
      event("question_completed", "s2", "t"),
      event("question_completed", "s3", "t"),
    ];
    expect(computeQuestionMetrics(events).completionRatePct).toBe(75);
  });

  it("computes drop-off rate as the complement of completion rate", () => {
    const events = [
      event("question_viewed", "s1", "t"),
      event("question_viewed", "s2", "t"),
      event("question_viewed", "s3", "t"),
      event("question_viewed", "s4", "t"),
      event("question_completed", "s1", "t"),
    ];
    const metrics = computeQuestionMetrics(events);
    expect(metrics.completionRatePct).toBe(25);
    expect(metrics.dropOffRatePct).toBe(75);
  });

  it("does not let completions exceed views produce a negative drop-off", () => {
    // e.g. a completed event surviving from a question later re-viewed —
    // clamp rather than report a nonsensical negative drop-off.
    const events = [
      event("question_viewed", "s1", "t"),
      event("question_completed", "s1", "t"),
      event("question_completed", "s1", "t"),
    ];
    expect(computeQuestionMetrics(events).dropOffRatePct).toBe(0);
  });

  it("computes revisit rate as revisits / views", () => {
    const events = [
      event("question_viewed", "s1", "t"),
      event("question_viewed", "s2", "t"),
      event("question_revisited", "s1", "t2"),
    ];
    expect(computeQuestionMetrics(events).revisitRatePct).toBe(50);
  });

  it("computes answer change rate as changes / distinct answerers", () => {
    const events = [
      event("question_answered", "s1", "t", { selectedAnswer: "A" }),
      event("question_answer_changed", "s1", "t2", { selectedAnswer: "B" }),
      event("question_answered", "s2", "t", { selectedAnswer: "A" }),
    ];
    const metrics = computeQuestionMetrics(events);
    expect(metrics.answers).toBe(2); // 2 distinct sessions answered
    expect(metrics.changes).toBe(1);
    expect(metrics.answerChangeRatePct).toBe(50);
  });

  it("reports skip rate as 0 (not null) when views exist but skips don't", () => {
    const events = [event("question_viewed", "s1", "t")];
    expect(computeQuestionMetrics(events).skipRatePct).toBe(0);
  });

  it("computes abandonment rate as abandonments / views", () => {
    const events = [
      event("question_viewed", "s1", "t"),
      event("question_viewed", "s2", "t"),
      event("question_abandoned", "s2", "t2", { timeSpentMs: 4000 }),
    ];
    expect(computeQuestionMetrics(events).abandonmentRatePct).toBe(50);
  });

  it("aggregates a realistic mixed event stream end to end", () => {
    const events = [
      event("question_viewed", "s1", "2026-07-01T00:00:00Z"),
      event("question_time_spent", "s1", "2026-07-01T00:00:10Z", { timeSpentMs: 10_000, direction: "forward" }),
      event("question_answered", "s1", "2026-07-01T00:00:09Z", { selectedAnswer: "A" }),
      event("question_auto_advanced", "s1", "2026-07-01T00:00:09Z", { selectedAnswer: "A" }),
      event("question_completed", "s1", "2026-07-01T00:00:10Z", { timeSpentMs: 10_000 }),

      event("question_viewed", "s2", "2026-07-01T00:01:00Z"),
      event("question_time_spent", "s2", "2026-07-01T00:01:30Z", { timeSpentMs: 30_000, direction: "back" }),

      event("question_viewed", "s2", "2026-07-01T00:02:00Z"), // shouldn't happen in practice (would be a revisit), included to prove views is a raw count
      event("question_revisited", "s2", "2026-07-01T00:03:00Z"),
      event("question_answered", "s2", "2026-07-01T00:03:05Z", { selectedAnswer: "B" }),
      event("question_time_spent", "s2", "2026-07-01T00:03:20Z", { timeSpentMs: 20_000, direction: "forward" }),
      event("question_completed", "s2", "2026-07-01T00:03:20Z", { timeSpentMs: 20_000 }),
    ];

    const metrics = computeQuestionMetrics(events);
    expect(metrics.views).toBe(3);
    expect(metrics.revisits).toBe(1);
    expect(metrics.answers).toBe(2);
    expect(metrics.completions).toBe(2);
    expect(metrics.time.sampleCount).toBe(3);
    expect(metrics.time.avgMs).toBe(20_000);
    expect(metrics.answerDistribution).toEqual({ A: 1, B: 1 });
  });
});
