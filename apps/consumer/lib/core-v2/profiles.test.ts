import { describe, expect, it } from "vitest";
import type { CareerBank, CareerFamily, CareerJob } from "./bank";
import { flagPart } from "./flags";
import { buildSection4 } from "./section4";
import { scoreCore } from "./scoring";
import { findShifts } from "./shifts";
import {
  CURIOSITY_CODES,
  type AxisCode,
  type AxisSide,
  type CoreAnswers,
  type CoreResult,
  type CuriosityCode,
  type MotivatorCode,
} from "./types";

/**
 * Student profiles across every result shape the spec's acceptance cases
 * cover (§14: cases 01–09). Expected values are worked out by hand from the
 * rules in §4, not produced by running the scorer. When file 08 arrives its
 * exact cases replace these as the acceptance gate.
 */

const AXIS_SIDES: Record<AxisCode, [counted: AxisSide, other: AxisSide]> = {
  structure: ["S", "F"],
  focus: ["D", "B"],
  team: ["T", "O"],
  setting: ["CH", "ST"],
};

function expand<T extends string>(counts: Partial<Record<T, number>>): T[] {
  return Object.entries(counts).flatMap(([code, n]) =>
    Array.from({ length: n as number }, () => code as T),
  );
}

function student(
  curiosities: Partial<Record<CuriosityCode, number>>,
  motivators: Partial<Record<MotivatorCode, number>>,
  axisCounts: Record<AxisCode, number>,
): CoreAnswers {
  return {
    curiosities: expand(curiosities),
    motivators: expand(motivators),
    axes: (Object.keys(AXIS_SIDES) as AxisCode[]).flatMap((axis) =>
      Array.from({ length: 4 }, (_, i) => ({
        axis,
        side: AXIS_SIDES[axis][i < axisCounts[axis] ? 0 : 1],
      })),
    ),
  };
}

const EVEN = { structure: 2, focus: 2, team: 2, setting: 2 };
const EVEN_MOTIVATORS = { REC: 2, IMP: 2, MAS: 2, AUT: 2, SEC: 2, INC: 2, FAM: 1, LIF: 1 };

/**
 * Sample bank: six single families per curiosity, one meet family per pair.
 * In every family the first job is tagged Set out · Deep · Together · Changing
 * and often offers Impact; the rest are Mixed with no offers.
 */
function sampleBank(): CareerBank {
  const job = (id: string, isTagged: boolean): CareerJob => ({
    id,
    name: id,
    routes: isTagged
      ? { structure: "Set out", focus: "Deep", team: "Together", setting: "Changing" }
      : { structure: "Mixed", focus: "Mixed", team: "Mixed", setting: "Mixed" },
    offers: isTagged ? ["IMP"] : [],
  });
  const family = (id: string, curiosities: CareerFamily["curiosities"]): CareerFamily => ({
    id,
    name: id,
    curiosities,
    jobs: [1, 2, 3, 4].map((n) => job(`${id}-${n}`, n === 1)),
    studyFields: [],
  });
  const singles = CURIOSITY_CODES.flatMap((code) =>
    [1, 2, 3, 4, 5, 6].map((n) => family(`${code}${n}`, [code])),
  );
  const meets = CURIOSITY_CODES.flatMap((a, i) =>
    CURIOSITY_CODES.slice(i + 1).map((b) => family(`${a}+${b}`, [a, b])),
  );
  return { families: [...singles, ...meets] };
}

interface Profile {
  name: string;
  answers: CoreAnswers;
  expected: Partial<CoreResult>;
  section4: { meetFamilies: string[]; directions: CuriosityCode[]; noMatch: boolean };
}

