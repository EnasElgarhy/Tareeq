import { describe, expect, it } from "vitest";
import {
  applyTimingListParams,
  attemptsFromEvents,
  letterToPosition,
  parseTimingListParams,
  partOf,
  responsesFromCoreRows,
  summarizeAttempt,
  type AttemptMeta,
  type AttemptTiming,
  type TimingEventRecord,
} from "@/lib/admin/analytics/timing";
import { buildTimingCsv } from "@/lib/admin/analytics/timing-csv";

const meta = (attemptKey: string, startedAt = "2026-10-20T08:00:00Z"): AttemptMeta => ({
  attemptKey,
  source: "events",
  assessmentId: null,
  respondentName: null,
  versionLabel: "core-5.1",
  startedAt,
  src: null,
  post: null,
});

function event(
  eventName: string,
  questionId: string,
  metadata: Record<string, unknown>,
  { attempt = "a1", at = "2026-10-20T08:00:00Z" } = {},
): TimingEventRecord {
  return {
    eventName,
    assessmentId: attempt,
    assessmentVersion: "core-5.1",
    questionId,
    occurredAt: at,
    metadata,
  };
}

/** One question: an answer letter plus time on screen. */
function answered(questionId: string, ms: number, letter: string, attempt = "a1") {
  return [
    event("question_answered", questionId, { selectedAnswer: letter }, { attempt }),
    event("question_time_spent", questionId, { timeSpentMs: ms, direction: "forward" }, { attempt }),
  ];
}

describe("letterToPosition / partOf", () => {
  it("reads display letters and numbers as 1-based positions", () => {
    expect(letterToPosition("A")).toBe(1);
    expect(letterToPosition("d")).toBe(4);
    expect(letterToPosition("2")).toBe(2);
    expect(letterToPosition("UAE")).toBeNull();
    expect(letterToPosition(undefined)).toBeNull();
  });

  it("takes the part from the pillar, else from the CORE id", () => {
    expect(partOf("P3-07", 3)).toBe(3);
    expect(partOf("P2-01", undefined)).toBe(2);
    expect(partOf("Q5", undefined)).toBeNull();
  });
});

describe("summarizeAttempt", () => {
  it("averages overall and per part and flags a rushed part", () => {
    const summary = summarizeAttempt(meta("a1"), [
      { questionId: "P1-01", part: 1, timeMs: 4000, position: 1 },
      { questionId: "P1-02", part: 1, timeMs: 6000, position: 2 },
      { questionId: "P2-01", part: 2, timeMs: 1000, position: 1 },
      { questionId: "P2-02", part: 2, timeMs: 1500, position: 2 },
      { questionId: "P2-03", part: 2, timeMs: 9000, position: 1 },
    ]);
    expect(summary).not.toBeNull();
    expect(summary?.avgSeconds).toBe(4.3);
    expect(summary?.parts.map((p) => [p.part, p.avgSeconds, p.medianSeconds])).toEqual([
      [1, 5, 5],
      [2, 3.8, 1.5],
    ]);
    expect(summary?.rushedParts).toEqual([2]);
    expect(summary?.samePositionParts).toEqual([]);
    expect(summary?.flagged).toBe(true);
  });

  it("returns null for an attempt with nothing timed", () => {
    expect(summarizeAttempt(meta("a1"), [])).toBeNull();
  });
});

describe("responsesFromCoreRows", () => {
  it("uses only the redo rows for a redone part", () => {
    const row = (question_id: string, part: number, is_redo: boolean, ms: number) => ({
      assessment_id: "x",
      part,
      question_id,
      position_shown: 1,
      time_on_screen_ms: ms,
      is_redo,
    });
    const responses = responsesFromCoreRows([
      row("P1-01", 1, false, 500),
      row("P1-01", 1, true, 4000),
      row("P2-01", 2, false, 3000),
    ]);
    expect(responses.map((r) => [r.questionId, r.timeMs])).toEqual([
      ["P1-01", 4000],
      ["P2-01", 3000],
    ]);
  });
});

