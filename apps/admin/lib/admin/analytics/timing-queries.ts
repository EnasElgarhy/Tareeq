import { fetchAllPages, PageReadError } from "@/lib/admin/analytics/event-pages";
import {
  attemptsFromEvents,
  responsesFromCoreRows,
  summarizeAttempt,
  type AttemptTiming,
  type CoreResponseRow,
  type TimingEventRecord,
} from "@/lib/admin/analytics/timing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Window shown when no dates are picked. */
export const DEFAULT_TIMING_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const TIMING_EVENT_NAMES = ["question_time_spent", "question_answered", "question_answer_changed"];
/** CORE question ids are "P1-01" … "P4-nn"; legacy v4 ids ("Q5") use other rules. */
const CORE_QUESTION_ID_PATTERN = "P%-%";
/** PostgREST error codes for a table that does not exist (migration not applied). */
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export interface TimingRange {
  from: string;
  to: string;
}

export interface TimingData {
  range: TimingRange;
  attempts: AttemptTiming[];
  /** False when core_responses is missing in this database. */
  hasResponsesTable: boolean;
  truncated: boolean;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function dateParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && DATE_ONLY.test(raw) && !Number.isNaN(Date.parse(raw)) ? raw : null;
}

/** `from`/`to` as whole UTC days; defaults to the last 30 days. */
export function parseTimingRange(
  searchParams: Record<string, string | string[] | undefined>,
  now: Date = new Date(),
): TimingRange {
  const to = dateParam(searchParams.to) ?? now.toISOString().slice(0, 10);
  const fallbackFrom = new Date(Date.parse(to) - DEFAULT_TIMING_WINDOW_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const from = dateParam(searchParams.from) ?? fallbackFrom;
  return from <= to ? { from, to } : { from: to, to: from };
}

function rangeBounds({ from, to }: TimingRange) {
  return {
    start: `${from}T00:00:00.000Z`,
    end: new Date(Date.parse(`${to}T00:00:00.000Z`) + DAY_MS).toISOString(),
  };
}

interface RawTimingEvent {
  event_name: string;
  assessment_id: string | null;
  assessment_version: string | null;
  question_id: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

async function fetchEventAttempts(range: TimingRange) {
  const sb = createSupabaseAdminClient();
  const { start, end } = rangeBounds(range);
  const { rows, truncated } = await fetchAllPages<RawTimingEvent>((from, to) =>
    sb
      .from("analytics_events")
      .select("event_name,assessment_id,assessment_version,question_id,occurred_at,metadata")
      .in("event_name", TIMING_EVENT_NAMES)
      .like("question_id", CORE_QUESTION_ID_PATTERN)
      .gte("occurred_at", start)
      .lt("occurred_at", end)
      .order("occurred_at", { ascending: true })
      .range(from, to),
  );
  const events: TimingEventRecord[] = rows.map((row) => ({
    eventName: row.event_name,
    assessmentId: row.assessment_id,
    assessmentVersion: row.assessment_version,
    questionId: row.question_id,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? {},
  }));
  return { attempts: attemptsFromEvents(events), truncated };
}

interface RawCoreResponse extends CoreResponseRow {
  answered_at: string;
}

interface RawAttemptRow {
  id: string;
  respondent_name: string | null;
  started_at: string | null;
  question_set: string | null;
}

/**
 * Attempts from core_responses (spec §3.2). Returns `present: false` when
 * the table does not exist, so the page can say so instead of failing.
 */
type ResponseScope = { range: TimingRange } | { assessmentId: string };

async function fetchResponseAttempts(scope: ResponseScope) {
  const sb = createSupabaseAdminClient();
  let rows: RawCoreResponse[];
  let truncated: boolean;
  try {
    ({ rows, truncated } = await fetchAllPages<RawCoreResponse>((from, to) => {
      let query = sb
        .from("core_responses")
        .select("assessment_id,part,question_id,position_shown,time_on_screen_ms,is_redo,answered_at");
      if ("assessmentId" in scope) {
        query = query.eq("assessment_id", scope.assessmentId);
      } else {
        const { start, end } = rangeBounds(scope.range);
        query = query.gte("answered_at", start).lt("answered_at", end);
      }
      return query.order("assessment_id").range(from, to);
    }));
  } catch (error) {
    if (error instanceof PageReadError && error.code && MISSING_TABLE_CODES.has(error.code)) return { present: false, attempts: [], truncated: false };
    throw error;
  }

  const byAttempt = new Map<string, RawCoreResponse[]>();
  for (const row of rows) {
    byAttempt.set(row.assessment_id, [...(byAttempt.get(row.assessment_id) ?? []), row]);
  }
  const ids = [...byAttempt.keys()];
  const meta = new Map<string, RawAttemptRow>();
  if (ids.length > 0) {
    const { data, error } = await sb
      .from("assessments")
      .select("id,respondent_name,started_at,question_set")
      .in("id", ids);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as RawAttemptRow[]) meta.set(row.id, row);
  }

  const attempts: AttemptTiming[] = [];
  for (const [id, list] of byAttempt) {
    const attempt = meta.get(id);
    const summary = summarizeAttempt(
      {
        attemptKey: id,
        source: "responses",
        assessmentId: id,
        respondentName: attempt?.respondent_name ?? null,
        versionLabel: attempt?.question_set ?? null,
        startedAt: attempt?.started_at ?? list[0]?.answered_at ?? null,
        src: null,
        post: null,
      },
      responsesFromCoreRows(list),
    );
    if (summary) attempts.push(summary);
  }
  return { present: true, attempts, truncated };
}

/** Every timed attempt in the range: stored responses first, then event-only attempts. */
export async function getTimingData(range: TimingRange): Promise<TimingData> {
  const [responses, events] = await Promise.all([
    fetchResponseAttempts({ range }),
    fetchEventAttempts(range),
  ]);
  return {
    range,
    attempts: [...responses.attempts, ...events.attempts],
    hasResponsesTable: responses.present,
    truncated: responses.truncated || events.truncated,
  };
}

export interface AttemptTimingLookup {
  attempt: AttemptTiming | null;
  hasResponsesTable: boolean;
}

/** Timing for one stored attempt (response detail page); null until responses are saved. */
export async function getAttemptTiming(assessmentId: string): Promise<AttemptTimingLookup> {
  const { present, attempts } = await fetchResponseAttempts({ assessmentId });
  return { attempt: attempts[0] ?? null, hasResponsesTable: present };
}
