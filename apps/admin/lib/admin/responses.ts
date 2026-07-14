import { getAssessmentForVersion } from "@/lib/admin/catalog";
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
  label: string;
  isActive: boolean;
  total: number;
  completed: number;
  lastActivityAt: string | null;
}

export interface RunDetail {
  run: AssessmentRunRow;
  versionLabel: string;
  decoded: DecodedAnswer[];
}

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
 * One summary row per assessment version that has at least one response, with
 * started/completed counts and last activity. Powers the Responses index.
 */
export async function getResponseSummaries(): Promise<VersionResponseSummary[]> {
  const sb = createSupabaseAdminClient();
  const [{ data, error }, versions] = await Promise.all([
    sb.from("assessments").select("version_id,started_at,completed_at"),
    listContentVersions(),
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
    };
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
      const label = await resolveVersionLabel(
        versionId,
        version?.label ?? "Unknown assessment",
      );
      return {
        versionId,
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
  const { data, error } = await sb
    .from("assessments")
    .select("*")
    .eq("version_id", versionId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as RawAssessment[];
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
  const [questions, profileNames, version] = await Promise.all([
    getVersionContent(raw.version_id),
    fetchProfileNames(sb, [raw.user_id]),
    getContentVersion(raw.version_id),
  ]);

  const run = toRunRow(raw, profileNames);
  const versionLabel = await resolveVersionLabel(
    raw.version_id,
    version?.label ?? "Assessment",
  );
  const decoded = decodeAnswers(
    questions,
    raw.answers as Record<string, unknown> | null,
    run.locale,
  );

  return { run, versionLabel, decoded };
}
