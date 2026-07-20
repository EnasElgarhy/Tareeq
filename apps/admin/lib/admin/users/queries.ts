import { createHash } from "node:crypto";
import { extractCoreResult } from "@/lib/admin/analytics/aggregate";
import { computeEngagement } from "@/lib/admin/users/engagement";
import { computeRisk } from "@/lib/admin/users/risk";
import { daysSince } from "@/lib/admin/users/time";
import { buildTimeline } from "@/lib/admin/users/timeline";
import type {
  AssessmentSummary,
  Pagination,
  SortKey,
  UserAggregate,
  UserDetailData,
  UserListResult,
  UserListRow,
  UsersFilter,
} from "@/lib/admin/users/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only Users data layer. Reads via the service-role client (the whole
 * /admin surface is gated by requireAdmin). Dataset is small, so it follows
 * the house analytics pattern: fetch (capped) then join/aggregate/filter/sort
 * in JS. Every value is derived from real rows — see USERS_MODULE_ARCHITECTURE.
 */

const MAX_ROWS = 5000;

/**
 * Reproduces the CONSUMER analytics hash (lib/analytics/track.ts) so events
 * can be attributed to a user by their auth id. NOTE: deliberately NOT the
 * research-export hash in analytics/csv.ts — that uses a different salt/length.
 */
function analyticsHash(id: string): string {
  return createHash("sha256").update(`tareeq-analytics-v1:${id}`).digest("hex");
}

interface RawProfile {
  id: string;
  display_name: string | null;
  country: string | null;
  locale: string | null;
  role: string | null;
  created_at: string | null;
}
interface RawAccount {
  auth_user_id: string | null;
  name: string | null;
  email: string | null;
  email_verified: boolean | null;
  deleted_at: string | null;
}
interface RawAsmt {
  id: string;
  user_id: string | null;
  version_id: string;
  started_at: string | null;
  completed_at: string | null;
  result: unknown;
  answers: unknown;
  locale: string | null;
}
interface RawEvent {
  user_id_hash: string | null;
  event_name: string | null;
  event_type: string | null;
  occurred_at: string | null;
}

interface Loaded {
  profiles: RawProfile[];
  accountByAuthId: Map<string, RawAccount>;
  asmtsByUser: Map<string, RawAsmt[]>;
  eventsByHash: Map<string, RawEvent[]>;
  versionLabels: Map<string, string>;
}

async function loadAll(): Promise<Loaded> {
  const sb = createSupabaseAdminClient();
  const [profilesRes, accountsRes, asmtsRes, eventsRes, versionsRes] = await Promise.all([
    sb.from("profiles").select("*").limit(MAX_ROWS),
    sb.from("user_accounts").select("*").limit(MAX_ROWS),
    sb.from("assessments").select("*").limit(MAX_ROWS),
    sb.from("analytics_events").select("user_id_hash,event_name,event_type,occurred_at").limit(MAX_ROWS),
    sb.from("content_versions").select("id,label"),
  ]);

  const accountByAuthId = new Map<string, RawAccount>();
  for (const row of (accountsRes.data ?? []) as RawAccount[]) {
    if (row.auth_user_id) accountByAuthId.set(row.auth_user_id, row);
  }
  const asmtsByUser = new Map<string, RawAsmt[]>();
  for (const row of (asmtsRes.data ?? []) as RawAsmt[]) {
    if (!row.user_id) continue;
    const list = asmtsByUser.get(row.user_id) ?? [];
    list.push(row);
    asmtsByUser.set(row.user_id, list);
  }
  const eventsByHash = new Map<string, RawEvent[]>();
  for (const row of (eventsRes.data ?? []) as RawEvent[]) {
    if (!row.user_id_hash) continue;
    const list = eventsByHash.get(row.user_id_hash) ?? [];
    list.push(row);
    eventsByHash.set(row.user_id_hash, list);
  }
  const versionLabels = new Map<string, string>();
  for (const v of (versionsRes.data ?? []) as Array<{ id: string; label: string }>) {
    versionLabels.set(v.id, v.label);
  }
  return { profiles: (profilesRes.data ?? []) as RawProfile[], accountByAuthId, asmtsByUser, eventsByHash, versionLabels };
}

function countEvent(events: RawEvent[], name: string): number {
  return events.filter((e) => (e.event_name ?? e.event_type) === name).length;
}
function hasEvent(events: RawEvent[], name: string): boolean {
  return events.some((e) => (e.event_name ?? e.event_type) === name);
}
function maxIso(values: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  for (const v of values) {
    if (v && (!best || v > best)) best = v;
  }
  return best;
}

