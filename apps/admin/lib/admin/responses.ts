import {
  classifyAttempt,
  CORE_DISPLAY_NAME,
  type AssessmentGeneration,
} from "@/lib/admin/assessment-generation";
import { loadVersionGenerations } from "@/lib/admin/assessment-generation.server";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import {
  CORE_QUESTION_SET,
  decodeCoreAnswers,
  type DecodedCoreAnswer,
} from "@/lib/admin/core/framework";
import {
  getContentVersion,
  getVersionContent,
  listContentVersions,
} from "@/lib/admin/content";
import { decodeAnswers, type DecodedAnswer } from "@/lib/admin/response-format";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Read layer for the admin Responses surface — every completed (or in-progress)
 * assessment a respondent has taken, grouped by assessment. Uses the
 * service-role client (the admin surface is already gated by requireAdmin), so
 * RLS does not block reads.
 *
 * Every list and count is split by assessment generation (CORE 2.0, archived
 * v4, custom): an attempt only appears under a version of its own generation,
 * so v4 and CORE 2.0 responses never mix.
 *
 * Selects are tolerant of the migration state: run rows are fetched with `*`,
 * so the respondent_name / respondent_email columns are read when present and
 * simply absent otherwise (the page never crashes on a not-yet-applied schema).
 */

/** Raw assessment row as stored (snake_case). Optional fields = schema-tolerant. */
interface RawAssessment {
  id: string;
  version_id: string;
  user_id: string | null;
  anon_session_id: string | null;
  respondent_name?: string | null;
  respondent_email?: string | null;
  locale: string | null;
  started_at: string;
  completed_at: string | null;
  answers?: unknown;
  result: unknown;
  scoring_version?: string | null;
}

export interface AssessmentRunRow {
  id: string;
  versionId: string;
  userId: string | null;
  anonSessionId: string | null;
  respondentName: string | null;
  respondentEmail: string | null;
  profileName: string | null;
  locale: string;
  startedAt: string;
  completedAt: string | null;
  result: Record<string, unknown> | null;
}

export interface VersionResponseSummary {
  versionId: string;
  generation: AssessmentGeneration;
  label: string;
  isActive: boolean;
  total: number;
  completed: number;
  lastActivityAt: string | null;
}

export type RunDetail =
  | {
      generation: "legacy-v4" | "custom";
      run: AssessmentRunRow;
      versionLabel: string;
      decoded: DecodedAnswer[];
    }
  | {
      generation: "core-2.0";
      run: AssessmentRunRow;
      versionLabel: string;
      decodedCore: DecodedCoreAnswer[];
    };

function toRunRow(
  row: RawAssessment,
  profileNames: Map<string, string | null>,
): AssessmentRunRow {
  return {
    id: row.id,
    versionId: row.version_id,
    userId: row.user_id,
    anonSessionId: row.anon_session_id,
    respondentName: row.respondent_name ?? null,
    respondentEmail: row.respondent_email ?? null,
    profileName: row.user_id ? (profileNames.get(row.user_id) ?? null) : null,
    locale: row.locale ?? "en",
    startedAt: row.started_at,
    completedAt: row.completed_at,
    result:
      row.result && typeof row.result === "object"
        ? (row.result as Record<string, unknown>)
        : null,
  };
}

/** Resolve display names for the auth users behind a set of assessment rows. */
async function fetchProfileNames(
  sb: SupabaseClient,
  userIds: (string | null)[],
): Promise<Map<string, string | null>> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();
  const { data, error } = await sb
    .from("profiles")
    .select("id,display_name")
    .in("id", ids);
  if (error) throw new Error(error.message);
  const map = new Map<string, string | null>();
  for (const row of data ?? []) {
    const r = row as { id: string; display_name: string | null };
    map.set(r.id, r.display_name);
  }
  return map;
}

/** Friendly label for an assessment version (catalog name preferred). */
async function resolveVersionLabel(
  versionId: string,
  fallback: string,
): Promise<string> {
  const catalog = await getAssessmentForVersion(versionId);
  return catalog?.name.en ?? fallback;
}

/**
 * Response counts + first-response time for a single version. Used by the
 * version-governance panel to show "N responses depend on this version".
 * Degrades to zeroes on error so the content page never fails to render.
 */
