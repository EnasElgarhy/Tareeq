import { describe, expect, it } from "vitest";
import {
  ageBandFromAge,
  ageFromBirthYear,
  average,
  comparePoints,
  comparePointsWithBaseline,
  computeDelta,
  countAnsweredQuestions,
  countMissingAnswers,
  durationSeconds,
  extractCoreResult,
  isAllSameAnswerPattern,
  isFlaggedRecord,
  isRushed,
  isVeryLong,
  percentage,
  qualityScorePct,
  retakeRatePct,
  tally,
} from "./aggregate";

describe("durationSeconds", () => {
  it("computes whole seconds between start and completion", () => {
    expect(
      durationSeconds("2026-01-01T10:00:00Z", "2026-01-01T10:05:00Z"),
    ).toBe(300);
  });

  it("returns null when not completed", () => {
    expect(durationSeconds("2026-01-01T10:00:00Z", null)).toBeNull();
  });

  it("returns null for unparseable timestamps", () => {
    expect(durationSeconds("not-a-date", "2026-01-01T10:00:00Z")).toBeNull();
  });

  it("returns null when completion is before the start", () => {
    expect(
      durationSeconds("2026-01-01T10:05:00Z", "2026-01-01T10:00:00Z"),
    ).toBeNull();
  });
});

describe("isRushed", () => {
  it("flags durations under 4 minutes", () => {
    expect(isRushed(239)).toBe(true);
  });

  it("does not flag exactly 4 minutes", () => {
    expect(isRushed(240)).toBe(false);
  });

  it("does not flag a null duration", () => {
    expect(isRushed(null)).toBe(false);
  });
});

describe("isVeryLong", () => {
  it("flags durations over 30 minutes", () => {
    expect(isVeryLong(1801)).toBe(true);
  });

  it("does not flag exactly 30 minutes", () => {
    expect(isVeryLong(1800)).toBe(false);
  });
});

describe("countAnsweredQuestions", () => {
  it("counts keys on an answers object", () => {
    expect(countAnsweredQuestions({ q1: "A", q2: "B" })).toBe(2);
  });

  it("returns 0 for null or non-object input", () => {
    expect(countAnsweredQuestions(null)).toBe(0);
    expect(countAnsweredQuestions("nope")).toBe(0);
  });
});

describe("countMissingAnswers", () => {
  it("returns null when the expected count is unknown", () => {
    expect(countMissingAnswers(5, null)).toBeNull();
  });

  it("subtracts answered from expected", () => {
    expect(countMissingAnswers(8, 10)).toBe(2);
  });

  it("clamps at 0 when answered exceeds expected", () => {
    expect(countMissingAnswers(12, 10)).toBe(0);
  });
});

describe("isAllSameAnswerPattern", () => {
  it("flags a response set where every letter answer is identical", () => {
    const answers = Object.fromEntries(
      Array.from({ length: 6 }, (_, i) => [`q${i}`, "A"]),
    );
    expect(isAllSameAnswerPattern(answers)).toBe(true);
  });

  it("is case-insensitive", () => {
    const answers = { q1: "a", q2: "A", q3: "a", q4: "A", q5: "a" };
    expect(isAllSameAnswerPattern(answers)).toBe(true);
  });

  it("does not flag a mixed response set", () => {
    const answers = { q1: "A", q2: "B", q3: "A", q4: "A", q5: "A" };
    expect(isAllSameAnswerPattern(answers)).toBe(false);
  });

  it("does not flag when below the minimum answer count", () => {
    expect(isAllSameAnswerPattern({ q1: "A", q2: "A" })).toBe(false);
  });

  it("ignores free-text answers when checking the pattern", () => {
    const answers = {
      q1: "A",
      q2: "A",
      q3: "A",
      q4: "A",
      q5: "A",
      q6: "I want to build things that matter",
    };
    expect(isAllSameAnswerPattern(answers)).toBe(true);
  });
});

