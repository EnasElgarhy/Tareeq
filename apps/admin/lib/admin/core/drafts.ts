import type { CoreQuestionSetDoc } from "@/lib/admin/core/framework";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Read layer for CORE question-set drafts (core_question_set_drafts). */

export type CoreDraftStatus = "draft" | "handed_off";

export interface CoreDraftSummary {
  id: string;
  baseVersion: string;
  targetVersion: string;
  status: CoreDraftStatus;
  notes: string | null;
  updatedAt: string;
}

export interface CoreDraft extends CoreDraftSummary {
  body: CoreQuestionSetDoc;
}

interface DraftRow {
  id: string;
  base_version: string;
  target_version: string;
  status: CoreDraftStatus;
  notes: string | null;
  updated_at: string;
  body?: unknown;
}

function toSummary(row: DraftRow): CoreDraftSummary {
  return {
    id: row.id,
    baseVersion: row.base_version,
    targetVersion: row.target_version,
    status: row.status,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export type CoreDraftList =
  | { available: true; drafts: CoreDraftSummary[] }
  | { available: false; reason: string };

/**
 * Drafts newest first. Reports `available: false` instead of throwing when the
 * table is not there yet (migration 202610240001 not applied), so the CORE page
 * still renders.
 */
export async function listCoreDrafts(): Promise<CoreDraftList> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("core_question_set_drafts")
    .select("id,base_version,target_version,status,notes,updated_at")
    .order("updated_at", { ascending: false });
  if (error) return { available: false, reason: error.message };
  return {
    available: true,
    drafts: ((data ?? []) as DraftRow[]).map(toSummary),
  };
}

export async function getCoreDraft(id: string): Promise<CoreDraft | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("core_question_set_drafts")
    .select("id,base_version,target_version,status,notes,updated_at,body")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as DraftRow;
  return { ...toSummary(row), body: row.body as CoreQuestionSetDoc };
}
