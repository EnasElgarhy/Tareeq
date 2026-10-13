import { describe, expect, it } from "vitest";
import { findShifts } from "./shifts";
import type { AxisCode, AxisResult, CoreResult } from "./types";

const zone = (z: 1 | 2 | 3): AxisResult => ({
  count: z === 1 ? 4 : z === 2 ? 2 : 0,
  zone: z,
  lean: null,
});

function result(overrides: Partial<CoreResult>): CoreResult {
  return {
    scoringVersion: "2.0",
    curiosityCounts: { RD: 6, IE: 0, PW: 4, EI: 0, PE: 0, TS: 3, IR: 0, AE: 3 },
    leadingCuriosities: ["RD"],
    directionClarity: "clear",
    margin: 2,
    circleReading: "single",
    motivatorCounts: { REC: 5, IMP: 3, MAS: 2, AUT: 2, SEC: 1, INC: 1, FAM: 0, LIF: 0 },
    leadingMotivators: ["REC"],
    noSmallSet: false,
    topTwoMotivators: ["REC"],
    axes: { structure: zone(1), focus: zone(2), team: zone(3), setting: zone(1) },
    leadingShare: 75,
    ...overrides,
  };
}

describe("findShifts", () => {
  it("finds no shift when leaders overlap and no axis crosses sides", () => {
    const previous = result({ leadingCuriosities: ["RD", "PW"] });
    const current = result({
      leadingCuriosities: ["PW"],
      axes: { ...previous.axes, structure: zone(2) },
    });
    expect(findShifts(previous, current)).toEqual([]);
  });

  it("finds a curiosity shift when none of the previous leaders still lead", () => {
    const shifts = findShifts(
      result({ leadingCuriosities: ["RD", "PW"] }),
      result({ leadingCuriosities: ["TS"] }),
    );
    expect(shifts).toEqual([
      { kind: "curiosities", from: ["RD", "PW"], to: ["TS"] },
    ]);
  });

  it("finds a motivator shift when none of the previous leaders still lead", () => {
    const shifts = findShifts(
      result({ leadingMotivators: ["REC", "IMP"] }),
      result({ leadingMotivators: ["AUT"] }),
    );
    expect(shifts).toEqual([
      { kind: "motivators", from: ["REC", "IMP"], to: ["AUT"] },
    ]);
  });

  it("counts an axis move only from one side to the other", () => {
    const previous = result({});
    const current = result({
      axes: {
        structure: zone(3), // 1 → 3: shift
        focus: zone(1), // 2 → 1: to/from the middle, no shift
        team: zone(1), // 3 → 1: shift
        setting: zone(1),
      },
    });
    const axisShifts = findShifts(previous, current)
      .filter((shift) => shift.kind === "axis")
      .map((shift) => (shift as { axis: AxisCode }).axis);
    expect(axisShifts).toEqual(["structure", "team"]);
  });

  it("orders curiosity shifts before motivator shifts before axes", () => {
    const shifts = findShifts(
      result({ leadingCuriosities: ["RD"], leadingMotivators: ["REC"] }),
      result({
        leadingCuriosities: ["IE"],
        leadingMotivators: ["LIF"],
        axes: {
          structure: zone(3),
          focus: zone(2),
          team: zone(3),
          setting: zone(1),
        },
      }),
    );
    expect(shifts.map((shift) => shift.kind)).toEqual([
      "curiosities",
      "motivators",
      "axis",
    ]);
  });

  it("never compares against a different scoring version", () => {
    const legacy = { ...result({ leadingCuriosities: ["RD"] }), scoringVersion: "1.3" };
    expect(
      findShifts(legacy as unknown as CoreResult, result({ leadingCuriosities: ["TS"] })),
    ).toEqual([]);
  });
});