function buildAggregate(profile: RawProfile, loaded: Loaded): UserAggregate {
  const account = loaded.accountByAuthId.get(profile.id);
  const asmts = loaded.asmtsByUser.get(profile.id) ?? [];
  const events = loaded.eventsByHash.get(analyticsHash(profile.id)) ?? [];

  const completed = asmts.filter((a) => a.completed_at);
  const hasCompassResult = completed.some((a) => extractCoreResult(a.result)?.topCluster);
  const lastEventAt = maxIso(events.map((e) => e.occurred_at));
  const lastAsmtAt = maxIso(asmts.flatMap((a) => [a.completed_at, a.started_at]));

  return {
    registeredAt: profile.created_at,
    lastActiveAt: maxIso([lastEventAt, lastAsmtAt]),
    assessmentsStarted: asmts.length,
    assessmentsCompleted: completed.length,
    hasCompassResult,
    resultsViewed: hasEvent(events, "results_viewed"),
    kaiOpened: hasEvent(events, "kai_opened"),
    kaiSessions: countEvent(events, "kai_chat_started"),
    kaiMessages: countEvent(events, "kai_message_sent"),
    plansSaved: countEvent(events, "kai_plan_saved"),
    tasksCompleted: countEvent(events, "kai_task_completed"),
    isDeleted: Boolean(account?.deleted_at),
  };
}

function primaryResultLabel(asmts: RawAsmt[]): string | null {
  const latest = asmts
    .filter((a) => a.completed_at)
    .sort((x, y) => (y.completed_at ?? "").localeCompare(x.completed_at ?? ""))[0];
  return latest ? extractCoreResult(latest.result)?.topCluster ?? null : null;
}

// ── Filtering / sorting (JS, over the small dataset) ─────────────────────────

function matchesFilter(row: UserListRow, agg: UserAggregate, f: UsersFilter, nowIso: string): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = [row.name, row.email, row.id, row.country].filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.account === "active" && row.status !== "active") return false;
  if (f.account === "deleted" && row.status !== "deleted") return false;
  if (f.language !== "all" && row.language !== f.language) return false;
  if (f.risk !== "all" && row.risk !== f.risk) return false;

  if (f.assessment === "none" && agg.assessmentsStarted > 0) return false;
  if (f.assessment === "in_progress" && !(agg.assessmentsStarted > agg.assessmentsCompleted)) return false;
  if (f.assessment === "compass_completed" && !agg.hasCompassResult) return false;
  if (f.assessment === "multiple_completed" && agg.assessmentsCompleted < 2) return false;

  if (f.kai === "never" && agg.kaiOpened) return false;
  if (f.kai === "used" && !agg.kaiOpened) return false;
  if (f.kai === "has_plans" && agg.plansSaved === 0) return false;

  if (f.activity !== "all") {
    const d = daysSince(row.lastActiveAt, nowIso);
    if (f.activity === "active_7d" && !(d !== null && d <= 7)) return false;
    if (f.activity === "active_30d" && !(d !== null && d <= 30)) return false;
    if (f.activity === "inactive_30d" && !(d !== null && d > 30)) return false;
    if (f.activity === "inactive_90d" && !(d !== null && d > 90)) return false;
  }
  return true;
}

const RISK_ORDER = { high_risk: 3, needs_attention: 2, healthy: 1 } as const;

function sortRows(rows: UserListRow[], sort: SortKey): UserListRow[] {
  const by = [...rows];
  const cmpDateDesc = (a: string | null, b: string | null) => (b ?? "").localeCompare(a ?? "");
  switch (sort) {
    case "registered_asc":
      return by.reverse(); // rows arrive newest-first from the query default
    case "last_active":
      return by.sort((a, b) => cmpDateDesc(a.lastActiveAt, b.lastActiveAt));
    case "assessments":
      return by.sort((a, b) => b.assessmentsCompleted - a.assessmentsCompleted);
    case "kai":
      return by.sort((a, b) => b.kaiSessions - a.kaiSessions);
    case "risk":
      return by.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
    case "name":
      return by.sort((a, b) => (a.name ?? "~").localeCompare(b.name ?? "~"));
    case "registered_desc":
    default:
      return by;
  }
}

