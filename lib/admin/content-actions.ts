"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface SourceOption {
  letter: string;
  position: number;
  text: Record<string, string>;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}
interface SourceQuestion {
  external_id: string;
  pillar: number;
  position: number;
  kind: string;
  title: Record<string, string>;
  axis: string | null;
  question_options: SourceOption[];
}

/**
 * Clone a version (and all its questions + options) into a new editable draft.
 * Returns the new version id. external_id is unique per-version, so the clone
 * keeps the same external ids under a fresh version_id.
 */
export async function createDraftFromVersion(
  sourceVersionId: string,
): Promise<string> {
  const admin = await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { data: src, error: e1 } = await sb
    .from("content_versions")
    .select("label")
    .eq("id", sourceVersionId)
    .single();
  if (e1 || !src) throw new Error(e1?.message ?? "Source version not found");

  const { data: nv, error: e2 } = await sb
    .from("content_versions")
    .insert({
      label: `${src.label} (draft)`,
      is_active: false,
      notes: `Cloned from ${src.label}`,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (e2 || !nv) throw new Error(e2?.message ?? "Could not create draft");

  const { data: qs, error: e3 } = await sb
    .from("questions")
    .select(
      "external_id,pillar,position,kind,title,axis,question_options(letter,position,text,cluster_code,driver_code,axis_value)",
    )
    .eq("version_id", sourceVersionId);
  if (e3) throw new Error(e3.message);

  const sourceQuestions = (qs ?? []) as unknown as SourceQuestion[];
  if (sourceQuestions.length > 0) {
    const { data: insertedQs, error: e4 } = await sb
      .from("questions")
      .insert(
        sourceQuestions.map((q) => ({
          version_id: nv.id,
          external_id: q.external_id,
          pillar: q.pillar,
          position: q.position,
          kind: q.kind,
          title: q.title,
          axis: q.axis,
        })),
      )
      .select("id,external_id");
    if (e4 || !insertedQs)
      throw new Error(e4?.message ?? "Could not clone questions");

    const idByExt = new Map(
      insertedQs.map((r) => [r.external_id as string, r.id as string]),
    );
    const options = sourceQuestions.flatMap((q) => {
      const qid = idByExt.get(q.external_id);
      if (!qid) return [];
      return (q.question_options ?? []).map((o) => ({
        question_id: qid,
        letter: o.letter,
        position: o.position,
        text: o.text,
        cluster_code: o.cluster_code,
        driver_code: o.driver_code,
        axis_value: o.axis_value,
      }));
    });
    if (options.length > 0) {
      const { error: e5 } = await sb.from("question_options").insert(options);
      if (e5) throw new Error(e5.message);
    }
  }

  revalidatePath("/admin/content");
  return nv.id;
}

/**
 * Make a version the single active one.
 *
 * Two-step flip — admin-only / low-concurrency, and harmless today because the
 * public app doesn't read is_active from the DB yet. When the app reads content
 * from the DB (Phase 3) this should become a transactional RPC
 * (`update content_versions set is_active = (id = vid)`).
 */
export async function publishVersion(versionId: string): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { error: deactivate } = await sb
    .from("content_versions")
    .update({ is_active: false })
    .neq("id", versionId);
  if (deactivate) throw new Error(deactivate.message);

  const { error: activate } = await sb
    .from("content_versions")
    .update({ is_active: true })
    .eq("id", versionId);
  if (activate) throw new Error(activate.message);

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${versionId}`);
}

/** Delete a draft (cascades to its questions + options). Refuses the active one. */
export async function deleteDraftVersion(versionId: string): Promise<void> {
  await requireAdmin();
  const sb = createSupabaseAdminClient();

  const { data: v, error: e1 } = await sb
    .from("content_versions")
    .select("is_active")
    .eq("id", versionId)
    .single();
  if (e1 || !v) throw new Error(e1?.message ?? "Version not found");
  if (v.is_active)
    throw new Error("Can't delete the active version — publish another first.");

  const { error: e2 } = await sb
    .from("content_versions")
    .delete()
    .eq("id", versionId);
  if (e2) throw new Error(e2.message);

  revalidatePath("/admin/content");
}
