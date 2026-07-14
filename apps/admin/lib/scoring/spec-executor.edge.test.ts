import { describe, expect, it } from "vitest";
import { executeScoringSpec } from "./spec-executor";
import type {
  ResultRule,
  ScoringSpec,
  SpecResultProfile,
} from "./spec-types";

// Minimal builders (kept independent of the main test file).
function profile(id: string, extra: Partial<SpecResultProfile> = {}): SpecResultProfile {
  return { id, name: { en: id }, ...extra };
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
function spec(part: Partial<ScoringSpec>): ScoringSpec {
  return { version: 1, clusters: [], profiles: [], rules: [], ...part };
}

// ── Edge: no matching rule ────────────────────────────────────────────────────
describe("edge · no matching rule", () => {
  it("returns matchedBy=none / null profile when nothing matches and no fallback", () => {
    const out = executeScoringSpec(
      { LEAD: 1 },
      spec({
        profiles: [profile("P")],
        rules: [rule("r", "P", [{ cluster: "LEAD", operator: ">", value: 100 }])],
      }),
    );
    expect(out.matchedBy).toBe("none");
    expect(out.resultProfileId).toBeNull();
    expect(out.winningProfile).toBeNull();
  });

  it("returns the fallback when one exists", () => {
    const out = executeScoringSpec(
      { LEAD: 1 },
      spec({
        profiles: [profile("P"), profile("FB", { isFallback: true })],
        rules: [rule("r", "P", [{ cluster: "LEAD", operator: ">", value: 100 }])],
      }),
    );
    expect(out.matchedBy).toBe("fallback");
    expect(out.resultProfileId).toBe("FB");
  });
});

// ── Edge: multiple matching rules ─────────────────────────────────────────────
describe("edge · multiple matching rules", () => {
  it("the lowest-priority rule wins (first-match by priority)", () => {
    const out = executeScoringSpec(
      { LEAD: 20 },
      spec({
        profiles: [profile("A"), profile("B")],
        rules: [
          rule("rB", "B", [{ cluster: "LEAD", operator: ">", value: 1 }], { priority: 5 }),
          rule("rA", "A", [{ cluster: "LEAD", operator: ">", value: 1 }], { priority: 1 }),
        ],
      }),
    );
    expect(out.resultProfileId).toBe("A");
    expect(out.matchedRuleId).toBe("rA");
  });

  it("ties on priority break deterministically by rule id (array order irrelevant)", () => {
    const build = (rules: ResultRule[]) =>
      executeScoringSpec(
        { LEAD: 20 },
        spec({ profiles: [profile("A"), profile("B")], rules }),
      ).resultProfileId;
    const a = rule("aaa", "A", [{ cluster: "LEAD", operator: ">", value: 1 }], { priority: 0 });
    const b = rule("bbb", "B", [{ cluster: "LEAD", operator: ">", value: 1 }], { priority: 0 });
    expect(build([a, b])).toBe("A");
    expect(build([b, a])).toBe("A");
  });
});

// ── Edge: missing / deleted profile referenced by a rule ──────────────────────
describe("edge · rule targets a missing profile", () => {
  it("fails loud (publish validation must catch this; preview catches the throw)", () => {
    const s = spec({
      profiles: [profile("REAL")],
      rules: [rule("r", "GHOST", [{ cluster: "LEAD", operator: ">=", value: 1 }])],
    });
    expect(() => executeScoringSpec({ LEAD: 5 }, s)).toThrow(
      /unknown resultProfileId "GHOST"/,
    );
  });
});

// ── Edge: rule references a deleted/unknown category ──────────────────────────
describe("edge · rule references an unknown category", () => {
  it("treats the missing category's total as 0 — deterministic, no throw", () => {
    const noMatch = executeScoringSpec(
      { LEAD: 9 },
      spec({
        profiles: [profile("P"), profile("FB", { isFallback: true })],
        rules: [rule("r", "P", [{ cluster: "DELETED", operator: ">=", value: 1 }])],
      }),
    );
    expect(noMatch.resultProfileId).toBe("FB"); // 0 >= 1 is false

    const match = executeScoringSpec(
      { LEAD: 9 },
      spec({
        profiles: [profile("P")],
        rules: [rule("r", "P", [{ cluster: "DELETED", operator: "<=", value: 0 }])],
      }),
    );
    expect(match.resultProfileId).toBe("P"); // 0 <= 0 is true
  });
});

// ── Edge: threshold ties (actual === value) ───────────────────────────────────
describe("edge · threshold ties", () => {
  const at = (operator: "=" | ">" | ">=" | "<" | "<=") =>
    executeScoringSpec(
      { LEAD: 12 },
      spec({
        profiles: [profile("P"), profile("FB", { isFallback: true })],
        rules: [rule("r", "P", [{ cluster: "LEAD", operator, value: 12 }])],
      }),
    ).resultProfileId;

  it("boundary value: >= and = and <= match; > and < do not", () => {
    expect(at(">=")).toBe("P");
    expect(at("=")).toBe("P");
    expect(at("<=")).toBe("P");
    expect(at(">")).toBe("FB");
    expect(at("<")).toBe("FB");
  });
});

// ── Edge: category comparison ties (TECH === LEAD) ────────────────────────────
describe("edge · category comparison ties", () => {
  const cmp = (operator: ">" | ">=" | "=") =>
    executeScoringSpec(
      { TECH: 8, LEAD: 8 },
      spec({
        profiles: [profile("P"), profile("FB", { isFallback: true })],
        rules: [rule("r", "P", [{ cluster: "TECH", operator, valueCategory: "LEAD" }])],
      }),
    ).resultProfileId;

  it("equal categories: > does not match, >= and = do", () => {
    expect(cmp(">")).toBe("FB");
    expect(cmp(">=")).toBe("P");
    expect(cmp("=")).toBe("P");
  });
});

// ── Edge: highest_score ties ──────────────────────────────────────────────────
describe("edge · highest_score ties", () => {
  it("ties resolve to the lexicographically-first category code (deterministic)", () => {
    const s = spec({
      strategy: "highest_score_wins",
      clusters: [
        { code: "LEAD", name: { en: "L" } },
        { code: "TECH", name: { en: "T" } },
      ],
      profiles: [
        profile("P_LEAD", { categoryCode: "LEAD" }),
        profile("P_TECH", { categoryCode: "TECH" }),
      ],
    });
    expect(executeScoringSpec({ LEAD: 8, TECH: 8 }, s).resultProfileId).toBe("P_LEAD");
  });

  it("duplicate categoryCode resolves deterministically by (code,id) — array order irrelevant", () => {
    const make = (profiles: SpecResultProfile[]) =>
      executeScoringSpec(
        { TECH: 10 },
        spec({
          strategy: "highest_score_wins",
          clusters: [{ code: "TECH", name: { en: "T" } }],
          profiles,
        }),
      ).resultProfileId;
    const a = profile("pa", { code: "AAA", categoryCode: "TECH" });
    const b = profile("pb", { code: "BBB", categoryCode: "TECH" });
    // Both map to TECH; lower code "AAA" wins regardless of array order.
    expect(make([a, b])).toBe("pa");
    expect(make([b, a])).toBe("pa");
  });
});

// ── Backward-compat: no strategy field defaults to first_match ────────────────
describe("edge · backward compatibility", () => {
  it("a spec without a strategy field behaves as first_match", () => {
    const out = executeScoringSpec(
      { LEAD: 10 },
      spec({
        // no `strategy`
        profiles: [profile("P")],
        rules: [rule("r", "P", [{ cluster: "LEAD", operator: ">=", value: 5 }])],
      }),
    );
    expect(out.matchedBy).toBe("rule");
    expect(out.resultProfileId).toBe("P");
  });

  it("CORE-style options (clusterCode, no categoryCode) still score", () => {
    // computeClusterTotals path is covered in the main suite; here we confirm the
    // executor itself is agnostic to how totals were produced.
    const out = executeScoringSpec(
      { ENG: 3 },
      spec({ profiles: [profile("P")], rules: [rule("r", "P", [{ cluster: "ENG", operator: "=", value: 3 }])] }),
    );
    expect(out.resultProfileId).toBe("P");
  });
});
