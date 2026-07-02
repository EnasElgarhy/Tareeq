import { describe, expect, it } from "vitest";
import { executeScoringSpec } from "@/lib/scoring/spec-executor";
import { assembleScoringSpec, type AssembleInput } from "./assemble-spec";

const base: AssembleInput = {
  strategy: "first_match",
  categories: [
    { code: "LEAD", name: { en: "Leadership", ar: "القيادة" } },
    { code: "TECH", name: { en: "Technology", ar: "التقنية" } },
  ],
  profiles: [
    {
      id: "p1",
      code: "LEADER",
      name: { en: "Leader", ar: "قائد" },
      description: { en: "Leads", ar: "يقود" },
      category_code: "LEAD",
      recommended_majors: { en: ["Business"], ar: ["إدارة"] },
      recommended_careers: null,
      strengths: {},
      development_areas: null,
      is_fallback: false,
    },
    {
      id: "p2",
      code: "EXPLORER",
      name: { en: "Explorer" },
      description: null,
      category_code: null,
      recommended_majors: null,
      recommended_careers: null,
      strengths: null,
      development_areas: null,
      is_fallback: true,
    },
  ],
  rules: [
    {
      id: "r1",
      result_profile_id: "p1",
      combinator: "AND",
      conditions: [{ cluster: "LEAD", operator: ">=", value: 10 }],
      priority: 1,
    },
  ],
};

describe("assembleScoringSpec", () => {
  it("maps DB rows into a ScoringSpec the engine can execute", () => {
    const spec = assembleScoringSpec(base);
    expect(spec.strategy).toBe("first_match");
    expect(spec.clusters.map((c) => c.code)).toEqual(["LEAD", "TECH"]);
    expect(spec.profiles[0]).toMatchObject({ id: "p1", code: "LEADER", categoryCode: "LEAD" });
    expect(spec.profiles[0].recommendedMajors).toEqual({ en: ["Business"], ar: ["إدارة"] });

    // Empty list objects collapse to undefined (not empty {}).
    expect(spec.profiles[0].strengths).toBeUndefined();

    const out = executeScoringSpec({ LEAD: 12 }, spec);
    expect(out.resultProfileId).toBe("p1");
    expect(out.winningProfile?.code).toBe("LEADER");
  });

  it("produces a highest_score_wins spec that resolves by category", () => {
    const spec = assembleScoringSpec({ ...base, strategy: "highest_score_wins" });
    const out = executeScoringSpec({ LEAD: 4, TECH: 9 }, spec);
    // No profile maps to TECH → fallback profile.
    expect(out.resultProfileId).toBe("p2");
    const out2 = executeScoringSpec({ LEAD: 9, TECH: 2 }, spec);
    expect(out2.resultProfileId).toBe("p1"); // p1 maps to LEAD
  });
});