export async function getVersionResponseStats(
  versionId: string,
): Promise<{ total: number; completed: number; firstAt: string | null }> {
  const sb = createSupabaseAdminClient();
  const [{ data, error }, generations] = await Promise.all([
    sb
      .from("assessments")
      .select("version_id,started_at,completed_at,result")
      .eq("version_id", versionId),
    loadVersionGenerations().catch(() => null),
  ]);
  if (error || !generations) return { total: 0, completed: 0, firstAt: null };
  const generation = generations.get(versionId);
  let total = 0;
  let completed = 0;
  let firstAt: string | null = null;
  for (const row of data ?? []) {
    const r = row as {
      version_id: string;
      started_at: string;
      completed_at: string | null;
      result: unknown;
    };
    if (classifyAttempt(r, generations) !== generation) continue;
    total += 1;
    if (r.completed_at) completed += 1;
    if (r.started_at && (!firstAt || r.started_at < firstAt)) firstAt = r.started_at;
  }
  return { total, completed, firstAt };
}

/**
 * One summary row per assessment version that has at least one response, with
 * started/completed counts and last activity. Powers the Responses index.
 */
export async function getResponseSummaries(): Promise<VersionResponseSummary[]> {
  const sb = createSupabaseAdminClient();
  const [{ data, error }, versions, generations] = await Promise.all([
    sb.from("assessments").select("version_id,started_at,completed_at,result"),
    listContentVersions(),
    loadVersionGenerations(),
  ]);
  if (error) throw new Error(error.message);

  const byId = new Map(versions.map((v) => [v.id, v]));
  const agg = new Map<
    string,
    { total: number; completed: number; last: string | null }
  >();

  for (const row of data ?? []) {
    const r = row as {
      version_id: string;
      started_at: string;
      completed_at: string | null;
      result: unknown;
    };
    // An attempt scored by another generation than its version row (e.g. a
    // 2.0 result under a v4 version) is never counted with that version.
    const generation = classifyAttempt(r, generations);
    if (!generation || generation !== generations.get(r.version_id)) continue;
    const cur = agg.get(r.version_id) ?? { total: 0, completed: 0, last: null };
    cur.total += 1;
    if (r.completed_at) cur.completed += 1;
    const activity = r.completed_at ?? r.started_at;
    if (activity && (!cur.last || activity > cur.last)) cur.last = activity;
    agg.set(r.version_id, cur);
  }

  const summaries = await Promise.all(
    [...agg.entries()].map(async ([versionId, a]) => {
      const version = byId.get(versionId);
      const generation = generations.get(versionId) as AssessmentGeneration;
      const label =
        generation === "core-2.0"
          ? CORE_DISPLAY_NAME
          : await resolveVersionLabel(versionId, version?.label ?? "Unknown assessment");
      return {
        versionId,
        generation,
        label,
        isActive: version?.is_active ?? false,
        total: a.total,
        completed: a.completed,
        lastActivityAt: a.last,
      };
    }),
  );

  summaries.sort((x, y) =>
    (y.lastActivityAt ?? "").localeCompare(x.lastActivityAt ?? ""),
  );
  return summaries;
}

/** All respondent runs for one assessment version, newest activity first. */
export async function listRunsForVersion(
  versionId: string,
  limit = 200,
): Promise<AssessmentRunRow[]> {
  const sb = createSupabaseAdminClient();
  const [{ data, error }, generations] = await Promise.all([
    sb
      .from("assessments")
      .select("*")
      .eq("version_id", versionId)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false })
      .limit(limit),
    loadVersionGenerations(),
  ]);
  if (error) throw new Error(error.message);

  const generation = generations.get(versionId);
  const rows = ((data ?? []) as RawAssessment[]).filter(
    (r) => classifyAttempt(r, generations) === generation,
  );
  const profileNames = await fetchProfileNames(
    sb,
    rows.map((r) => r.user_id),
  );
  return rows.map((r) => toRunRow(r, profileNames));
}

/** One respondent run with its answers decoded against the version's questions. */
export async function getRunDetail(
  assessmentId: string,
): Promise<RunDetail | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const raw = data as RawAssessment;
  const [profileNames, version, generations] = await Promise.all([
    fetchProfileNames(sb, [raw.user_id]),
    getContentVersion(raw.version_id),
    loadVersionGenerations(),
  ]);

  const run = toRunRow(raw, profileNames);
  const generation = classifyAttempt(raw, generations);
  if (!generation) return null;
  const versionLabel =
    generation === "core-2.0"
      ? CORE_DISPLAY_NAME
      : await resolveVersionLabel(raw.version_id, version?.label ?? "Assessment");

  // CORE attempts are read against the CORE question set, never v4 questions.
  if (generation === "core-2.0") {
    return {
      generation,
      run,
      versionLabel,
      decodedCore: decodeCoreAnswers(
        CORE_QUESTION_SET,
        raw.answers as Record<string, unknown> | null,
        run.locale,
      ),
    };
  }

  const questions = await getVersionContent(raw.version_id);
  const decoded = decodeAnswers(
    questions,
    raw.answers as Record<string, unknown> | null,
    run.locale,
  );

  return { generation, run, versionLabel, decoded };
}
