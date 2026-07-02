import { describe, expect, it } from "vitest";
import { seedQuestions } from "../content/seed";
import { dispatchScore } from "./dispatch";
import type { ScoringSpec } from "./spec-types";
import type { Question } from "./types";

const coreQuestions = seedQuestions.map((q) => ({
  ...q,
  options: q.options.map((o) => ({ ...o })),
})) as unknown as Question[];

const customQuestions: Question[] = [
  {
    externalId: "Q1",
    pillar: 1,
    position: 0,
    kind: "single",
    title: { en: "x" },
    options: [
      { letter: "A", position: 0, text: { en: "a" }, categoryCode: "LEAD", weight: 3 },
      { letter: "B", position: 1, text: { en: "b" }, categoryCode: "TECH", weight: 1 },
    ],
  },
];

const customSpec: ScoringSpec = {
  version: 1,
  strategy: "first_match",
  clusters: [
    { code: "LEAD", name: { en: "Leadership" } },
    { code: "TECH", name: { en: "Technology" } },
  ],
  profiles: [
    { id: "p_lead", code: "LEADER", name: { en: "Leader" } },
    { id: "fb", name: { en: "Explorer" }, isFallback: true },
  ],
  rules: [
    {
      id: "r1",
      resultProfileId: "p_lead",
      combinator: "AND",
      conditions: [{ cluster: "LEAD", operator: ">=", value: 3 }],
      priority: 1,
    },
  ],
};

describe("dispatchScore", () => {
  it("routes core assessments to the untouched CORE engine", () => {
    const out = dispatchScore({ engine: "core", answers: {}, questions: coreQuestions });
    expect(out.engine).toBe("core");
    // CompassResult shape from the CORE engine.
    expect(out.result).toBeDefined();
    expect(out.engine === "core" && out.result).toBeTruthy();
  });

  it("routes custom assessments through the ScoringSpec executor", () => {
    const out = dispatchScore({
      engine: "custom",
      answers: { Q1: "A" },
      questions: customQuestions,
      spec: customSpec,
    });
    expect(out.engine).toBe("custom");
    if (out.engine === "custom") {
      expect(out.result.resultProfileId).toBe("p_lead");
      expect(out.result.clusterTotals).toEqual({ LEAD: 3 });
    }
  });

  it("custom assessment without a spec fails loud", () => {
    expect(() =>
      dispatchScore({ engine: "custom", answers: {}, questions: customQuestions }),
    ).toThrow(/requires a scoring spec/);
  });
});
