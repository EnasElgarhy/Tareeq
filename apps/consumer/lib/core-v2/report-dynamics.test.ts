import { describe, expect, it } from "vitest";
import {
  CORE_ASSESSMENT_QUESTIONS,
  coreAnswersFromLetters,
} from "./assessment";
import { coreBank } from "./content/core-content";
import { wordingFor } from "./content/wording";
import { buildReportModel, type ReportModel } from "./report-model";
import { scoreCore } from "./scoring";
import type { CoreResult } from "./types";

/**
 * End to end with real inputs: letter answers through question set 5.2,
 * scoring 2.0, bank v1.1 and the file 04 wording, for many students.
 * Guards that the report is built from each student's own answers and
 * follows the spec's structural rules (§6) whatever the answers are.
 */

const NO_FLAGS = { isFlagged: false, isFlagsLive: false };

/** Small seeded PRNG so failures reproduce. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function randomAnswers(seed: number): Record<string, string> {
  const next = seeded(seed);
  return Object.fromEntries(
    CORE_ASSESSMENT_QUESTIONS.map((question) => [
      question.externalId,
      question.options[Math.floor(next() * question.options.length)]!.letter,
    ]),
  );
}

function report(answers: Record<string, string>, locale: "en" | "ar" = "en") {
  const result = scoreCore(coreAnswersFromLetters(answers));
  return {
    result,
    model: buildReportModel(result, coreBank(locale), NO_FLAGS),
  };
}

function shownFamilies(model: ReportModel): string[] {
  return [
    ...model.section4.meetCards.map((card) => card.familyId),
    ...model.section4.directions.flatMap((direction) => [
      ...direction.full.map((family) => family.familyId),
      ...direction.more,
    ]),
  ];
}

const STUDENTS = Array.from({ length: 60 }, (_, i) => randomAnswers(1000 + i));

describe("the report is built from each student's own answers", () => {
  it("builds a report for every student without a missing family or job", () => {
    for (const answers of STUDENTS) {
      expect(() => report(answers)).not.toThrow();
      expect(() => report(answers, "ar")).not.toThrow();
    }
  });

  it("has wording in English and Arabic for every block a report shows", () => {
    const missing = new Set<string>();
    for (const answers of STUDENTS) {
      const { model } = report(answers);
      for (const id of model.blocksShown) {
        if (!wordingFor("en", id)) missing.add(`en:${id}`);
        if (!wordingFor("ar", id)) missing.add(`ar:${id}`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it("gives different students different results and career families", () => {
    const leaders = new Set(
      STUDENTS.map((a) => report(a).result.leadingCuriosities.join(",")),
    );
    const families = new Set(
      STUDENTS.map((a) => shownFamilies(report(a).model).join(",")),
    );
    expect(leaders.size).toBeGreaterThan(10);
    expect(families.size).toBeGreaterThan(10);
  });

  it("shows sections for the student's own leading curiosities, in leader order", () => {
    for (const answers of STUDENTS) {
      const { result, model } = report(answers);
      const directionCodes = model.section4.directions.map((d) => d.curiosity);
      const expected =
        result.directionClarity === "open" ? [] : result.leadingCuriosities;
      expect(directionCodes).toEqual(expected);
    }
  });
});

describe("structural rules hold for every student (spec §6)", () => {
  const all = STUDENTS.map((answers) => report(answers));

  function clarityLine(result: CoreResult): string {
    return {
      clear: "S2-C-CLEAR",
      leaning: "S2-C-LEANING",
      close: "S2-C-CLOSE",
      open: "S2-C-OPEN",
    }[result.directionClarity];
  }

  it("uses the clarity line that matches Direction Clarity (§6.2)", () => {
    for (const { result, model } of all) {
      expect(model.clarity[0]).toBe(clarityLine(result));
      if (result.directionClarity === "close") {
        expect(model.clarity[1]).toBe(
          result.circleReading === "diverse" ? "S2-C-DIVERSE" : "S2-C-COHERENT",
        );
      }
    }
  });

  it("moves Next steps right after At a glance only when Open (§6)", () => {
    for (const { result, model } of all) {
      const afterGlance = model.sections[model.sections.indexOf("S2") + 1];
      expect(afterGlance === "S5").toBe(result.directionClarity === "open");
    }
  });

  it("shows meet cards for pairs of leaders and full directions unless Open (§6.4)", () => {
    for (const { result, model } of all) {
      const leaders = result.leadingCuriosities.length;
      const meets = model.section4.meetCards.length;
      if (leaders < 2) expect(meets).toBe(0);
      else if (result.directionClarity === "open")
        expect(meets).toBeLessThanOrEqual(3);
      else expect(meets).toBe(leaders === 2 ? 1 : 2);
      for (const direction of model.section4.directions) {
        // Six single-curiosity families: three in full, three as names.
        expect(direction.full.length).toBe(3);
        expect(direction.more.length).toBe(3);
      }
    }
  });

  it("highlights motivators only when a small set stood out (§6.2)", () => {
    for (const { result, model } of all) {
      if (result.noSmallSet) {
        expect(result.leadingMotivators).toEqual([]);
        expect(model.blocksShown).toContain("S2-R-NOSET");
      } else {
        expect(result.leadingMotivators.length).toBeGreaterThan(0);
        expect(model.blocksShown).not.toContain("S2-R-NOSET");
      }
    }
  });

  it("keeps Talk and Ask to at most four questions (§6.5)", () => {
    for (const { model } of all) {
      expect(
        model.nextSteps.talkBlocks.length + model.nextSteps.askBlocks.length,
      ).toBeLessThanOrEqual(4);
    }
  });
});
