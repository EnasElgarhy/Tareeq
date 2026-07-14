import { describe, expect, it } from "vitest";
import {
  computeClusterTotals,
  executeScoringSpec,
  scoreCustomAssessment,
} from "./spec-executor";
import type {
  ResultRule,
  RuleOperator,
  ScoringSpec,
  SpecResultProfile,
} from "./spec-types";
import type { Question, QuestionOption } from "./types";

// ── builders ────────────────────────────────────────────────────────────────

function profile(id: string, isFallback = false): SpecResultProfile {
  return { id, name: { en: id, ar: id }, isFallback };
}

function rule(
  id: string,
  resultProfileId: string,
  conditions: ResultRule["conditions"],
  opts: Partial<Pick<ResultRule, "combinator" | "priority">> = {},
): ResultRule {
  return {
    id,
    resultProfileId,
    conditions,
    combinator: opts.combinator ?? "AND",
    priority: opts.priority ?? 0,
  };
}

function spec(rules: ResultRule[], profiles: SpecResultProfile[]): ScoringSpec {
  return { version: 1, clusters: [], profiles, rules };
}

function opt(
  letter: string,
  position: number,
  clusterCode?: string,
  weight?: number,
): QuestionOption {
  return {
    letter,
    position,
    text: { en: letter, ar: letter },
    // ScoringSpec clusters are open strings; cast keeps the Core type happy.
    clusterCode: clusterCode as QuestionOption["clusterCode"],
    weight,
  };
}

function question(externalId: string, options: QuestionOption[]): Question {
  return {
    externalId,
    pillar: 1,
    position: 0,
    kind: "single",
    title: { en: externalId, ar: externalId },
    options,
  };
}

// ── operators ─────────────────────────────────────────────────────────────────

describe("executeScoringSpec — operators", () => {
  const cases: Array<{
    op: RuleOperator;
    actual: number;
    value: number;
    pass: boolean;
  }> = [
    { op: "=", actual: 5, value: 5, pass: true },
    { op: "=", actual: 5, value: 6, pass: false },
    { op: "!=", actual: 5, value: 6, pass: true },
    { op: "!=", actual: 5, value: 5, pass: false },
    { op: ">", actual: 6, value: 5, pass: true },
    { op: ">", actual: 5, value: 5, pass: false },
    { op: "<", actual: 4, value: 5, pass: true },
    { op: "<", actual: 5, value: 5, pass: false },
    { op: ">=", actual: 5, value: 5, pass: true },
    { op: ">=", actual: 4, value: 5, pass: false },
    { op: "<=", actual: 5, value: 5, pass: true },
    { op: "<=", actual: 6, value: 5, pass: false },
  ];

  it.each(cases)(
    "$op with actual=$actual value=$value matches=$pass",
    ({ op, actual, value, pass }) => {
      const s = spec(
        [rule("r1", "MATCH", [{ cluster: "X", operator: op, value }])],
        [profile("MATCH"), profile("FALLBACK", true)],
      );
      const out = executeScoringSpec({ X: actual }, s);
      expect(out.resultProfileId).toBe(pass ? "MATCH" : "FALLBACK");
      expect(out.matchedByFallback).toBe(!pass);
    },
  );

  it("treats a missing cluster total as 0", () => {
    const s = spec(
      [rule("r1", "ZERO", [{ cluster: "ABSENT", operator: "=", value: 0 }])],
      [profile("ZERO")],
    );
    expect(executeScoringSpec({ X: 99 }, s).resultProfileId).toBe("ZERO");
  });
});

// ── AND / OR combinators ──────────────────────────────────────────────────────

