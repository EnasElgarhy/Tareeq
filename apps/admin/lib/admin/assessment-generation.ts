/**
 * Which assessment model a content version or attempt belongs to. CORE 2.0
 * (question set 5.x, scoring "2.0") and the archived v4 assessment (54
 * questions, cluster/archetype scoring "1.x") share the `content_versions` and
 * `assessments` tables, so every admin read that counts, lists, analyses or
 * exports attempts must pick one generation first. Pure, so it can be tested
 * without a database.
 */

export type AssessmentGeneration = "core-2.0" | "legacy-v4" | "custom";

/**
 * The content_versions row CORE attempts are stored under. Mirrors
 * CORE_QUESTION_SET_LABEL in apps/consumer/lib/core-v2/assessment.ts; the label
 * is kept stable there so existing attempts keep resolving.
 */
export const CORE_VERSION_LABEL = "core-5.1-interim-2026-10-15";

/** How the CMS names the CORE 2.0 assessment (its version row label is technical). */
export const CORE_DISPLAY_NAME = "CORE 2.0 assessment";

export const CORE_SCORING_VERSION = "2.0";
export const LEGACY_SCORING_VERSION = "1.x";

export const GENERATION_LABELS: Record<AssessmentGeneration, string> = {
  "core-2.0": "CORE 2.0",
  "legacy-v4": "Legacy v4",
  custom: "Custom",
};

export const GENERATION_SCORING: Record<AssessmentGeneration, string | null> = {
  "core-2.0": CORE_SCORING_VERSION,
  "legacy-v4": LEGACY_SCORING_VERSION,
  custom: null,
};

export interface VersionIdentity {
  id: string;
  label: string;
  catalog_id?: string | null;
}

export function classifyVersion(
  version: VersionIdentity,
): AssessmentGeneration {
  if (version.catalog_id) return "custom";
  if (version.label === CORE_VERSION_LABEL) return "core-2.0";
  return "legacy-v4";
}

export function buildVersionGenerations(
  versions: readonly VersionIdentity[],
): Map<string, AssessmentGeneration> {
  return new Map(versions.map((v) => [v.id, classifyVersion(v)]));
}

/** The fields of an `assessments` row that say how it was scored. */
export interface AttemptIdentity {
  version_id: string;
  scoring_version?: string | null;
  result?: unknown;
}

function resultScoringVersion(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const value = (result as Record<string, unknown>).scoringVersion;
  return typeof value === "string" ? value : null;
}

/**
 * The generation of one attempt. Any CORE marker wins: the CORE version row, a
 * result scored "2.0", or the `scoring_version` column. The column alone is not
 * trusted for "1.x" because it defaults to "1.x" and the consumer does not set
 * it yet. An attempt whose version row is unknown is never treated as v4.
 */
export function classifyAttempt(
  attempt: AttemptIdentity,
  versionGenerations: ReadonlyMap<string, AssessmentGeneration>,
): AssessmentGeneration | null {
  const byVersion = versionGenerations.get(attempt.version_id) ?? null;
  if (byVersion === "core-2.0") return "core-2.0";
  if (resultScoringVersion(attempt.result) === CORE_SCORING_VERSION) {
    return "core-2.0";
  }
  if (attempt.scoring_version === CORE_SCORING_VERSION) return "core-2.0";
  return byVersion;
}

/** Only the attempts of one generation; unknown attempts are dropped. */
export function filterAttemptsByGeneration<T extends AttemptIdentity>(
  attempts: readonly T[],
  versionGenerations: ReadonlyMap<string, AssessmentGeneration>,
  generation: AssessmentGeneration,
): T[] {
  return attempts.filter(
    (a) => classifyAttempt(a, versionGenerations) === generation,
  );
}

export function versionIdsOf(
  versionGenerations: ReadonlyMap<string, AssessmentGeneration>,
  generation: AssessmentGeneration,
): string[] {
  return [...versionGenerations.entries()]
    .filter(([, g]) => g === generation)
    .map(([id]) => id);
}

export const V4_ARCHIVED_MESSAGE =
  "The v4 assessment is archived and can't be edited or published.";

/** v4 versions are archived: viewable, never edited, published or deleted. */
export function isGenerationWritable(
  generation: AssessmentGeneration,
): boolean {
  return generation === "custom";
}
