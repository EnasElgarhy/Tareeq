import { describe, expect, it } from "vitest";
import type { CareerBank, CareerFamily, CareerJob, RouteTag } from "./bank";
import {
  SCORE_SCALE,
  buildSection4,
  choosePairs,
  jobMatch,
  worthChecking,
} from "./section4";
import {
  CURIOSITY_CODES,
  type AxisResult,
  type CoreResult,
  type MotivatorCode,
} from "./types";

const MIXED_ROUTES = {
  structure: "Mixed",
  focus: "Mixed",
  team: "Mixed",
  setting: "Mixed",
} as const;

function job(
  id: string,
  routes: Partial<Record<keyof typeof MIXED_ROUTES, RouteTag>> = {},
  offers: MotivatorCode[] = [],
): CareerJob {
  return {
    id,
    name: `Job ${id}`,
    nameEn: `Job ${id}`,
    routes: { ...MIXED_ROUTES, ...routes },
    offers,
    isChangingWork: false,
  };
}

function family(
  id: string,
  curiosities: CareerFamily["curiosities"],
  jobs: CareerJob[] = [job(`${id}-1`), job(`${id}-2`), job(`${id}-3`), job(`${id}-4`)],
): CareerFamily {
  return { id, name: `Family ${id}`, curiosities, jobs, studyFields: ["Field"] };
}

/** Six single families per curiosity and one meet family per pair, all neutral. */
function neutralBank(): CareerFamily[] {
  const singles = CURIOSITY_CODES.flatMap((code) =>
    Array.from({ length: 6 }, (_, i) => family(`${code}${i + 1}`, [code])),
  );
  const meets: CareerFamily[] = [];
  CURIOSITY_CODES.forEach((a, i) =>
    CURIOSITY_CODES.slice(i + 1).forEach((b) => meets.push(family(`${a}+${b}`, [a, b]))),
  );
  return [...singles, ...meets];
}

const lean = (zone: 1 | 2 | 3, side: AxisResult["lean"]): AxisResult => ({
  count: zone === 1 ? 4 : zone === 2 ? 2 : 0,
  zone,
  lean: side,
});

function result(overrides: Partial<CoreResult> = {}): CoreResult {
  return {
    scoringVersion: "2.0",
    curiosityCounts: { RD: 7, IE: 0, PW: 4, EI: 0, PE: 0, TS: 3, IR: 0, AE: 2 },
    leadingCuriosities: ["RD"],
    directionClarity: "clear",
    margin: 3,
    circleReading: "single",
    motivatorCounts: { REC: 0, IMP: 5, MAS: 4, AUT: 2, SEC: 2, INC: 1, FAM: 0, LIF: 0 },
    leadingMotivators: ["IMP", "MAS"],
    noSmallSet: false,
    topTwoMotivators: ["IMP", "MAS"],
    axes: {
      structure: lean(1, "S"),
      focus: lean(2, null),
      team: lean(3, "O"),
      setting: lean(2, null),
    },
    leadingShare: 87.5,
    ...overrides,
  };
}

describe("jobMatch", () => {
  it("matches leaning axes to route tags and leading motivators to offers", () => {
    const match = jobMatch(
      job("x", { structure: "Set out", team: "Own", focus: "Deep" }, ["IMP", "AUT"]),
      result(),
    );
    // focus is evenly split, so "Deep" never counts.
    expect(match.workTags).toEqual(["structure", "team"]);
    expect(match.motivators).toEqual(["IMP"]);
    // Equal thirds: work 1/1, setting 1/1, motivators 1/2 → 5/6.
    expect(match.score).toBe((5 / 6) * SCORE_SCALE);
  });

  it("never matches Mixed, No data, Security or Family", () => {
    const match = jobMatch(
      job("x", { structure: "Mixed", team: "No data" }, ["SEC", "FAM"]),
      result({ leadingMotivators: ["SEC", "FAM"] }),
    );
    expect(match.score).toBe(0);
  });
});

describe("choosePairs", () => {
  it("has no pairs for a single leader", () => {
    expect(choosePairs(result())).toEqual([]);
  });

  it("takes the top two pairs by summed score for three leaders", () => {
    const pairs = choosePairs(
      result({
        leadingCuriosities: ["TS", "RD", "PW"],
        curiosityCounts: { RD: 4, IE: 3, PW: 4, EI: 0, PE: 0, TS: 5, IR: 0, AE: 0 },
        directionClarity: "close",
      }),
    );
    // TS+RD = 9 and TS+PW = 9 tie; the pair farther apart on the circle
    // (TS+PW, 3 apart) comes first, then TS+RD adds RD.
    expect(pairs).toEqual([
      ["TS", "PW"],
      ["TS", "RD"],
    ]);
  });

  it("prefers pairs that add an uncovered curiosity when Open, up to three", () => {
    const pairs = choosePairs(
      result({
        leadingCuriosities: ["RD", "PE", "IR", "AE"],
        curiosityCounts: { RD: 4, IE: 0, PW: 0, EI: 0, PE: 4, TS: 0, IR: 4, AE: 4 },
        directionClarity: "open",
      }),
    );
    // All sums tie at 8 → farther apart first: RD+PE (3), PE+IR (2), PE+AE (2), …
    // RD+PE covers RD, PE; PE+IR adds IR; PE+AE adds AE → three pairs.
    expect(pairs).toEqual([
      ["RD", "PE"],
      ["PE", "IR"],
      ["PE", "AE"],
    ]);
  });
});