describe("executeScoringSpec — combinators", () => {
  const conditions = [
    { cluster: "ENG", operator: ">" as RuleOperator, value: 10 },
    { cluster: "SCI", operator: ">" as RuleOperator, value: 10 },
  ];

  it("AND requires every condition", () => {
    const s = spec(
      [rule("r1", "P", conditions, { combinator: "AND" })],
      [profile("P"), profile("F", true)],
    );
    expect(executeScoringSpec({ ENG: 12, SCI: 12 }, s).resultProfileId).toBe("P");
    expect(executeScoringSpec({ ENG: 12, SCI: 8 }, s).resultProfileId).toBe("F");
  });

  it("OR requires any condition", () => {
    const s = spec(
      [rule("r1", "P", conditions, { combinator: "OR" })],
      [profile("P"), profile("F", true)],
    );
    expect(executeScoringSpec({ ENG: 12, SCI: 8 }, s).resultProfileId).toBe("P");
    expect(executeScoringSpec({ ENG: 8, SCI: 8 }, s).resultProfileId).toBe("F");
  });

  it("a rule with zero conditions never matches", () => {
    const s = spec(
      [rule("empty", "P", [])],
      [profile("P"), profile("F", true)],
    );
    expect(executeScoringSpec({ ENG: 999 }, s).resultProfileId).toBe("F");
  });
});

// ── precedence (first-match) ──────────────────────────────────────────────────

describe("executeScoringSpec — precedence", () => {
  it("first matching rule by priority wins", () => {
    const s = spec(
      [
        rule("low", "SECOND", [{ cluster: "ENG", operator: ">", value: 5 }], {
          priority: 10,
        }),
        rule("high", "FIRST", [{ cluster: "ENG", operator: ">", value: 5 }], {
          priority: 1,
        }),
      ],
      [profile("FIRST"), profile("SECOND")],
    );
    const out = executeScoringSpec({ ENG: 9 }, s);
    expect(out.resultProfileId).toBe("FIRST");
    expect(out.matchedRuleId).toBe("high");
  });

  it("breaks priority ties deterministically by rule id", () => {
    const build = (order: ResultRule[]) =>
      executeScoringSpec(
        { ENG: 9 },
        spec(order, [profile("A"), profile("B")]),
      ).resultProfileId;

    const ruleA = rule("aaa", "A", [{ cluster: "ENG", operator: ">", value: 5 }], {
      priority: 0,
    });
    const ruleB = rule("bbb", "B", [{ cluster: "ENG", operator: ">", value: 5 }], {
      priority: 0,
    });

    // Same priority → lower id ("aaa") always wins, regardless of array order.
    expect(build([ruleA, ruleB])).toBe("A");
    expect(build([ruleB, ruleA])).toBe("A");
  });

  it("falls back when no rule matches, else returns null", () => {
    const withFallback = spec(
      [rule("r1", "P", [{ cluster: "ENG", operator: ">", value: 100 }])],
      [profile("P"), profile("F", true)],
    );
    expect(executeScoringSpec({ ENG: 1 }, withFallback).resultProfileId).toBe("F");
    expect(executeScoringSpec({ ENG: 1 }, withFallback).matchedByFallback).toBe(true);

    const noFallback = spec(
      [rule("r1", "P", [{ cluster: "ENG", operator: ">", value: 100 }])],
      [profile("P")],
    );
    expect(executeScoringSpec({ ENG: 1 }, noFallback).resultProfileId).toBeNull();
    expect(executeScoringSpec({ ENG: 1 }, noFallback).matchedByFallback).toBe(false);
  });
});

// ── determinism ───────────────────────────────────────────────────────────────

describe("executeScoringSpec — determinism", () => {
  it("is referentially identical for identical inputs and order-independent", () => {
    const rules = [
      rule("r2", "B", [{ cluster: "SCI", operator: ">=", value: 3 }], { priority: 2 }),
      rule("r1", "A", [{ cluster: "ENG", operator: ">=", value: 3 }], { priority: 1 }),
    ];
    const totals = { ENG: 4, SCI: 4 };

    const a = executeScoringSpec(totals, spec(rules, [profile("A"), profile("B")]));
    const b = executeScoringSpec(
      totals,
      spec([...rules].reverse(), [profile("A"), profile("B")]),
    );
    expect(a.resultProfileId).toBe("A");
    expect(b.resultProfileId).toBe("A");
    expect(a.resultProfileId).toBe(b.resultProfileId);
  });
});

// ── decimal-weight safety (HIGH-6) ────────────────────────────────────────────

