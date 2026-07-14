import type {
  RuleCondition,
  ScoringSpec,
  ScoringStrategy,
} from "@/lib/scoring/spec-types";

/**
 * Pure bridge: DB-shaped rows → a `ScoringSpec` the engine can execute. Used by
 * the admin Preview (client) and, later, by publish (server) — one assembler, so
 * preview and production can never diverge. No IO.
 */

export interface SpecCategoryRow {
  code: string;
  name: Record<string, string>;
}

export interface SpecProfileRow {
  id: string;
  code: string | null;
  name: Record<string, string>;
  description: Record<string, string> | null;
  category_code: string | null;
  recommended_majors: Record<string, string[]> | null;
  recommended_careers: Record<string, string[]> | null;
  strengths: Record<string, string[]> | null;
  development_areas: Record<string, string[]> | null;
  is_fallback: boolean;
}

export interface SpecRuleRow {
  id: string;
  result_profile_id: string;
  combinator: "AND" | "OR";
  conditions: RuleCondition[];
  priority: number;
}

export interface AssembleInput {
  strategy: ScoringStrategy;
  categories: SpecCategoryRow[];
  profiles: SpecProfileRow[];
  rules: SpecRuleRow[];
}

function listOrUndefined(
  value: Record<string, string[]> | null,
): Record<string, string[]> | undefined {
  if (!value || Object.keys(value).length === 0) return undefined;
  return value;
}

export function assembleScoringSpec(input: AssembleInput): ScoringSpec {
  return {
    version: 1,
    strategy: input.strategy,
    clusters: input.categories.map((c) => ({ code: c.code, name: c.name })),
    profiles: input.profiles.map((p) => ({
      id: p.id,
      code: p.code ?? undefined,
      name: p.name,
      description: p.description ?? undefined,
      categoryCode: p.category_code ?? undefined,
      recommendedMajors: listOrUndefined(p.recommended_majors),
      recommendedCareers: listOrUndefined(p.recommended_careers),
      strengths: listOrUndefined(p.strengths),
      developmentAreas: listOrUndefined(p.development_areas),
      isFallback: p.is_fallback,
    })),
    rules: input.rules.map((r) => ({
      id: r.id,
      resultProfileId: r.result_profile_id,
      combinator: r.combinator,
      conditions: r.conditions ?? [],
      priority: r.priority,
    })),
  };
}
