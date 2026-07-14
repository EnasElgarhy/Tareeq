import { getContentVersion, type OptionRow, type QuestionRow } from "@/lib/admin/content";
import { ANALYTICS_ROW_LIMIT } from "@/lib/admin/analytics/queries";
import {
  buildAnswerOutcomePairs,
  type AnswerOutcomePair,
  type AssessmentAnswerResultRow,
  type OutcomeField,
} from "@/lib/admin/analytics/question-correlation";
import { median, type QuestionEventRecord } from "@/lib/admin/analytics/question-events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface QuestionWithVersion extends QuestionRow {
  version_id: string;
  version_label: string | null;
}

/** One question, by its version-scoped uuid — the `/admin/questions/[id]/...` route param. */
export async function getQuestionById(id: string): Promise<QuestionWithVersion | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("questions")
    .select(
      "id,version_id,external_id,pillar,position,kind,title,axis,is_archived,question_options(id,letter,position,text,cluster_code,driver_code,axis_value)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Omit<QuestionRow, "options"> & {
    version_id: string;
    question_options: OptionRow[];
  };
  const version = await getContentVersion(row.version_id);

  return {
    id: row.id,
    version_id: row.version_id,
    version_label: version?.label ?? null,
    external_id: row.external_id,
    pillar: row.pillar,
    position: row.position,
    kind: row.kind,
    title: row.title,
    axis: row.axis,
    is_archived: row.is_archived,
    options: (row.question_options ?? []).sort((a, b) => a.position - b.position),
  };
}

interface RawAnalyticsEventRow {
  event_name: string;
  session_id: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Every question_* event recorded for a given `external_id`. Unscoped by
 * version by default (an `external_id` is stable across versions, and
 * "how has Question 18 done over its lifetime" is usually the more useful
 * default) — pass `versionLabel` to scope to one specific version instead
 * (used by version comparison).
 */
export async function fetchQuestionEvents(
  externalId: string,
  options: { versionLabel?: string } = {},
): Promise<QuestionEventRecord[]> {
  const sb = createSupabaseAdminClient();
  let query = sb
    .from("analytics_events")
    .select("event_name,session_id,occurred_at,metadata")
    .eq("question_id", externalId)
    .limit(ANALYTICS_ROW_LIMIT);

  if (options.versionLabel) {
    query = query.eq("assessment_version", options.versionLabel);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as RawAnalyticsEventRow[]).map((row) => ({
    eventName: row.event_name,
    sessionId: row.session_id,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? {},
  }));
}

/**
 * (answer, outcome) pairs for correlation — reads `assessments.answers` +
 * `.result` directly (see the module doc in question-correlation.ts for
 * why events aren't the source here). Unscoped by version by default, same
 * rationale as fetchQuestionEvents: external_id is stable, and "how has
 * this question correlated across its whole lifetime" is the more useful
 * default question-detail view.
 */
export async function fetchAnswerOutcomePairs(
  externalId: string,
  outcomeField: OutcomeField,
  options: { versionId?: string } = {},
): Promise<AnswerOutcomePair[]> {
  const sb = createSupabaseAdminClient();
  let query = sb
    .from("assessments")
    .select("answers,result")
    .not("result", "is", null)
    .limit(ANALYTICS_ROW_LIMIT);

  if (options.versionId) {
    query = query.eq("version_id", options.versionId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return buildAnswerOutcomePairs((data ?? []) as AssessmentAnswerResultRow[], externalId, outcomeField);
}

/**
 * The assessment-wide median question time — the baseline the health
 * score's "time" factor judges each individual question against (a
 * question isn't slow in the abstract, only relative to its siblings).
 * Scoped to one version's worth of `question_time_spent` events; null if
 * there aren't any yet (health score gracefully drops the time factor).
 */
export async function fetchAssessmentBaselineMedianTimeMs(
  versionLabel: string | null,
): Promise<number | null> {
  if (!versionLabel) return null;
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("analytics_events")
    .select("metadata")
    .eq("event_name", "question_time_spent")
    .eq("assessment_version", versionLabel)
    .not("question_id", "is", null)
    .limit(ANALYTICS_ROW_LIMIT);
  if (error) throw new Error(error.message);

  const samples = ((data ?? []) as Array<{ metadata: Record<string, unknown> | null }>)
    .map((row) => row.metadata?.timeSpentMs)
    .filter((ms): ms is number => typeof ms === "number" && Number.isFinite(ms) && ms >= 0);

  return median(samples);
}

/**
 * Other versions' copies of "the same question" — matched by `external_id`
 * (stable across a clone-to-draft), excluding the version the caller is
 * already looking at. This is the candidate list for "Compare versions":
 * picking one gives you both sides of compareQuestionVersions().
 */
export async function listSiblingQuestionVersions(
  externalId: string,
  excludeVersionId: string,
): Promise<QuestionWithVersion[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("questions")
    .select(
      "id,version_id,external_id,pillar,position,kind,title,axis,is_archived,question_options(id,letter,position,text,cluster_code,driver_code,axis_value)",
    )
    .eq("external_id", externalId)
    .neq("version_id", excludeVersionId);
  if (error) throw new Error(error.message);

  const rows = data as Array<
    Omit<QuestionRow, "options"> & { version_id: string; question_options: OptionRow[] }
  >;
  const versionIds = [...new Set(rows.map((r) => r.version_id))];
  const versions = await Promise.all(versionIds.map((id) => getContentVersion(id)));
  const labelByVersionId = new Map(versionIds.map((id, i) => [id, versions[i]?.label ?? null]));

  return rows.map((row) => ({
    id: row.id,
    version_id: row.version_id,
    version_label: labelByVersionId.get(row.version_id) ?? null,
    external_id: row.external_id,
    pillar: row.pillar,
    position: row.position,
    kind: row.kind,
    title: row.title,
    axis: row.axis,
    is_archived: row.is_archived,
    options: (row.question_options ?? []).sort((a, b) => a.position - b.position),
  }));
}