describe("executeScoringSpec — float-safe comparisons", () => {
  it("matches '=' on totals that drift in IEEE-754 (0.1 + 0.2)", () => {
    const totals = computeClusterTotals(
      { Q1: "A", Q2: "B" },
      [
        question("Q1", [opt("A", 0, "SCI", 0.1)]),
        question("Q2", [opt("B", 0, "SCI", 0.2)]),
      ],
    );
    // Raw IEEE-754 would be 0.30000000000000004; the executor rounds first.
    const s = spec(
      [rule("r1", "P", [{ cluster: "SCI", operator: "=", value: 0.3 }])],
      [profile("P"), profile("F", true)],
    );
    expect(executeScoringSpec(totals, s).resultProfileId).toBe("P");
  });
});

// ── computeClusterTotals ──────────────────────────────────────────────────────

describe("computeClusterTotals", () => {
  const questions = [
    question("Q1", [opt("A", 0, "ENG", 2), opt("B", 1, "ART", 1)]),
    question("Q2", [opt("A", 0, "ENG", 1), opt("B", 1, "SCI", 3)]),
    question("Q3", [opt("A", 0, "SCI")]), // no weight → defaults to 1
    question("QT", []), // free-text, no options
  ];

  it("sums weights into the selected option's cluster", () => {
    expect(computeClusterTotals({ Q1: "A", Q2: "B", Q3: "A" }, questions)).toEqual({
      ENG: 2,
      SCI: 4,
    });
  });

  it("defaults a missing weight to 1", () => {
    expect(computeClusterTotals({ Q3: "A" }, questions)).toEqual({ SCI: 1 });
  });

  it("resolves answers by 0-based numeric index too", () => {
    expect(computeClusterTotals({ Q1: "0" }, questions)).toEqual({ ENG: 2 });
  });

  it("ignores unanswered, free-text, and cluster-less selections", () => {
    expect(computeClusterTotals({ QT: "anything" }, questions)).toEqual({});
    expect(computeClusterTotals({}, questions)).toEqual({});
  });

  it("prefers a custom categoryCode over clusterCode", () => {
    const q: Question = {
      externalId: "Q1",
      pillar: 1,
      position: 0,
      kind: "single",
      title: { en: "x" },
      options: [{ letter: "A", position: 0, text: { en: "a" }, categoryCode: "LEAD", weight: 2 }],
    };
    expect(computeClusterTotals({ Q1: "A" }, [q])).toEqual({ LEAD: 2 });
  });
});

// ── full integration: answers → totals → outcome (HIGH-7) ─────────────────────

describe("scoreCustomAssessment — end to end", () => {
  const questions = [
    question("Q1", [opt("A", 0, "ENG", 2), opt("B", 1, "ART", 1)]),
    question("Q2", [opt("A", 0, "ENG", 1), opt("B", 1, "SCI", 3)]),
    question("Q3", [opt("A", 0, "SCI", 1), opt("B", 1, "ART", 1)]),
  ];

  const stemSpec = spec(
    [
      rule(
        "stem",
        "STEM_BUILDER",
        [
          { cluster: "ENG", operator: ">=", value: 2 },
          { cluster: "SCI", operator: ">=", value: 4 },
        ],
        { combinator: "AND", priority: 1 },
      ),
      rule(
        "creative",
        "CREATIVE",
        [{ cluster: "ART", operator: ">=", value: 2 }],
        { priority: 2 },
      ),
    ],
    [profile("STEM_BUILDER"), profile("CREATIVE"), profile("EXPLORER", true)],
  );

  it("routes a STEM answer set to the STEM profile", () => {
    // ENG = 2 (Q1/A), SCI = 3 (Q2/B) + 1 (Q3/A) = 4 → STEM rule passes.
    const out = scoreCustomAssessment({ Q1: "A", Q2: "B", Q3: "A" }, questions, stemSpec);
    expect(out.clusterTotals).toEqual({ ENG: 2, SCI: 4 });
    expect(out.resultProfileId).toBe("STEM_BUILDER");
    expect(out.matchedRuleId).toBe("stem");
  });

  it("routes a creative answer set to the CREATIVE profile", () => {
    // ART = 1 (Q1/B) + 1 (Q3/B) = 2; ENG/SCI below STEM thresholds.
    const out = scoreCustomAssessment({ Q1: "B", Q2: "A", Q3: "B" }, questions, stemSpec);
    expect(out.clusterTotals).toEqual({ ART: 2, ENG: 1 });
    expect(out.resultProfileId).toBe("CREATIVE");
  });

  it("falls back to EXPLORER when nothing matches", () => {
    // Only Q2/A answered → ENG = 1: below every rule threshold.
    const out = scoreCustomAssessment({ Q2: "A" }, questions, stemSpec);
    expect(out.resultProfileId).toBe("EXPLORER");
    expect(out.matchedByFallback).toBe(true);
  });
});

