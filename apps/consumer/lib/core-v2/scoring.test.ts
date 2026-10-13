import { describe, expect, it } from "vitest";
import { circleDistance, scoreCore } from "./scoring";
import type {
  AxisAnswer,
  AxisCode,
  AxisSide,
  CoreAnswers,
  CuriosityCode,
  MotivatorCode,
} from "./types";

/** Expand {RD: 5, IE: 3} into a flat answer list. */
function repeat<T extends string>(counts: Partial<Record<T, number>>): T[] {
  return Object.entries(counts).flatMap(([code, n]) =>
    Array.from({ length: n as number }, () => code as T),
  );
}

/** Four answers per axis; `counted` of them pick the counted option. */
function axes(counted: Record<AxisCode, number>): AxisAnswer[] {
  const pairs: Record<AxisCode, [AxisSide, AxisSide]> = {
    structure: ["S", "F"],
    focus: ["D", "B"],
    team: ["T", "O"],
    setting: ["CH", "ST"],
  };
  return (Object.keys(pairs) as AxisCode[]).flatMap((axis) => {
    const [countedSide, otherSide] = pairs[axis];
    return Array.from({ length: 4 }, (_, i) => ({
      axis,
      side: i < counted[axis] ? countedSide : otherSide,
    }));
  });
}

const EVEN_AXES = { structure: 2, focus: 2, team: 2, setting: 2 };

function answers(
  curiosities: Partial<Record<CuriosityCode, number>>,
  motivators: Partial<Record<MotivatorCode, number>> = {
    REC: 5,
    IMP: 3,
    MAS: 2,
    AUT: 2,
    SEC: 1,
    INC: 1,
  },
  axisCounts: Record<AxisCode, number> = EVEN_AXES,
): CoreAnswers {
  return {
    curiosities: repeat(curiosities),
    motivators: repeat(motivators),
    axes: axes(axisCounts),
  };
}

describe("scoreCore: curiosities", () => {
  it("counts each choice as one point and totals 16", () => {
    const result = scoreCore(answers({ RD: 6, PW: 4, TS: 3, AE: 3 }));
    expect(result.curiosityCounts).toEqual({
      RD: 6,
      IE: 0,
      PW: 4,
      EI: 0,
      PE: 0,
      TS: 3,
      IR: 0,
      AE: 3,
    });
  });

  it("is Clear with a single leader when the margin is 3 or more", () => {
    const result = scoreCore(answers({ RD: 7, PW: 4, TS: 3, AE: 2 }));
    expect(result.leadingCuriosities).toEqual(["RD"]);
    expect(result.margin).toBe(3);
    expect(result.directionClarity).toBe("clear");
    expect(result.circleReading).toBe("single");
  });

  it("is Leaning when the margin is 2", () => {
    const result = scoreCore(answers({ IE: 6, PW: 4, TS: 3, AE: 3 }));
    expect(result.leadingCuriosities).toEqual(["IE"]);
    expect(result.directionClarity).toBe("leaning");
  });

  it("leads with every curiosity at L or L−1, by score then fixed order", () => {
    // L = 5; PW and RD at 4 tie, so fixed order puts RD before PW.
    const result = scoreCore(answers({ PW: 4, TS: 5, RD: 4, AE: 3 }));
    expect(result.leadingCuriosities).toEqual(["TS", "RD", "PW"]);
    expect(result.margin).toBe(1);
    expect(result.directionClarity).toBe("close");
  });

  it("is Open when two or more curiosities share the top score", () => {
    const result = scoreCore(answers({ RD: 5, PE: 5, IR: 3, AE: 3 }));
    expect(result.margin).toBe(0);
    expect(result.directionClarity).toBe("open");
    expect(result.leadingCuriosities).toEqual(["RD", "PE"]);
  });

  it("reads diverse when any leader pair is distance 3 apart", () => {
    // RD(1) and PW(3) are distance 2.
    const result = scoreCore(answers({ RD: 5, PW: 4, TS: 4, AE: 3 }));
    expect(result.leadingCuriosities).toEqual(["RD", "PW", "TS"]);
    // RD(1)–TS(6) is distance 2 the short way round; PW(3)–TS(6) is 3.
    expect(result.circleReading).toBe("diverse");
  });

  it("reads coherent when every leader pair is within distance 2", () => {
    const result = scoreCore(answers({ RD: 5, IE: 4, PW: 4, AE: 3 }));
    expect(result.circleReading).toBe("coherent");
  });

  it("stores leading share as L / 8 × 100", () => {
    const result = scoreCore(answers({ RD: 6, PW: 4, TS: 3, AE: 3 }));
    expect(result.leadingShare).toBe(75);
  });
});

