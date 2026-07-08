import type { SupabaseClient } from "@supabase/supabase-js";
import { contentVersion } from "@/lib/content/seed";

/**
 * Resolve the DB content version the seed maps to (e.g. "v4"), falling back
 * to whichever version is marked active. Shared by every route that writes
 * to `assessments`, since the consumer app renders from the seed and this is
 * the only link between that seed and the DB's `content_versions` table.
 */
export async function resolveContentVersionId(
  admin: SupabaseClient,
): Promise<string | null> {
  const byLabel = await admin
    .from("content_versions")
    .select("id")
    .eq("label", contentVersion.label)
    .order("created_at", { ascending: true })
    .limit(1);
  const fromLabel = byLabel.data?.[0]?.id as string | undefined;
  if (fromLabel) return fromLabel;

  const active = await admin
    .from("content_versions")
    .select("id")
    .eq("is_active", true)
    .limit(1);
  return (active.data?.[0]?.id as string | undefined) ?? null;
}
