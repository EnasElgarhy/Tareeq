import {
  buildVersionGenerations,
  GENERATION_LABELS,
  isGenerationWritable,
  type AssessmentGeneration,
  type VersionIdentity,
  V4_ARCHIVED_MESSAGE,
} from "@/lib/admin/assessment-generation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * content_versions id → generation. Reads `catalog_id` when the column is
 * visible and falls back to label-only classification when it is not, so the
 * split never depends on the catalog migration.
 */
export async function loadVersionGenerations(): Promise<
  Map<string, AssessmentGeneration>
> {
  const sb = createSupabaseAdminClient();
  const withCatalog = await sb
    .from("content_versions")
    .select("id,label,catalog_id");
  if (!withCatalog.error) {
    return buildVersionGenerations(
      (withCatalog.data ?? []) as VersionIdentity[],
    );
  }
  const labelsOnly = await sb.from("content_versions").select("id,label");
  if (labelsOnly.error) throw new Error(labelsOnly.error.message);
  return buildVersionGenerations((labelsOnly.data ?? []) as VersionIdentity[]);
}

export async function getVersionGeneration(
  versionId: string,
): Promise<AssessmentGeneration | null> {
  const generations = await loadVersionGenerations();
  return generations.get(versionId) ?? null;
}

/**
 * Server-side lock for content mutations. The archived v4 assessment and the
 * CORE 2.0 row (whose questions live in the CORE package, not in `questions`)
 * are never edited through the v4 editor.
 */
export async function assertVersionWritable(versionId: string): Promise<void> {
  const generation = await getVersionGeneration(versionId);
  if (!generation) throw new Error("Assessment version not found.");
  if (!isGenerationWritable(generation)) {
    throw new Error(
      generation === "legacy-v4"
        ? V4_ARCHIVED_MESSAGE
        : `${GENERATION_LABELS[generation]} is managed on the CORE 2.0 page.`,
    );
  }
}
