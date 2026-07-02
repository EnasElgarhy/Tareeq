import type { Question, QuestionOption } from "./types";
import type {
  ClusterTotals,
  ConditionResult,
  RuleCondition,
  RuleEvaluation,
  RuleOperator,
  ScoringSpec,
  SpecOutcome,
} from "./spec-types";

/**
 * Custom-assessment scoring executor.
 *
 * This module is the ONLY thing that scores a Custom assessment. It is a pure,
 * deterministic function of (answers, questions, spec) — no IO, no `Date`, no
 * `Math.random`. The same inputs always produce the same `SpecOutcome`, which
 * is what makes results reproducible, testable, and auditable. AI output never
 * reaches this function: AI only produces the `ScoringSpec`; the spec is data,
 * this executor is the engine.
 */

/**
 * Weights are `numeric(5,2)` in the database, so cluster totals are sums of
 * 2-decimal values. We round to `PRECISION` decimals and compare against rule
 * thresholds with `EPSILON` tolerance, so float drift (e.g. `0.1 + 0.2`) never
 * causes a silent wrong match on the `=`/`!=` operators.
 */
const PRECISION = 4;
const EPSILON = 1e-9;

function roundTo(value: number, precision = PRECISION): number {
  const factor = 10 ** precision;
  // Plain round: DB-backed inputs (weights, thresholds) carry at most 2 decimal
  // places — well inside PRECISION — so no half-way tie bias is needed. A
  // `Number.EPSILON` nudge would skew negatives the wrong way.
  return Math.round(value * factor) / factor;
}

/**
 * Resolve the selected option for a question by letter (case-insensitive),
 * falling back to a *strict* 0-based numeric index. Only a fully-numeric answer
 * resolves as an index — "1abc" does NOT resolve to option 1.
 */
function resolveOption(
  question: Question,
  rawAnswer: string | undefined,
): QuestionOption | undefined {
  if (rawAnswer == null || rawAnswer === "") return undefined;
  const byLetter = question.options.find(
    (option) => option.letter.toLowerCase() === rawAnswer.toLowerCase(),
  );
  if (byLetter) return byLetter;
  const index = Number(rawAnswer);
  if (Number.isInteger(index) && index >= 0 && index < question.options.length) {
    return question.options[index];
  }
  return undefined;
}

/**
 * Derive per-cluster point totals from a user's raw answers — the single
 * bridge between answer data and the rule engine. Each answered option
 * contributes its `weight` (default 1) to its `clusterCode`. Questions that are
 * unanswered, free-text, or whose selected option has no cluster are ignored.
 */
export function computeClusterTotals(
  answers: Record<string, string>,
  questions: readonly Question[],
): ClusterTotals {
  const totals: ClusterTotals = {};
  for (const question of questions) {
    const option = resolveOption(question, answers[question.externalId]);
    if (!option) continue;
    // Custom assessments map answers to their own `categoryCode`; fall back to
    // `clusterCode` so the executor also works against CORE-shaped options.
    const cluster = option.categoryCode ?? option.clusterCode;
    if (!cluster) continue;
    const weight =
      typeof option.weight === "number" &&
      Number.isFinite(option.weight) &&
      option.weight > 0
        ? option.weight
        : 1;
    totals[cluster] = roundTo((totals[cluster] ?? 0) + weight);
  }
  return totals;
}

function evaluateOperator(
  operator: RuleOperator,
  actual: number,
  value: number,
): boolean {
  const a = roundTo(actual);
  const b = roundTo(value);
  switch (operator) {
    case "=":
      return Math.abs(a - b) < EPSILON;
    case "!=":
      return Math.abs(a - b) >= EPSILON;
    case ">":
      return a - b > EPSILON;
    case "<":
      return b - a > EPSILON;
    case ">=":
      return a - b > -EPSILON;
    case "<=":
      return b - a > -EPSILON;
    default: {
      // Exhaustiveness guard: an unknown operator never silently passes.
      const _exhaustive: never = operator;
      return Boolean(_exhaustive);
    }
  }
}

/**
 * Fail loud on a spec/totals that would score nondeterministically or silently
 * wrong. Publish (Phase 4) runs `validateScoringConfig` server-side before a
 * spec becomes `is_current`; this guard is the last-resort backstop for the
 * structural invariants the executor itself depends on (finite totals, ≤1
 * fallback, unique rule ids, rule→profile existence, well-formed conditions).
 * Selection is deterministic even if a future caller skips validation.
 */
function assertExecutableSpec(spec: ScoringSpec, clusterTotals: ClusterTotals): void {
  for (const [cluster, total] of Object.entries(clusterTotals)) {
    if (!Number.isFinite(total)) {
      throw new Error(`clusterTotals["${cluster}"] is not a finite number: ${total}`);
    }
  }
  const fallbackCount = spec.profiles.filter((profile) => profile.isFallback).length;
  if (fallbackCount > 1) {
    throw new Error(
      `ScoringSpec has ${fallbackCount} fallback profiles; at most one is allowed`,
    );
  }
  const profileIds = new Set(spec.profiles.map((profile) => profile.id));
  const seenRuleIds = new Set<string>();
  for (const rule of spec.rules) {
    if (seenRuleIds.has(rule.id)) {
      throw new Error(`Duplicate rule id "${rule.id}" — rule order would be ambiguous`);
    }
    seenRuleIds.add(rule.id);
    if (!profileIds.has(rule.resultProfileId)) {
      throw new Error(
        `Rule "${rule.id}" targets unknown resultProfileId "${rule.resultProfileId}"`,
      );
    }
    for (const condition of rule.conditions) {
      if (condition.valueCategory == null && !Number.isFinite(condition.value)) {
        throw new Error(
          `Rule "${rule.id}" condition on "${condition.cluster}" needs a numeric value or a valueCategory`,
        );
      }
    }
  }
}