describe("isFlaggedRecord", () => {
  it("flags a rushed record", () => {
    expect(
      isFlaggedRecord({
        rushed: true,
        veryLong: false,
        allSameAnswer: false,
        missingCount: 0,
      }),
    ).toBe(true);
  });

  it("flags a record with missing answers", () => {
    expect(
      isFlaggedRecord({
        rushed: false,
        veryLong: false,
        allSameAnswer: false,
        missingCount: 1,
      }),
    ).toBe(true);
  });

  it("does not flag a clean record", () => {
    expect(
      isFlaggedRecord({
        rushed: false,
        veryLong: false,
        allSameAnswer: false,
        missingCount: 0,
      }),
    ).toBe(false);
  });

  it("does not flag when missingCount is unknown", () => {
    expect(
      isFlaggedRecord({
        rushed: false,
        veryLong: false,
        allSameAnswer: false,
        missingCount: null,
      }),
    ).toBe(false);
  });
});

describe("ageFromBirthYear", () => {
  it("computes age from birth year and a reference year", () => {
    expect(ageFromBirthYear(2008, 2026)).toBe(18);
  });

  it("returns null when birth year is unknown", () => {
    expect(ageFromBirthYear(null, 2026)).toBeNull();
  });

  it("returns null for an implausible age", () => {
    expect(ageFromBirthYear(2030, 2026)).toBeNull();
  });
});

describe("ageBandFromAge", () => {
  it.each([
    [16, "16-17"],
    [17, "16-17"],
    [18, "18-19"],
    [19, "18-19"],
    [20, "20-21"],
    [21, "20-21"],
    [22, "22+"],
    [40, "22+"],
  ])("buckets age %d into %s", (age, band) => {
    expect(ageBandFromAge(age)).toBe(band);
  });

  it("returns unknown for a null age", () => {
    expect(ageBandFromAge(null)).toBe("unknown");
  });
});

describe("percentage", () => {
  it("returns null when the whole is zero", () => {
    expect(percentage(1, 0)).toBeNull();
  });

  it("rounds to one decimal place", () => {
    expect(percentage(1, 3)).toBe(33.3);
  });
});

describe("average", () => {
  it("returns null for an empty list", () => {
    expect(average([])).toBeNull();
  });

  it("rounds the mean to the nearest integer", () => {
    expect(average([1, 2, 4])).toBe(2);
  });
});

describe("tally", () => {
  it("counts and sorts by count descending", () => {
    const result = tally(["a", "b", "a", "a", "c"], (x) => x);
    expect(result).toEqual([
      { key: "a", label: "a", count: 3, pct: 60 },
      { key: "b", label: "b", count: 1, pct: 20 },
      { key: "c", label: "c", count: 1, pct: 20 },
    ]);
  });
});

describe("retakeRatePct", () => {
  it("returns null when there are no identities", () => {
    expect(retakeRatePct([null, null])).toBeNull();
  });

  it("returns 0 when nobody repeats", () => {
    expect(retakeRatePct(["a", "b", "c"])).toBe(0);
  });

  it("computes the share of identities appearing more than once", () => {
    expect(retakeRatePct(["a", "a", "b", "c"])).toBe(percentage(1, 3));
  });

  it("ignores null identities", () => {
    expect(retakeRatePct(["a", "a", null, null])).toBe(100);
  });
});

describe("computeDelta", () => {
  it("reports a normal positive change", () => {
    expect(computeDelta(118, 100)).toEqual({
      current: 118,
      previous: 100,
      deltaPct: 18,
      direction: "up",
    });
  });

  it("reports a normal negative change", () => {
    const result = computeDelta(80, 100);
    expect(result.deltaPct).toBe(-20);
    expect(result.direction).toBe("down");
  });

  it("treats a tiny change as flat", () => {
    expect(computeDelta(100.2, 100).direction).toBe("flat");
  });

  it("reports 'new' when there's no previous baseline", () => {
    const result = computeDelta(5, 0);
    expect(result.deltaPct).toBeNull();
    expect(result.direction).toBe("new");
  });

  it("reports 'none' when both periods are zero", () => {
    const result = computeDelta(0, 0);
    expect(result.deltaPct).toBeNull();
    expect(result.direction).toBe("none");
  });
});