describe("worthChecking", () => {
  it("picks the leaning axis with the most opposite-side jobs", () => {
    const fam = family("f", ["RD"], [
      job("1", { structure: "Open", team: "Together" }),
      job("2", { team: "Together" }),
      job("3"),
      job("4"),
    ]);
    // Student leans S (structure) and O (team): 1 opposite on structure, 2 on team.
    expect(worthChecking(fam, result())).toBe("S4-CHECK-TEAM");
  });

  it("falls back to the typical-day question when nothing is opposite", () => {
    expect(worthChecking(family("f", ["RD"]), result())).toBe("S4-CHECK-DAY");
  });
});

describe("buildSection4", () => {
  it("orders a direction's families by score, marks Closest, splits 3 + 3", () => {
    const families = neutralBank().map((fam) =>
      fam.id === "RD4"
        ? family("RD4", ["RD"], [
            job("RD4-1", { structure: "Set out" }, ["IMP"]),
            job("RD4-2"),
            job("RD4-3", { team: "Own" }),
            job("RD4-4"),
          ])
        : fam,
    );
    const section = buildSection4(result(), { families } satisfies CareerBank);

    expect(section.meetCards).toEqual([]);
    expect(section.noMatch).toBe(false);
    const [direction] = section.directions;
    expect(direction.curiosity).toBe("RD");
    expect(direction.full.map((fam) => fam.familyId)).toEqual(["RD4", "RD1", "RD2"]);
    expect(direction.more).toEqual(["RD3", "RD5", "RD6"]);
    expect(direction.full[0].isClosest).toBe(true);
    expect(direction.full[1].isClosest).toBe(false);
    // Jobs by score: RD4-1 (1/2) then RD4-3 (1/3), then bank order.
    expect(direction.full[0].jobs.map((j) => [j.jobId, j.score / SCORE_SCALE])).toEqual([
      ["RD4-1", 1 / 2],
      ["RD4-3", 1 / 3],
      ["RD4-2", 0],
      ["RD4-4", 0],
    ]);
  });

  it("flags no match and shows no Closest when every shown family scores 0", () => {
    const section = buildSection4(result(), { families: neutralBank() });
    expect(section.noMatch).toBe(true);
    expect(section.directions[0].full.map((fam) => fam.familyId)).toEqual([
      "RD1",
      "RD2",
      "RD3",
    ]);
    expect(section.directions[0].full[0].isClosest).toBe(false);
  });

  it("shows only meet cards for an Open result, with close or far lines", () => {
    const section = buildSection4(
      result({
        leadingCuriosities: ["PW", "TS"],
        curiosityCounts: { RD: 2, IE: 0, PW: 5, EI: 2, PE: 2, TS: 5, IR: 0, AE: 0 },
        directionClarity: "open",
        circleReading: "diverse",
      }),
      { families: neutralBank() },
    );
    expect(section.directions).toEqual([]);
    expect(section.meetCards).toHaveLength(1);
    expect(section.meetCards[0]).toMatchObject({
      pair: ["PW", "TS"],
      familyId: "PW+TS",
      line: "S4-MEET-FAR",
    });
  });

  it("throws when the bank lacks a meet family for a chosen pair", () => {
    const families = neutralBank().filter((fam) => fam.id !== "RD+PW");
    expect(() =>
      buildSection4(
        result({ leadingCuriosities: ["RD", "PW"], directionClarity: "leaning" }),
        { families },
      ),
    ).toThrow(/RD\+PW/);
  });

  it("hides a job already shown on an earlier card and notes changing work", () => {
    const shared = (id: string, isChangingWork = false): CareerJob => ({
      ...job(id, { structure: "Set out" }),
      nameEn: "Shared job",
      isChangingWork,
    });
    const families = neutralBank().map((fam) =>
      fam.id === "RD1"
        ? family("RD1", ["RD"], [shared("RD1-1"), job("RD1-2"), job("RD1-3"), job("RD1-4")])
        : fam.id === "RD2"
          ? family("RD2", ["RD"], [shared("RD2-1", true), job("RD2-2"), job("RD2-3"), job("RD2-4")])
          : fam,
    );
    const [first, second] = buildSection4(result(), { families }).directions[0].full;
    expect(first.jobs.map((j) => j.jobId)).toContain("RD1-1");
    expect(second.jobs.map((j) => j.jobId)).not.toContain("RD2-1");
    expect(second.hiddenRepeatJobIds).toEqual(["RD2-1"]);
    // The only changing-work job was hidden, so no note.
    expect(second.hasChangingNote).toBe(false);
  });
});
