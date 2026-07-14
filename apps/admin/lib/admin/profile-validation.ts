import type { RuleOperator, ScoringStrategy } from "@/lib/scoring/spec-types";

/**
 * Pure validators for Phase 3 result profiles, rules, and the overall scoring
 * config. No IO — run client-side (instant feedback) and server-side
 * (authoritative). Returns human-readable errors; empty array = valid.
 */

export interface ProfileValidationInput {
  code: string;
  title: Record<string, string>; // { en, ar }
}

export function validateResultProfile(
  input: ProfileValidationInput,
  existingCodes: readonly string[],
): string[] {
  const errors: string[] = [];
  const code = (input.code ?? "").trim().toUpperCase();
  if (!code) {
    errors.push("Profile code is required.");
  } else if (!/^[A-Z0-9_]+$/.test(code)) {
    errors.push("Code can only contain letters, numbers, and underscores.");
  } else if (existingCodes.map((c) => c.toUpperCase()).includes(code)) {
    errors.push(`Profile code "${code}" already exists.`);
  }
  if (!(input.title?.en ?? "").trim()) {
    errors.push("English title is required.");
  }
  return errors;
}

export interface RuleConditionInput {
  cluster: string;
  operator: RuleOperator;
  value?: number;
  valueCategory?: string | null;
}

export interface RuleValidationInput {
  resultProfileId: string;
  conditions: RuleConditionInput[];
}

export function validateProfileRule(
  input: RuleValidationInput,
  validProfileIds: readonly string[],
  validCategoryCodes: readonly string[],
): string[] {
  const errors: string[] = [];
  if (!input.resultProfileId || !validProfileIds.includes(input.resultProfileId)) {
    errors.push("Rule must point to an existing result profile.");
  }
  if (!input.conditions || input.conditions.length === 0) {
    errors.push("A rule needs at least one condition.");
  }
  const categories = new Set(validCategoryCodes);
  for (const condition of input.conditions ?? []) {
    if (!categories.has(condition.cluster)) {
      errors.push(`Condition references unknown category "${condition.cluster}".`);
    }
    if (condition.valueCategory != null && condition.valueCategory !== "") {
      if (!categories.has(condition.valueCategory)) {
        errors.push(
          `Condition compares against unknown category "${condition.valueCategory}".`,
        );
      }
    } else if (!Number.isFinite(condition.value)) {
      errors.push(`Condition on "${condition.cluster}" needs a numeric value.`);
    }
  }
  return errors;
}

export interface ScoringConfigInput {
  strategy: ScoringStrategy;
  categories: readonly string[];
  profiles: readonly { id: string; categoryCode?: string | null }[];
  ruleCount: number;
}

/**
 * Whole-assessment readiness check (used before publish / as a Preview warning).
 */
export function validateScoringConfig(input: ScoringConfigInput): string[] {
  const errors: string[] = [];
  if (input.categories.length === 0) {
    errors.push("Add at least one scoring category.");
  }
  if (input.profiles.length === 0) {
    errors.push("Add at least one result profile.");
  }
  if (input.strategy === "highest_score_wins") {
    const counts = new Map<string, number>();
    for (const p of input.profiles) {
      if (p.categoryCode) counts.set(p.categoryCode, (counts.get(p.categoryCode) ?? 0) + 1);
    }
    const unmapped = input.categories.filter((c) => !counts.has(c));
    if (unmapped.length > 0) {
      errors.push(
        `Highest-score mode: no profile is mapped to category(s) ${unmapped.join(", ")}.`,
      );
    }
    const duplicates = [...counts.entries()]
      .filter(([, n]) => n > 1)
      .map(([code]) => code);
    if (duplicates.length > 0) {
      errors.push(
        `More than one profile maps to category(s) ${duplicates.join(", ")} — only one can win.`,
      );
    }
  } else if (input.ruleCount === 0) {
    errors.push("First-match mode needs at least one rule.");
  }
  return errors;
}