describe("comparePoints", () => {
  it("reports a positive point change", () => {
    expect(comparePoints(55, 50)).toEqual({
      current: 55,
      previous: 50,
      deltaPct: 5,
      direction: "up",
    });
  });

  it("is meaningful from a zero baseline (unlike computeDelta)", () => {
    expect(comparePoints(40, 0)).toEqual({
      current: 40,
      previous: 0,
      deltaPct: 40,
      direction: "up",
    });
  });

  it("treats a tiny change as flat", () => {
    expect(comparePoints(50.2, 50).direction).toBe("flat");
  });
});

describe("comparePointsWithBaseline", () => {
  it("reports 'new' for a rate metric with no previous-period rows, even at 100%", () => {
    const result = comparePointsWithBaseline(100, 0, false);
    expect(result.deltaPct).toBeNull();
    expect(result.direction).toBe("new");
  });

  it("reports 'none' when there's no baseline and current is also 0", () => {
    expect(comparePointsWithBaseline(0, 0, false).direction).toBe("none");
  });

  it("computes a normal point delta when a baseline exists", () => {
    expect(comparePointsWithBaseline(60, 50, true)).toEqual(
      comparePoints(60, 50),
    );
  });

  it("reports 'new' (not 'none') for a real 0% score when the current period has a real sample", () => {
    // e.g. a data-quality score where every current-period record is
    // flagged: current is genuinely 0%, not "no data" — an explicit
    // hasCurrentSample=true must override the current>0 default inference.
    const result = comparePointsWithBaseline(0, 0, false, true);
    expect(result.deltaPct).toBeNull();
    expect(result.direction).toBe("new");
  });

  it("still reports 'none' when there's no baseline and no current sample either", () => {
    expect(comparePointsWithBaseline(0, 0, false, false).direction).toBe("none");
  });
});

describe("qualityScorePct", () => {
  it("computes the clean-record share", () => {
    expect(
      qualityScorePct({
        rushedCount: 1,
        veryLongCount: 0,
        allSameAnswerCount: 0,
        missingAnswersCount: 0,
        suspiciousCount: 1,
        cleanCount: 9,
        totalCount: 10,
      }),
    ).toBe(90);
  });

  it("returns null when there are no records", () => {
    expect(
      qualityScorePct({
        rushedCount: 0,
        veryLongCount: 0,
        allSameAnswerCount: 0,
        missingAnswersCount: 0,
        suspiciousCount: 0,
        cleanCount: 0,
        totalCount: 0,
      }),
    ).toBeNull();
  });
});

describe("extractCoreResult", () => {
  it("extracts the CompassResult-shaped fields it recognizes", () => {
    const result = {
      topCluster: "TECH",
      archetype: "Explorer",
      primaryDriver: "MAS",
      secondaryDriver: "AUT",
      ecosystemFit: "Solo Sprinter",
      clusterFinal: { TECH: 80 },
    };
    expect(extractCoreResult(result)).toEqual({
      topCluster: "TECH",
      archetype: "Explorer",
      primaryDriver: "MAS",
      secondaryDriver: "AUT",
      ecosystemFit: "Solo Sprinter",
    });
  });

  it("returns null for a non-CORE-shaped result", () => {
    expect(extractCoreResult({ profileId: "abc", profileName: "Leader" })).toBeNull();
  });

  it("returns null for null or non-object input", () => {
    expect(extractCoreResult(null)).toBeNull();
    expect(extractCoreResult("nope")).toBeNull();
  });
});