// ── strict answer resolution (HIGH-1) ─────────────────────────────────────────

describe("computeClusterTotals — strict numeric-index resolution", () => {
  const questions = [question("Q1", [opt("A", 0, "ENG"), opt("B", 1, "SCI")])];

  it("does not resolve an out-of-range index", () => {
    expect(computeClusterTotals({ Q1: "2" }, questions)).toEqual({});
  });

  it("does not resolve a non-numeric answer like '1abc' as index 1", () => {
    expect(computeClusterTotals({ Q1: "1abc" }, questions)).toEqual({});
  });

  it("treats a non-positive weight as the default of 1", () => {
    const qs = [question("Q1", [opt("A", 0, "ENG", 0)])];
    expect(computeClusterTotals({ Q1: "A" }, qs)).toEqual({ ENG: 1 });
  });
});

// ── spec integrity guards (HIGH-2 + MEDIUM findings) ──────────────────────────

describe("executeScoringSpec — integrity guards", () => {
  it("throws on duplicate rule ids", () => {
    const s = spec(
      [
        rule("dup", "A", [{ cluster: "ENG", operator: ">", value: 1 }]),
        rule("dup", "B", [{ cluster: "ENG", operator: ">", value: 1 }]),
      ],
      [profile("A"), profile("B")],
    );
    expect(() => executeScoringSpec({ ENG: 5 }, s)).toThrow(/duplicate rule id/i);
  });

  it("throws when more than one profile is a fallback", () => {
    const s = spec([], [profile("F1", true), profile("F2", true)]);
    expect(() => executeScoringSpec({}, s)).toThrow(/fallback/i);
  });

  it("throws when a rule targets a profile that does not exist", () => {
    const s = spec(
      [rule("r1", "GHOST", [{ cluster: "ENG", operator: ">", value: 0 }])],
      [profile("REAL")],
    );
    expect(() => executeScoringSpec({ ENG: 1 }, s)).toThrow(/unknown resultProfileId/i);
  });

  it("throws on a non-finite condition value", () => {
    const s = spec(
      [rule("r1", "P", [{ cluster: "ENG", operator: ">", value: Number.NaN }])],
      [profile("P")],
    );
    expect(() => executeScoringSpec({ ENG: 1 }, s)).toThrow(
      /numeric value or a valueCategory/i,
    );
  });

  it("throws on a non-finite cluster total", () => {
    const s = spec(
      [rule("r1", "P", [{ cluster: "ENG", operator: ">", value: 1 }])],
      [profile("P")],
    );
    expect(() => executeScoringSpec({ ENG: Number.NaN }, s)).toThrow(/finite/i);
  });

  it("returns null for an empty spec without throwing", () => {
    const out = executeScoringSpec({}, spec([], []));
    expect(out.resultProfileId).toBeNull();
    expect(out.matchedByFallback).toBe(false);
    expect(out.evaluation).toHaveLength(0);
  });

  it("resolves a condition on a cluster absent from totals as 0", () => {
    const s = spec(
      [rule("r1", "P", [{ cluster: "PHANTOM", operator: "=", value: 0 }])],
      [profile("P"), profile("F", true)],
    );
    expect(executeScoringSpec({ ENG: 9 }, s).resultProfileId).toBe("P");
  });
});

// ── audit trail ───────────────────────────────────────────────────────────────