/** Resolve a condition's right-hand side: another category's total, or a constant. */
function resolveRhs(condition: RuleCondition, totals: ClusterTotals): number {
  if (condition.valueCategory != null) return totals[condition.valueCategory] ?? 0;
  return condition.value ?? 0;
}

/**
 * Execute a `ScoringSpec` against pre-computed cluster totals.
 *
 * Strategy `first_match` (default):
 *  - Rules are evaluated in a *total* order: ascending `priority`, then
 *    ascending `id` (so equal priorities never depend on array order).
 *  - The first rule whose conditions pass assigns the profile; later rules are
 *    not evaluated. A zero-condition rule never matches.
 *  - Each condition's RHS is another category's total (`valueCategory`) or a
 *    constant (`value`), enabling both thresholds and category-vs-category.
 *
 * Strategy `highest_score_wins`:
 *  - The category with the greatest total wins (ties broken by category code,
 *    ascending — fully deterministic); the profile whose `categoryCode` matches
 *    it is returned. A non-positive top score or no mapped profile → fallback.
 *
 * On no match the profile flagged `isFallback` is returned (else null). The
 * returned `evaluation` is an ordered audit trail of every rule considered.
 * AI never reaches this function — the spec is data; this executor is the engine.
 */
export function executeScoringSpec(
  clusterTotals: ClusterTotals,
  spec: ScoringSpec,
): SpecOutcome {
  assertExecutableSpec(spec, clusterTotals);

  const fallback = spec.profiles.find((profile) => profile.isFallback) ?? null;
  const fallbackOutcome = (evaluation: RuleEvaluation[]): SpecOutcome => ({
    resultProfileId: fallback?.id ?? null,
    winningProfile: fallback,
    matchedRuleId: null,
    matchedBy: fallback ? "fallback" : "none",
    matchedByFallback: Boolean(fallback),
    clusterTotals,
    evaluation,
  });

  if ((spec.strategy ?? "first_match") === "highest_score_wins") {
    const codes = (
      spec.clusters.length > 0
        ? spec.clusters.map((c) => c.code)
        : Object.keys(clusterTotals)
    )
      .slice()
      .sort();
    let topCode: string | null = null;
    let topValue = Number.NEGATIVE_INFINITY;
    for (const code of codes) {
      const value = roundTo(clusterTotals[code] ?? 0);
      if (value > topValue) {
        topValue = value;
        topCode = code;
      }
    }
    if (topCode === null || topValue <= 0) return fallbackOutcome([]);
    // If more than one profile maps to the winning category (a data error that
    // publish-time validation flags), pick deterministically by (code, id) so
    // the winner never depends on row/array order.
    const profile =
      spec.profiles
        .filter((p) => p.categoryCode === topCode)
        .sort((a, b) => {
          const ac = a.code ?? "";
          const bc = b.code ?? "";
          if (ac !== bc) return ac < bc ? -1 : 1;
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        })[0] ?? null;
    if (!profile) return fallbackOutcome([]);
    return {
      resultProfileId: profile.id,
      winningProfile: profile,
      matchedRuleId: null,
      matchedBy: "highest_score",
      matchedByFallback: false,
      clusterTotals,
      evaluation: [],
    };
  }

  const orderedRules = [...spec.rules].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const evaluation: RuleEvaluation[] = [];

  for (const rule of orderedRules) {
    const conditionResults: ConditionResult[] = rule.conditions.map(
      (condition) => {
        const actual = clusterTotals[condition.cluster] ?? 0;
        const rhs = resolveRhs(condition, clusterTotals);
        return {
          cluster: condition.cluster,
          operator: condition.operator,
          value: rhs,
          actual,
          passed: evaluateOperator(condition.operator, actual, rhs),
        };
      },
    );

    const matched =
      rule.conditions.length === 0
        ? false
        : rule.combinator === "OR"
          ? conditionResults.some((result) => result.passed)
          : conditionResults.every((result) => result.passed);

    evaluation.push({
      ruleId: rule.id,
      resultProfileId: rule.resultProfileId,
      priority: rule.priority,
      matched,
      conditionResults,
    });

    if (matched) {
      return {
        resultProfileId: rule.resultProfileId,
        winningProfile:
          spec.profiles.find((p) => p.id === rule.resultProfileId) ?? null,
        matchedRuleId: rule.id,
        matchedBy: "rule",
        matchedByFallback: false,
        clusterTotals,
        evaluation,
      };
    }
  }

  return fallbackOutcome(evaluation);
}

/**
 * Convenience end-to-end scorer: answers → cluster totals → outcome. This is
 * the exact path the live scoring route will call for `assessment_type =
 * 'custom'`, kept here so the full chain is unit-testable in isolation.
 */
export function scoreCustomAssessment(
  answers: Record<string, string>,
  questions: readonly Question[],
  spec: ScoringSpec,
): SpecOutcome {
  return executeScoringSpec(computeClusterTotals(answers, questions), spec);
}