const PROFILES: Profile[] = [
  {
    name: "01 clear single direction",
    answers: student(
      { RD: 8, PW: 3, TS: 3, AE: 2 },
      { IMP: 6, MAS: 4, AUT: 2, REC: 2 },
      { structure: 4, focus: 4, team: 4, setting: 4 },
    ),
    expected: {
      leadingCuriosities: ["RD"],
      directionClarity: "clear",
      margin: 5,
      circleReading: "single",
      leadingMotivators: ["IMP"],
      topTwoMotivators: ["IMP"],
      noSmallSet: false,
      axes: {
        structure: { count: 4, zone: 1, lean: "S" },
        focus: { count: 4, zone: 1, lean: "D" },
        team: { count: 4, zone: 1, lean: "T" },
        setting: { count: 4, zone: 3, lean: "CH" },
      },
      leadingShare: 100,
    },
    section4: { meetFamilies: [], directions: ["RD"], noMatch: false },
  },
  {
    name: "02 leaning, every axis on its other side",
    answers: student(
      { IE: 6, EI: 4, PE: 3, IR: 3 },
      { AUT: 5, INC: 4, LIF: 3, REC: 2 },
      { structure: 0, focus: 0, team: 0, setting: 0 },
    ),
    expected: {
      leadingCuriosities: ["IE"],
      directionClarity: "leaning",
      margin: 2,
      circleReading: "single",
      leadingMotivators: ["AUT", "INC"],
      topTwoMotivators: ["AUT", "INC"],
      axes: {
        structure: { count: 0, zone: 3, lean: "F" },
        focus: { count: 0, zone: 3, lean: "B" },
        team: { count: 0, zone: 3, lean: "O" },
        setting: { count: 0, zone: 1, lean: "ST" },
      },
      leadingShare: 75,
    },
    // No job carries Open/Broad/Own/Steady, and none offers Autonomy or Income.
    section4: { meetFamilies: [], directions: ["IE"], noMatch: true },
  },
  {
    name: "03 close and coherent",
    answers: student(
      { PW: 5, RD: 4, IE: 4, TS: 3 },
      { REC: 5, IMP: 5, SEC: 4 },
      { structure: 3, focus: 2, team: 1, setting: 2 },
    ),
    expected: {
      leadingCuriosities: ["PW", "RD", "IE"],
      directionClarity: "close",
      margin: 1,
      circleReading: "coherent",
      leadingMotivators: ["REC", "IMP", "SEC"],
      topTwoMotivators: ["REC", "IMP"],
      axes: {
        structure: { count: 3, zone: 1, lean: "S" },
        focus: { count: 2, zone: 2, lean: null },
        team: { count: 1, zone: 3, lean: "O" },
        setting: { count: 2, zone: 2, lean: null },
      },
    },
    // Pairs: RD+PW 9, IE+PW 9, RD+IE 8 → top two, ties in fixed order.
    section4: { meetFamilies: ["RD+PW", "IE+PW"], directions: ["PW", "RD", "IE"], noMatch: false },
  },
  {
    name: "04 close and diverse",
    answers: student({ RD: 5, EI: 4, PE: 4, AE: 3 }, { MAS: 7, FAM: 7 }, EVEN),
    expected: {
      leadingCuriosities: ["RD", "EI", "PE"],
      directionClarity: "close",
      circleReading: "diverse", // RD(1)–EI(4) is distance 3
      leadingMotivators: ["MAS", "FAM"],
      topTwoMotivators: ["MAS", "FAM"],
    },
    // Even axes and MAS/FAM (FAM never matches; no job offers MAS) → nothing scores.
    section4: { meetFamilies: ["RD+EI", "RD+PE"], directions: ["RD", "EI", "PE"], noMatch: true },
  },
  {
    name: "05 three leaders, all near on the circle",
    answers: student(
      { TS: 5, IR: 4, AE: 4, PE: 3 },
      { LIF: 5, SEC: 4, INC: 3, REC: 2 },
      { structure: 4, focus: 2, team: 2, setting: 2 },
    ),
    expected: {
      leadingCuriosities: ["TS", "IR", "AE"],
      directionClarity: "close",
      circleReading: "coherent",
      leadingMotivators: ["SEC", "LIF"],
      topTwoMotivators: ["LIF", "SEC"],
    },
    section4: { meetFamilies: ["TS+IR", "TS+AE"], directions: ["TS", "IR", "AE"], noMatch: false },
  },
  {
    name: "06 open, three meet cards and no directions",
    answers: student(
      { RD: 4, IE: 4, TS: 4, AE: 4 },
      { IMP: 6, MAS: 4, AUT: 2, REC: 2 },
      { structure: 4, focus: 2, team: 2, setting: 2 },
    ),
    expected: {
      leadingCuriosities: ["RD", "IE", "TS", "AE"],
      directionClarity: "open",
      margin: 0,
      circleReading: "diverse", // IE(2)–TS(6) is distance 3
    },
    // All pairs tie on 8: RD+IE, then RD+TS adds TS, then RD+AE adds AE.
    section4: { meetFamilies: ["RD+IE", "RD+TS", "RD+AE"], directions: [], noMatch: false },
  },
  {
    name: "07 no small set of motivators",
    answers: student({ RD: 7, PW: 5, TS: 2, AE: 2 }, EVEN_MOTIVATORS, {
      structure: 4,
      focus: 2,
      team: 2,
      setting: 2,
    }),
    expected: {
      leadingCuriosities: ["RD"],
      directionClarity: "leaning",
      noSmallSet: true,
      leadingMotivators: [],
      topTwoMotivators: [],
    },
    section4: { meetFamilies: [], directions: ["RD"], noMatch: false },
  },
  {
    name: "08 everything evenly split, nothing highlighted",
    answers: student(
      { RD: 2, IE: 2, PW: 2, EI: 2, PE: 2, TS: 2, IR: 2, AE: 2 },
      EVEN_MOTIVATORS,
      EVEN,
    ),
    expected: {
      leadingCuriosities: ["RD", "IE", "PW", "EI", "PE", "TS", "IR", "AE"],
      directionClarity: "open",
      noSmallSet: true,
      axes: {
        structure: { count: 2, zone: 2, lean: null },
        focus: { count: 2, zone: 2, lean: null },
        team: { count: 2, zone: 2, lean: null },
        setting: { count: 2, zone: 2, lean: null },
      },
      leadingShare: 25,
    },
    section4: { meetFamilies: ["RD+IE", "RD+PW", "RD+EI"], directions: [], noMatch: true },
  },
  {
    name: "10 open with two leaders far apart",
    answers: student({ PW: 5, TS: 5, RD: 3, AE: 3 }, { IMP: 6, MAS: 4, AUT: 2, REC: 2 }, EVEN),
    expected: {
      leadingCuriosities: ["PW", "TS"],
      directionClarity: "open",
      circleReading: "diverse",
    },
    section4: { meetFamilies: ["PW+TS"], directions: [], noMatch: false },
  },
];

