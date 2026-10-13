import { describe, expect, it } from "vitest";
import {
  effectiveResponses,
  flagsByPart,
  toCoreAnswers,
  type CoreQuestion,
  type ResponseRecord,
} from "./attempt";
import { flagPart } from "./flags";
import { clarityBlocks } from "./report-plan";
import { retakeStatus } from "./retake";
import { scoreCore } from "./scoring";
import { shiftsToRaise, type Shift } from "./shifts";
import type { CoreAnswers, CoreResult } from "./types";

/* ---------------------------------------------------------------- fixtures */

const q = (id: string, part: 1 | 2, codes: string[], axis?: "structure"): CoreQuestion => ({
  id,
  part,
  fixedOrderPosition: 1,
  axis,
  options: codes.map((code) => ({ id: `${id}-${code}`, code })),
});

const row = (
  questionId: string,
  code: string,
  part: 1 | 2,
  extra: Partial<ResponseRecord> = {},
): ResponseRecord => ({
  questionId,
  optionId: `${questionId}-${code}`,
  code,
  part,
  positionShown: 1,
  optionsShown: [],
  timeOnScreenMs: 4000,
  orderShown: 1,
  answeredAt: "2026-10-04T10:00:00Z",
  ...extra,
});

/* ---------------------------------------------------------------- §5 redo */

describe("redo of a flagged part", () => {
  const original = [
    row("P1-01", "RD", 1, { timeOnScreenMs: 900 }),
    row("P1-02", "RD", 1, { timeOnScreenMs: 900 }),
    row("P2-01", "S", 2),
  ];
  const redo = [
    row("P1-01", "PW", 1, { isRedo: true }),
    row("P1-02", "TS", 1, { isRedo: true }),
  ];

  it("keeps the redone part's answers and drops the flagged originals", () => {
    const effective = effectiveResponses([...original, ...redo]);
    expect(effective.map((r) => `${r.questionId}:${r.code}`).sort()).toEqual([
      "P1-01:PW",
      "P1-02:TS",
      "P2-01:S",
    ]);
  });

  it("flags the original and the redo separately", () => {
    expect(flagsByPart(original)[1]?.rushed).toBe(true);
    expect(flagsByPart(effectiveResponses([...original, ...redo]))[1]?.rushed).toBe(false);
  });
});

/* ---------------------------------------------------------------- §3.1 integrity */

describe("answer integrity", () => {
  const questions = [q("P1-01", 1, ["RD", "PW"]), q("P1-02", 1, ["RD", "PW"])];

  it("rejects the same question answered twice", () => {
    expect(() =>
      toCoreAnswers([row("P1-01", "RD", 1), row("P1-01", "PW", 1)], questions),
    ).toThrow(/P1-01 answered more than once/);
  });

  it("rejects an attempt that leaves a question unanswered", () => {
    expect(() => toCoreAnswers([row("P1-01", "RD", 1)], questions)).toThrow(
      /P1-02 not answered/,
    );
  });

  it("rejects a response whose part disagrees with its question", () => {
    expect(() =>
      toCoreAnswers(
        [row("P1-01", "RD", 1), row("P1-02", "RD", 1, { part: 2 })],
        questions,
      ),
    ).toThrow(/part/);
  });

  it("rejects a part 2 question that has no axis", () => {
    expect(() => toCoreAnswers([row("P2-01", "S", 2)], [q("P2-01", 2, ["S", "F"])])).toThrow(
      /no axis/,
    );
  });
});

describe("scoreCore rejects codes outside the model", () => {
  const valid: CoreAnswers = {
    curiosities: Array(16).fill("RD"),
    motivators: Array(14).fill("IMP"),
    axes: (["structure", "focus", "team", "setting"] as const).flatMap((axis) =>
      Array.from({ length: 4 }, () => ({
        axis,
        side: ({ structure: "S", focus: "D", team: "T", setting: "CH" } as const)[axis],
      })),
    ),
  };

  it("throws on an unknown curiosity code instead of dropping the point", () => {
    const answers = { ...valid, curiosities: [...valid.curiosities.slice(1), "XX"] };
    expect(() => scoreCore(answers as unknown as CoreAnswers)).toThrow(/XX/);
  });

  it("throws on an unknown motivator code", () => {
    const answers = { ...valid, motivators: [...valid.motivators.slice(1), "FUN"] };
    expect(() => scoreCore(answers as unknown as CoreAnswers)).toThrow(/FUN/);
  });

  it("scores a single curiosity chosen 16 times as Clear", () => {
    const result = scoreCore(valid);
    expect(result).toMatchObject({ margin: 16, directionClarity: "clear", leadingShare: 200 });
  });
});