describe("attemptsFromEvents", () => {
  it("groups by attempt, sums revisits and uses the final answer's position", () => {
    const events = [
      ...answered("P1-01", 3000, "A"),
      event("question_time_spent", "P1-01", { timeSpentMs: 1000, direction: "back" }),
      event("question_answer_changed", "P1-01", { selectedAnswer: "C" }, { at: "2026-10-20T08:05:00Z" }),
      ...answered("P1-02", 5000, "B"),
      ...answered("P1-01", 800, "A", "a2"),
      ...answered("P1-02", 900, "A", "a2"),
    ];
    const attempts = attemptsFromEvents(events);
    const first = attempts.find((a) => a.attemptKey === "a1");
    const second = attempts.find((a) => a.attemptKey === "a2");

    expect(first?.parts[0]).toMatchObject({ answered: 2, avgSeconds: 4.5 });
    expect(first?.parts[0].flags.largestSamePositionShare).toBe(0.5);
    expect(first?.flagged).toBe(false);
    expect(second?.rushedParts).toEqual([1]);
    expect(second?.samePositionParts).toEqual([1]);
    expect(second?.flagged).toBe(true);
  });

  it("skips events without an attempt id and questions without time", () => {
    const orphan = { ...event("question_time_spent", "P1-01", { timeSpentMs: 100 }), assessmentId: null };
    const answerOnly = event("question_answered", "P1-02", { selectedAnswer: "A" }, { attempt: "a3" });
    expect(attemptsFromEvents([orphan, answerOnly])).toEqual([]);
  });

  it("picks up the attempt's first source and post", () => {
    const events = answered("P1-01", 3000, "A").map((e) => ({
      ...e,
      metadata: { ...e.metadata, src: "instagram", post: "parent-toolkit-1" },
    }));
    expect(attemptsFromEvents(events)[0]).toMatchObject({ src: "instagram", post: "parent-toolkit-1" });
  });
});

describe("list params, filter and sort", () => {
  const make = (key: string, avg: number, flagged: boolean, startedAt: string): AttemptTiming => ({
    ...meta(key, startedAt),
    answered: 10,
    avgSeconds: avg,
    parts: [
      {
        part: 1,
        answered: 10,
        avgSeconds: avg,
        medianSeconds: avg,
        flags: {
          medianMs: avg * 1000,
          largestSamePositionShare: 0.4,
          rushed: flagged,
          samePosition: false,
          flagged,
        },
      },
    ],
    rushedParts: flagged ? [1] : [],
    samePositionParts: [],
    flagged,
  });
  const attempts = [
    make("slow", 9, false, "2026-10-20T08:00:00Z"),
    make("fast", 1.2, true, "2026-10-21T08:00:00Z"),
    make("mid", 4, false, "2026-10-22T08:00:00Z"),
  ];

  it("parses only known values", () => {
    expect(parseTimingListParams({ fast: "only", sort: "avg", dir: "asc" })).toEqual({
      fast: "only",
      sort: "avg",
      dir: "asc",
    });
    expect(parseTimingListParams({ fast: "x", sort: ["drop"], dir: "up" })).toEqual({
      fast: "include",
      sort: "date",
      dir: "desc",
    });
  });

  it("filters to flagged attempts or hides them", () => {
    const keys = (list: AttemptTiming[]) => list.map((a) => a.attemptKey);
    expect(keys(applyTimingListParams(attempts, { fast: "only", sort: "date", dir: "desc" }))).toEqual(["fast"]);
    expect(keys(applyTimingListParams(attempts, { fast: "exclude", sort: "date", dir: "desc" }))).toEqual([
      "mid",
      "slow",
    ]);
  });

  it("sorts by average, by date and puts flagged first", () => {
    const keys = (list: AttemptTiming[]) => list.map((a) => a.attemptKey);
    expect(keys(applyTimingListParams(attempts, { fast: "include", sort: "avg", dir: "asc" }))).toEqual([
      "fast",
      "mid",
      "slow",
    ]);
    expect(keys(applyTimingListParams(attempts, { fast: "include", sort: "date", dir: "desc" }))).toEqual([
      "mid",
      "fast",
      "slow",
    ]);
    expect(keys(applyTimingListParams(attempts, { fast: "include", sort: "flagged", dir: "desc" }))[0]).toBe(
      "fast",
    );
  });

  it("does not change the input order", () => {
    applyTimingListParams(attempts, { fast: "include", sort: "avg", dir: "asc" });
    expect(attempts.map((a) => a.attemptKey)).toEqual(["slow", "fast", "mid"]);
  });

  it("exports one CSV row per attempt with per-part columns", () => {
    const lines = buildTimingCsv(attempts).trim().split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain("Part 4 median seconds");
    expect(lines[0]).toContain("Flagged as fast");
    expect(lines[2]).toMatch(/^fast,events,,core-5\.1,.*,1,,true$/);
  });
});
