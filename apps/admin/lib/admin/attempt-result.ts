import type { AssessmentGeneration } from "@/lib/admin/assessment-generation";
import { extractCoreResult } from "@/lib/admin/analytics/aggregate";
import { CORE_QUESTION_SET } from "@/lib/admin/core/framework";
import { summarizeCoreResult } from "@/lib/admin/core/result";

/**
 * One-line result for an attempt, read with its own generation's rules: CORE
 * 2.0 by leading curiosities, v4 and custom by top cluster. A CORE result is
 * never read as v4 or the other way round.
 */
export function attemptHeadline(
  generation: AssessmentGeneration | null,
  result: unknown,
): string | null {
  if (generation === "core-2.0") {
    const core = summarizeCoreResult(CORE_QUESTION_SET, result);
    return core && core.leadingCuriosities.length > 0
      ? core.leadingCuriosities.join(" · ")
      : null;
  }
  if (!generation) return null;
  return extractCoreResult(result)?.topCluster ?? null;
}

/** v4 archetype; CORE 2.0 has none. */
export function attemptArchetype(
  generation: AssessmentGeneration | null,
  result: unknown,
): string | null {
  if (generation === "core-2.0" || !generation) return null;
  return extractCoreResult(result)?.archetype ?? null;
}
