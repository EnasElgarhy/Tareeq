import { describe, expect, it } from "vitest";
import { planNextSteps, planSections } from "./report-plan";
import type { Section4 } from "./section4";
import type { AxisResult, CoreResult } from "./types";

const zone = (z: 1 | 2 | 3, lean: AxisResult["lean"]): AxisResult => ({
  count: z === 1 ? 4 : z === 2 ? 2 : 0,
  zone: z,
  lean,
});

function result(overrides: Partial<CoreResult> = {}): CoreResult {
  return {
    scoringVersion: "2.0",
    curiosityCounts: { RD: 5, IE: 4, PW: 4, EI: 0, PE: 0, TS: 4, IR: 0, AE: 0 },
    leadingCuriosities: ["RD", "IE", "PW", "TS"],
    directionClarity: "close",
    margin: 1,
    circleReading: "diverse",
    motivatorCounts: { REC: 0, IMP: 5, MAS: 4, AUT: 2, SEC: 2, INC: 1, FAM: 0, LIF: 0 },
    leadingMotivators: ["IMP", "MAS"],
    noSmallSet: false,
    topTwoMotivators: ["IMP", "MAS"],
    axes: {
      structure: zone(2, null),
      focus: zone(3, "B"),
      team: zone(1, "T"),
      setting: zone(2, null),
    },
    leadingShare: 62.5,
    ...overrides,
  };
}

const job = (jobId: string, score: number) => ({
  jobId,
  score,
  workTags: [],
  motivators: [],
  isHighlighted: score > 0,
});

const withDirections: Section4 = {
  meetCards: [],
  directions: [
    {
      curiosity: "RD",
      full: [
        {
          familyId: "fam-rd-1",
          score: 3,
          isClosest: true,
          jobs: [job("rd-best", 2), job("rd-2", 1)],
          worthChecking: "S4-CHECK-DAY",
        },
      ],
      more: [],
    },
  ],
  noMatch: false,
};

const withMeet: Section4 = {
  ...withDirections,
  meetCards: [
    {
      pair: ["RD", "IE"],
      familyId: "meet-rd-ie",
      line: "S4-MEET-CLOSE",
      jobs: [job("meet-best", 1), job("meet-2", 0)],
    },
  ],
};

describe("planNextSteps", () => {
  it("watches the best job of the first meet card when there is one", () => {
    expect(planNextSteps(result(), withMeet)).toMatchObject({
      watchJobId: "meet-best",
      talkFamilyId: "meet-rd-ie",
    });
  });

  it("falls back to the first direction family without meet cards", () => {
    expect(planNextSteps(result(), withDirections)).toMatchObject({
      watchJobId: "rd-best",
      talkFamilyId: "fam-rd-1",
    });
  });

  it("tries only the first three leading curiosities", () => {
    expect(planNextSteps(result(), withDirections).tryBlocks).toEqual([
      "S5-TRY-RD",
      "S5-TRY-IE",
      "S5-TRY-PW",
    ]);
  });

  it("asks one Talk question per top-two motivator", () => {
    expect(planNextSteps(result(), withDirections).talkBlocks).toEqual([
      "S5-YARD-IMP",
      "S5-YARD-MAS",
    ]);
  });

  it("uses the typical-day question for Talk when no small set stood out", () => {
    const plan = planNextSteps(
      result({ noSmallSet: true, leadingMotivators: [], topTwoMotivators: [] }),
      withDirections,
    );
    expect(plan.talkBlocks).toEqual(["S4-CHECK-DAY"]);
    expect(plan.askBlocks).toEqual(["S5-SCHOOL-FOCUS"]);
  });

  it("asks about the first leaning axis and the first top motivator", () => {
    // structure is evenly split, so focus is the first leaning axis.
    expect(planNextSteps(result(), withDirections).askBlocks).toEqual([
      "S5-SCHOOL-FOCUS",
      "S5-SCHOOL-IMP",
    ]);
  });

  it("asks nothing about axes when every axis is evenly split", () => {
    const even = {
      structure: zone(2, null),
      focus: zone(2, null),
      team: zone(2, null),
      setting: zone(2, null),
    };
    expect(planNextSteps(result({ axes: even }), withDirections).askBlocks).toEqual([
      "S5-SCHOOL-IMP",
    ]);
  });

  it("never asks more than four Talk and Ask questions together", () => {
    const plan = planNextSteps(result(), withDirections);
    expect(plan.talkBlocks.length + plan.askBlocks.length).toBeLessThanOrEqual(4);
  });

  it("refuses a Section 4 that shows no family", () => {
    expect(() =>
      planNextSteps(result(), { meetCards: [], directions: [], noMatch: true }),
    ).toThrow(/no family/);
  });
});

describe("planSections", () => {
  it("uses the standard order", () => {
    expect(planSections(result(), { isFlagged: false, isFlagsLive: false })).toEqual([
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
      "S7",
    ]);
  });

  it("moves next steps directly after At a glance when Open", () => {
    expect(
      planSections(result({ directionClarity: "open" }), {
        isFlagged: false,
        isFlagsLive: false,
      }),
    ).toEqual(["S1", "S2", "S5", "S3", "S4", "S6", "S7"]);
  });

  it("puts the flag note first only when flagged and flags are live", () => {
    expect(
      planSections(result(), { isFlagged: true, isFlagsLive: true })[0],
    ).toBe("FLAG-NOTE");
    expect(
      planSections(result(), { isFlagged: true, isFlagsLive: false })[0],
    ).toBe("S1");
  });
});
