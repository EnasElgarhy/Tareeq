import type { Locale } from "@/lib/admin/locales";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AssessmentType = "core" | "custom";
export type CreationMethod = "manual" | "ai_import";
export type AssessmentStatus = "draft" | "published" | "archived";
export type Localized = Partial<Record<Locale, string>>;

export interface CatalogAssessment {
  id: string;
  name: Localized;
  description: Localized | null;
  primary_language: Locale;
  supported_languages: Locale[];
  assessment_type: AssessmentType;
  creation_method: CreationMethod;
  status: AssessmentStatus;
  published_locales: Locale[];
  created_at: string;
  updated_at: string;
}

/** All catalog assessments, newest first. */
export async function listCatalogAssessments(): Promise<CatalogAssessment[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessments_catalog")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogAssessment[];
}

export async function getCatalogAssessment(
  id: string,
): Promise<CatalogAssessment | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessments_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CatalogAssessment | null) ?? null;
}

/**
 * The content_version that holds a catalog assessment's questions. An
 * assessment owns 1..N versions; the earliest is its working draft. Questions
 * hang off this version_id — the bridge that keeps questions version-scoped
 * while the catalog owns identity-level data.
 */
export async function getDraftVersionForCatalog(
  catalogId: string,
): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("content_versions")
    .select("id")
    .eq("catalog_id", catalogId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.id as string | undefined) ?? null;
}

/** The catalog assessment a content_version belongs to, or null for legacy
 *  (CORE) versions with no catalog link. */
export async function getAssessmentForVersion(
  versionId: string,
): Promise<CatalogAssessment | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("content_versions")
    .select("catalog_id")
    .eq("id", versionId)
    .maybeSingle();
  // If the catalog link can't be resolved (e.g. the `catalog_id` column isn't
  // visible to the API yet — migration not applied or PostgREST schema cache
  // stale), treat the version as a non-catalog CORE version rather than
  // crashing the page. CORE editing must never depend on the catalog schema.
  if (error) return null;
  const catalogId = (data?.catalog_id as string | null | undefined) ?? null;
  return catalogId ? getCatalogAssessment(catalogId) : null;
}
