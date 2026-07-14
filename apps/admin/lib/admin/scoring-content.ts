import type { SpecProfileRow, SpecRuleRow } from "@/lib/admin/assemble-spec";
import type { ScoringStrategy } from "@/lib/scoring/spec-types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Read side for the Phase 3 Scoring step (result profiles + rules + strategy). */

export interface ResultProfileRow extends SpecProfileRow {
  display_order: number;
}

export async function getScoringStrategy(
  catalogId: string,
): Promise<ScoringStrategy> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessments_catalog")
    .select("scoring_strategy")
    .eq("id", catalogId)
    .single();
  if (error) throw new Error(error.message);
  return (data?.scoring_strategy as ScoringStrategy | undefined) ?? "first_match";
}

export async function listResultProfiles(
  catalogId: string,
): Promise<ResultProfileRow[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("result_profiles")
    .select(
      "id,code,name,description,category_code,recommended_majors,recommended_careers,strengths,development_areas,is_fallback,display_order",
    )
    .eq("catalog_id", catalogId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ResultProfileRow[];
}

export async function listProfileRules(
  catalogId: string,
): Promise<SpecRuleRow[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("result_rules")
    .select("id,result_profile_id,combinator,conditions,priority")
    .eq("catalog_id", catalogId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SpecRuleRow[];
}