export async function getUsersList(
  filter: UsersFilter,
  sort: SortKey,
  pagination: Pagination,
  nowIso: string,
): Promise<UserListResult> {
  const loaded = await loadAll();

  // Newest registration first as the stable base order.
  const profiles = [...loaded.profiles].sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );

  const built = profiles.map((p) => {
    const agg = buildAggregate(p, loaded);
    const account = loaded.accountByAuthId.get(p.id);
    const asmts = loaded.asmtsByUser.get(p.id) ?? [];
    const row: UserListRow = {
      id: p.id,
      name: account?.name ?? p.display_name ?? null,
      email: account?.email ?? null,
      language: p.locale ?? null,
      country: p.country ?? null,
      status: agg.isDeleted ? "deleted" : "active",
      assessmentsCompleted: agg.assessmentsCompleted,
      primaryResult: primaryResultLabel(asmts),
      kaiSessions: agg.kaiSessions,
      plansSaved: agg.plansSaved,
      lastActiveAt: agg.lastActiveAt,
      risk: computeRisk(agg, nowIso).level,
      engagement: computeEngagement(agg, nowIso).level,
    };
    return { row, agg };
  });

  const matched = built.filter(({ row, agg }) => matchesFilter(row, agg, filter, nowIso));
  const sorted = sortRows(
    matched.map((m) => m.row),
    sort,
  );
  const pageRows = sorted.slice(pagination.offset, pagination.offset + pagination.perPage);

  // Summary metrics over ALL users (not the filtered page).
  const all = built.map((b) => b.agg);
  const monthAgo = daysSince;
  const newInPeriod = all.filter((a) => {
    const d = monthAgo(a.registeredAt, nowIso);
    return d !== null && d <= 30;
  }).length;
  const withAssessment = all.filter((a) => a.assessmentsStarted > 0).length;
  const compassCompleted = all.filter((a) => a.hasCompassResult).length;
  const kaiUsers = all.filter((a) => a.kaiOpened).length;
  const activeLast30d = all.filter((a) => {
    const d = daysSince(a.lastActiveAt, nowIso);
    return d !== null && d <= 30;
  }).length;

  return {
    rows: pageRows,
    total: matched.length,
    summary: {
      totalUsers: loaded.profiles.length,
      newInPeriod,
      compassCompletionRate: withAssessment > 0 ? Math.round((compassCompleted / withAssessment) * 1000) / 10 : null,
      kaiAdoptionRate: loaded.profiles.length > 0 ? Math.round((kaiUsers / loaded.profiles.length) * 1000) / 10 : null,
      activeLast30d,
    },
  };
}

function confidenceOf(result: unknown): number | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  const score = r.score as Record<string, unknown> | undefined;
  const raw = (score?.confidencePercentage ?? r.confidencePercentage) as unknown;
  return typeof raw === "number" ? Math.round(raw) : null;
}

export async function getUserDetail(userId: string, nowIso: string): Promise<UserDetailData | null> {
  const loaded = await loadAll();
  const profile = loaded.profiles.find((p) => p.id === userId);
  if (!profile) return null;

  const account = loaded.accountByAuthId.get(profile.id);
  const asmts = loaded.asmtsByUser.get(profile.id) ?? [];
  const events = loaded.eventsByHash.get(analyticsHash(profile.id)) ?? [];
  const agg = buildAggregate(profile, loaded);

  const assessments: AssessmentSummary[] = asmts
    .sort((x, y) => (y.started_at ?? "").localeCompare(x.started_at ?? ""))
    .map((a) => {
      const core = extractCoreResult(a.result);
      return {
        id: a.id,
        label: loaded.versionLabels.get(a.version_id) ?? "Assessment",
        startedAt: a.started_at,
        completedAt: a.completed_at,
        locale: a.locale,
        primaryCluster: core?.topCluster ?? null,
        archetype: core?.archetype ?? null,
        confidence: confidenceOf(a.result),
      };
    });

  const timeline = buildTimeline({
    registeredAt: profile.created_at,
    assessments: asmts.map((a) => ({
      label: loaded.versionLabels.get(a.version_id) ?? "Assessment",
      startedAt: a.started_at,
      completedAt: a.completed_at,
    })),
    events: events
      .filter((e) => e.occurred_at)
      .map((e) => ({ name: (e.event_name ?? e.event_type) ?? "", at: e.occurred_at as string })),
  });

  return {
    id: profile.id,
    name: account?.name ?? profile.display_name ?? null,
    email: account?.email ?? null,
    emailVerified: account?.email_verified ?? null,
    language: profile.locale ?? null,
    country: profile.country ?? null,
    registeredAt: profile.created_at,
    lastActiveAt: agg.lastActiveAt,
    status: agg.isDeleted ? "deleted" : "active",
    aggregate: agg,
    risk: computeRisk(agg, nowIso),
    engagement: computeEngagement(agg, nowIso),
    timeline,
    assessments,
  };
}
