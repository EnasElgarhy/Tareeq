import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Typed data access for the content CMS. Uses the service-role client (admin
 * surface is already authorized via requireAdmin), so RLS doesn't block reads.
 */

export interface ContentVersionRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  notes: string | null;
}

export interface ClusterRow {
  code: string;
  name: string;
  description: string;
  display_order: number;
}

export interface OptionRow {
  id: string;
  letter: string;
  position: number;
  text: Record<string, string>;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}

export interface QuestionRow {
  id: string;
  external_id: string;
  pillar: number;
  position: number;
  kind: string;
  title: Record<string, string>;
  axis: string | null;
  options: OptionRow[];
}

export const PILLAR_NAMES: Record<number, string> = {
  0: "Demographics",
  1: "Curiosities",
  2: "Operations",
  3: "Rewards",
  4: "Ecosystems",
};

export async function listContentVersions(): Promise<ContentVersionRow[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("content_versions")
    .select("id,label,is_active,created_at,notes")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContentVersionRow[];
}

export async function listClusters(): Promise<ClusterRow[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("clusters")
    .select("code,name,description,display_order")
    .order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as ClusterRow[];
}

/** Count questions per version (for the list view). */
export async function countQuestionsByVersion(): Promise<
  Record<string, number>
> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.from("questions").select("version_id");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { version_id: string }).version_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function getContentVersion(
  versionId: string,
): Promise<ContentVersionRow | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("content_versions")
    .select("id,label,is_active,created_at,notes")
    .eq("id", versionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ContentVersionRow | null) ?? null;
}

/** All questions (with their options) for a version, ordered for display. */
export async function getVersionContent(
  versionId: string,
): Promise<QuestionRow[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("questions")
    .select(
      "id,external_id,pillar,position,kind,title,axis,question_options(id,letter,position,text,cluster_code,driver_code,axis_value)",
    )
    .eq("version_id", versionId)
    .order("pillar")
    .order("position");
  if (error) throw new Error(error.message);

  return (data ?? []).map((q) => {
    const row = q as Omit<QuestionRow, "options"> & {
      question_options: OptionRow[];
    };
    return {
      id: row.id,
      external_id: row.external_id,
      pillar: row.pillar,
      position: row.position,
      kind: row.kind,
      title: row.title,
      axis: row.axis,
      options: (row.question_options ?? []).sort(
        (a, b) => a.position - b.position,
      ),
    };
  });
}