describe("circleDistance", () => {
  it("measures the shorter way round, with IR and AE sharing position 7", () => {
    expect(circleDistance("RD", "IE")).toBe(1);
    expect(circleDistance("RD", "EI")).toBe(3);
    expect(circleDistance("RD", "AE")).toBe(1);
    expect(circleDistance("IR", "AE")).toBe(0);
    expect(circleDistance("PW", "TS")).toBe(3);
    expect(circleDistance("RD", "TS")).toBe(2);
  });
});

describe("scoreCore: motivators", () => {
  it("leads with motivators at T or T−1, shown in fixed order", () => {
    const result = scoreCore(
      answers({ RD: 6, PW: 4, TS: 3, AE: 3 }, { LIF: 5, IMP: 4, REC: 2, SEC: 2, MAS: 1 }),
    );
    expect(result.leadingMotivators).toEqual(["IMP", "LIF"]);
    expect(result.topTwoMotivators).toEqual(["LIF", "IMP"]);
    expect(result.noSmallSet).toBe(false);
  });

  it("reports no small set when four or more motivators qualify", () => {
    const result = scoreCore(
      answers(
        { RD: 6, PW: 4, TS: 3, AE: 3 },
        { REC: 3, IMP: 3, MAS: 2, AUT: 2, SEC: 2, INC: 2 },
      ),
    );
    expect(result.noSmallSet).toBe(true);
    expect(result.leadingMotivators).toEqual([]);
    expect(result.topTwoMotivators).toEqual([]);
  });

  it("caps top two at two, breaking ties in fixed order", () => {
    const result = scoreCore(
      answers(
        { RD: 6, PW: 4, TS: 3, AE: 3 },
        { FAM: 4, AUT: 4, INC: 3, REC: 1, IMP: 1, MAS: 1 },
      ),
    );
    expect(result.leadingMotivators).toEqual(["AUT", "INC", "FAM"]);
    expect(result.topTwoMotivators).toEqual(["AUT", "FAM"]);
  });
});

describe("scoreCore: axes", () => {
  it("maps counts 4–3 / 2 / 1–0 to lean, mix, other side", () => {
    const result = scoreCore(
      answers({ RD: 6, PW: 4, TS: 3, AE: 3 }, undefined, {
        structure: 4,
        focus: 2,
        team: 1,
        setting: 3,
      }),
    );
    expect(result.axes.structure).toEqual({ count: 4, zone: 1, lean: "S" });
    expect(result.axes.focus).toEqual({ count: 2, zone: 2, lean: null });
    expect(result.axes.team).toEqual({ count: 1, zone: 3, lean: "O" });
    // Setting counts CH, which is side B, so a CH lean highlights the last zone.
    expect(result.axes.setting).toEqual({ count: 3, zone: 3, lean: "CH" });
  });

  it("puts a setting lean toward ST in the first zone", () => {
    const result = scoreCore(
      answers({ RD: 6, PW: 4, TS: 3, AE: 3 }, undefined, {
        ...EVEN_AXES,
        setting: 0,
      }),
    );
    expect(result.axes.setting).toEqual({ count: 0, zone: 1, lean: "ST" });
  });
});

describe("scoreCore: validation", () => {
  it("rejects an incomplete attempt", () => {
    expect(() => scoreCore(answers({ RD: 5, PW: 4 }))).toThrow(/16 curiosity/);
  });

  it("rejects an axis without exactly four answers", () => {
    const valid = answers({ RD: 6, PW: 4, TS: 3, AE: 3 });
    expect(() =>
      scoreCore({ ...valid, axes: valid.axes.slice(1) }),
    ).toThrow(/structure/);
  });

  it("rejects a side that does not belong to the axis", () => {
    const valid = answers({ RD: 6, PW: 4, TS: 3, AE: 3 });
    const axesWithBadSide = valid.axes.map((answer, i) =>
      i === 0 ? { axis: answer.axis, side: "T" as const } : answer,
    );
    expect(() => scoreCore({ ...valid, axes: axesWithBadSide })).toThrow(
      /not a side of structure/,
    );
  });
});
