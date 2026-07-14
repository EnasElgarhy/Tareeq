import type { Locale } from "@/lib/admin/locales";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type Localized = Partial<Record<Locale, string>>;

export interface AssessmentCategory {
  id: string;
  code: string;
  name: Localized;
  display_order: number;
}

export interface CustomOption {
  id: string;
  letter: string;
  position: number;
  text: Localized;
  categoryCode: string | null;
  points: number;
}

export interface CustomQuestion {
  id: string;
  external_id: string;
  kind: string;
  position: number;
  title: Localized;
  options: CustomOption[];
}

/** Scoring categories for a Custom assessment (the "category" vocabulary). */
export async function listAssessmentCategories(
  catalogId: string,
): Promise<AssessmentCategory[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessment_categories")
    .select("id,code,name,display_order")
    .eq("catalog_id", catalogId)
    .order("display_order", { ascending: true })
    .order("code", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentCategory[];
}

interface RawOption {
  id: string;
  letter: string;
  position: number;
  text: Record<string, string> | null;
  category_code: string | null;
  weight: number | string | null;
}
interface RawQuestion {
  id: string;
  external_id: string;
  kind: string;
  position: number;
  title: Record<string, string> | null;
  question_options: RawOption[] | null;
}

/** Questions + bilingual options + scoring mapping for a Custom assessment version. */
export async function listCustomQuestions(
  versionId: string,
): Promise<CustomQuestion[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("questions")
    .select(
      "id,external_id,kind,position,title,question_options(id,letter,position,text,category_code,weight)",
    )
    .eq("version_id", versionId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RawQuestion[]).map((q) => ({
    id: q.id,
    external_id: q.external_id,
    kind: q.kind,
    position: q.position,
    title: (q.title ?? {}) as Localized,
    options: (q.question_options ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((o) => ({
        id: o.id,
        letter: o.letter,
        position: o.position,
        text: (o.text ?? {}) as Localized,
        categoryCode: o.category_code,
        points: o.weight == null ? 1 : Number(o.weight),
      })),
  }));
}