describe("flagPart input checks and boundaries", () => {
  it("rejects a negative or missing time", () => {
    expect(() => flagPart([{ timeMs: -1, position: 1 }])).toThrow(/time/);
    expect(() => flagPart([{ timeMs: Number.NaN, position: 1 }])).toThrow(/time/);
  });

  it("can be rushed and same-position at once", () => {
    const flags = flagPart(Array.from({ length: 10 }, () => ({ timeMs: 500, position: 3 })));
    expect(flags).toMatchObject({ rushed: true, samePosition: true, flagged: true });
  });

  it("does not flag 89% on the same position", () => {
    const answers = [
      ...Array.from({ length: 89 }, () => ({ timeMs: 4000, position: 1 })),
      ...Array.from({ length: 11 }, () => ({ timeMs: 4000, position: 2 })),
    ];
    expect(flagPart(answers).samePosition).toBe(false);
  });
});

/* ---------------------------------------------------------------- §8 retakes */

describe("retakeStatus", () => {
  const NOW = new Date("2026-10-04T12:00:00Z");
  const attempt = (submittedAt: string, extra: Partial<Parameters<typeof retakeStatus>[0][number]> = {}) => ({
    submittedAt: new Date(submittedAt),
    isFlagged: false,
    wasFlagsLive: false,
    isFreeRetake: false,
    ...extra,
  });

  it("allows a first attempt", () => {
    expect(retakeStatus([], NOW)).toEqual({ canRetake: true, kind: "first" });
  });

  it("blocks a normal retake inside six months and says when it opens", () => {
    expect(retakeStatus([attempt("2026-06-01T09:00:00Z")], NOW)).toEqual({
      canRetake: false,
      opensAt: new Date("2026-12-01T09:00:00Z"),
    });
  });

  it("allows a normal retake after six months", () => {
    expect(retakeStatus([attempt("2026-04-01T09:00:00Z")], NOW)).toEqual({
      canRetake: true,
      kind: "standard",
    });
  });

  it("gives one free retake within 30 days of a flagged attempt while flags are live", () => {
    expect(
      retakeStatus([attempt("2026-09-20T09:00:00Z", { isFlagged: true, wasFlagsLive: true })], NOW),
    ).toEqual({ canRetake: true, kind: "free" });
  });

  it("gives no free retake when flags were not live", () => {
    expect(
      retakeStatus([attempt("2026-09-20T09:00:00Z", { isFlagged: true })], NOW).canRetake,
    ).toBe(false);
  });

  it("gives no free retake after 30 days", () => {
    expect(
      retakeStatus([attempt("2026-08-20T09:00:00Z", { isFlagged: true, wasFlagsLive: true })], NOW)
        .canRetake,
    ).toBe(false);
  });

  it("does not let a flagged free retake earn another, and keeps the six-month clock", () => {
    const status = retakeStatus(
      [
        attempt("2026-09-01T09:00:00Z", { isFlagged: true, wasFlagsLive: true }),
        attempt("2026-09-20T09:00:00Z", { isFlagged: true, wasFlagsLive: true, isFreeRetake: true }),
      ],
      NOW,
    );
    // Six months run from the last attempt that was not the free one.
    expect(status).toEqual({ canRetake: false, opensAt: new Date("2027-03-01T09:00:00Z") });
  });
});

/* ---------------------------------------------------------------- §8 Kai cap */

describe("shiftsToRaise", () => {
  const shifts: Shift[] = [
    { kind: "axis", axis: "team", from: 1, to: 3 },
    { kind: "motivators", from: ["REC"], to: ["AUT"] },
    { kind: "curiosities", from: ["RD"], to: ["TS"] },
  ];

  it("raises at most two, curiosities first, then motivators", () => {
    expect(shiftsToRaise(shifts).map((shift) => shift.kind)).toEqual([
      "curiosities",
      "motivators",
    ]);
  });
});

/* ---------------------------------------------------------------- §6.2 clarity line */

describe("clarityBlocks", () => {
  const base = { directionClarity: "close", circleReading: "coherent" } as CoreResult;

  it("adds the circle reading only when Close", () => {
    expect(clarityBlocks({ ...base, directionClarity: "clear" })).toEqual(["S2-C-CLEAR"]);
    expect(clarityBlocks({ ...base, directionClarity: "leaning" })).toEqual(["S2-C-LEANING"]);
    expect(clarityBlocks(base)).toEqual(["S2-C-CLOSE", "S2-C-COHERENT"]);
    expect(clarityBlocks({ ...base, circleReading: "diverse" })).toEqual([
      "S2-C-CLOSE",
      "S2-C-DIVERSE",
    ]);
    expect(clarityBlocks({ ...base, directionClarity: "open" })).toEqual(["S2-C-OPEN"]);
  });
});