describe("executeScoringSpec — audit trail", () => {
  it("records only rules up to and including the match", () => {
    const s = spec(
      [
        rule("r1", "MATCH", [{ cluster: "ENG", operator: ">", value: 5 }], {
          priority: 1,
        }),
        rule("r2", "NEVER", [{ cluster: "ENG", operator: ">", value: 5 }], {
          priority: 2,
        }),
      ],
      [profile("MATCH"), profile("NEVER")],
    );
    const out = executeScoringSpec({ ENG: 9 }, s);
    expect(out.evaluation).toHaveLength(1);
    expect(out.evaluation[0]).toMatchObject({ ruleId: "r1", matched: true });
    expect(out.evaluation[0].conditionResults[0]).toMatchObject({
      actual: 9,
      passed: true,
    });
  });
});

// ── Phase 3: highest_score_wins strategy ─────────────────────────────────────

describe("executeScoringSpec — highest_score_wins", () => {
  function catProfile(id: string, categoryCode: string): SpecResultProfile {
    return { id, name: { en: id }, categoryCode };
  }
  function highestSpec(profiles: SpecResultProfile[]): ScoringSpec {
    return {
      version: 1,
      strategy: "highest_score_wins",
      clusters: [
        { code: "LEAD", name: { en: "Leadership" } },
        { code: "TECH", name: { en: "Technology" } },
        { code: "DESIGN", name: { en: "Design" } },
      ],
      profiles,
      rules: [],
    };
  }
  const full = () =>
    highestSpec([
      catProfile("P_LEAD", "LEAD"),
      catProfile("P_TECH", "TECH"),
      catProfile("P_DESIGN", "DESIGN"),
      { id: "FB", name: { en: "FB" }, isFallback: true },
    ]);

  it("returns the profile mapped to the top-scoring category", () => {
    const out = executeScoringSpec({ LEAD: 5, TECH: 12, DESIGN: 3 }, full());
    expect(out.resultProfileId).toBe("P_TECH");
    expect(out.matchedBy).toBe("highest_score");
    expect(out.winningProfile?.id).toBe("P_TECH");
  });

  it("breaks ties deterministically by category code ascending", () => {
    // LEAD & TECH tie at 8; sorted [DESIGN, LEAD, TECH] → LEAD set as max first, TECH not strictly greater.
    const out = executeScoringSpec({ LEAD: 8, TECH: 8, DESIGN: 3 }, full());
    expect(out.resultProfileId).toBe("P_LEAD");
  });

  it("falls back when all category totals are zero/absent", () => {
    const out = executeScoringSpec({}, full());
    expect(out.resultProfileId).toBe("FB");
    expect(out.matchedByFallback).toBe(true);
  });

  it("falls back when the top category has no mapped profile", () => {
    const out = executeScoringSpec(
      { TECH: 10 },
      highestSpec([{ id: "FB", name: { en: "FB" }, isFallback: true }]),
    );
    expect(out.resultProfileId).toBe("FB");
    expect(out.matchedBy).toBe("fallback");
  });
});

// ── Phase 3: category-vs-category conditions + outcome shape ──────────────────

describe("executeScoringSpec — category comparison + outcome shape", () => {
  it("matches when one category beats another via valueCategory (TECH > LEAD)", () => {
    const s: ScoringSpec = {
      version: 1,
      clusters: [],
      profiles: [profile("TECHPRO"), profile("FB", true)],
      rules: [
        rule("r1", "TECHPRO", [{ cluster: "TECH", operator: ">", valueCategory: "LEAD" }]),
      ],
    };
    expect(executeScoringSpec({ TECH: 10, LEAD: 4 }, s).resultProfileId).toBe("TECHPRO");
    expect(executeScoringSpec({ TECH: 3, LEAD: 9 }, s).resultProfileId).toBe("FB");
  });

  it("resolves winningProfile and matchedBy=rule on a rule match", () => {
    const out = executeScoringSpec(
      { X: 5 },
      spec([rule("r1", "P", [{ cluster: "X", operator: ">=", value: 1 }])], [profile("P"), profile("FB", true)]),
    );
    expect(out.matchedBy).toBe("rule");
    expect(out.winningProfile?.id).toBe("P");
  });

  it("matchedBy=none with no match and no fallback", () => {
    const out = executeScoringSpec(
      { X: 1 },
      spec([rule("r1", "P", [{ cluster: "X", operator: ">", value: 100 }])], [profile("P")]),
    );
    expect(out.matchedBy).toBe("none");
    expect(out.winningProfile).toBeNull();
  });
});