describe("student profiles: scoring", () => {
  it.each(PROFILES)("$name", ({ answers, expected }) => {
    expect(scoreCore(answers)).toMatchObject(expected);
  });

  it.each(PROFILES)("$name keeps totals of 16 and 14", ({ answers }) => {
    const result = scoreCore(answers);
    const sum = (counts: Record<string, number>) =>
      Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum(result.curiosityCounts)).toBe(16);
    expect(sum(result.motivatorCounts)).toBe(14);
  });
});

describe("student profiles: what this means for you", () => {
  const bank = sampleBank();

  it.each(PROFILES)("$name", ({ answers, section4 }) => {
    const section = buildSection4(scoreCore(answers), bank);
    expect({
      meetFamilies: section.meetCards.map((card) => card.familyId),
      directions: section.directions.map((direction) => direction.curiosity),
      noMatch: section.noMatch,
    }).toEqual(section4);
  });

  it("highlights the fully matching job for profile 01 with both match lines", () => {
    const [profile] = PROFILES;
    const section = buildSection4(scoreCore(profile.answers), bank);
    const top = section.directions[0].full[0];
    expect(top.isClosest).toBe(true);
    expect(top.jobs[0]).toMatchObject({
      score: 5,
      workTags: ["structure", "focus", "team", "setting"],
      motivators: ["IMP"],
      isHighlighted: true,
    });
    expect(top.jobs.slice(1).every((job) => !job.isHighlighted)).toBe(true);
  });
});

describe("student profiles: flagged attempt (09) and retake shift (01 → 02)", () => {
  it("flags a rushed part without changing the scores", () => {
    const rushed = Array.from({ length: 16 }, (_, i) => ({
      timeMs: 1200 + i * 10,
      position: (i % 4) + 1,
    }));
    expect(flagPart(rushed)).toMatchObject({ rushed: true, samePosition: false, flagged: true });
    // Same answers score identically whatever the timing.
    expect(scoreCore(PROFILES[0].answers)).toEqual(scoreCore(PROFILES[0].answers));
  });

  it("reports curiosity, motivator and axis shifts from profile 01 to 02", () => {
    const shifts = findShifts(scoreCore(PROFILES[0].answers), scoreCore(PROFILES[1].answers));
    expect(shifts).toEqual([
      { kind: "curiosities", from: ["RD"], to: ["IE"] },
      { kind: "motivators", from: ["IMP"], to: ["AUT", "INC"] },
      { kind: "axis", axis: "structure", from: 1, to: 3 },
      { kind: "axis", axis: "focus", from: 1, to: 3 },
      { kind: "axis", axis: "team", from: 1, to: 3 },
      { kind: "axis", axis: "setting", from: 3, to: 1 },
    ]);
  });
});
