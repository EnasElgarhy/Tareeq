/**
 * Types for the admin Users (Student & Account Management) module.
 *
 * SOURCE-OF-TRUTH NOTE (see USERS_MODULE_ARCHITECTURE.md): every field here is
 * derived from data that already exists in Supabase — `profiles`,
 * `user_accounts`, `assessments`, `analytics_events`. Nothing is fabricated.
 * Fields that cannot yet be sourced honestly are modelled as nullable/optional
 * and rendered as "Not collected" in the UI, never guessed.
 */

export type AccountStatus = "active" | "deleted";

export type RiskLevel = "healthy" | "needs_attention" | "high_risk";
export type EngagementLevel = "low" | "medium" | "high";

/** A signal severity feeds the risk level; kept explicit for transparency. */
export type Severity = "low" | "medium" | "high";

/**
 * The per-user aggregate the (server-only) query layer assembles from existing
 * tables. The pure risk/engagement/timeline modules take ONLY this — no DB,
 * no I/O — so they stay deterministic and unit-testable.
 */
export interface UserAggregate {
  /** profiles.created_at */
  registeredAt: string | null;
  /** Most recent real activity across analytics_events + assessments, or null. */
  lastActiveAt: string | null;
  assessmentsStarted: number;
  assessmentsCompleted: number;
  /** A CORE result exists on at least one completed assessment. */
  hasCompassResult: boolean;
  /** results_viewed analytics event seen. */
  resultsViewed: boolean;
  /** kai_opened analytics event seen. */
  kaiOpened: boolean;
  kaiSessions: number;
  kaiMessages: number;
  /** kai_plan_saved events (plans themselves are localStorage — see docs). */
  plansSaved: number;
  /** kai_task_completed events. */
  tasksCompleted: number;
  /** user_accounts.deleted_at present. */
  isDeleted: boolean;
}

export interface RiskReason {
  code: string;
  label: string;
  severity: Severity;
}

export interface RiskResult {
  level: RiskLevel;
  score: number;
  reasons: RiskReason[];
}

export interface EngagementFactor {
  code: string;
  label: string;
  /** Positive contribution to the engagement score. */
  points: number;
}

export interface EngagementResult {
  level: EngagementLevel;
  score: number;
  factors: EngagementFactor[];
}

/** A single point on the student journey timeline. */
export interface TimelineEvent {
  at: string;
  code: string;
  label: string;
  /** verified = backed by a concrete record; inferred = derived heuristically. */
  kind: "verified" | "inferred";
}

// ── List filters / sort / pagination ────────────────────────────────────────

export type AccountFilter = "all" | "active" | "deleted";
export type LanguageFilter = "all" | "en" | "ar";
export type AssessmentFilter =
  | "all"
  | "none"
  | "in_progress"
  | "compass_completed"
  | "multiple_completed";
export type KaiFilter = "all" | "never" | "used" | "has_plans";
export type ActivityFilter = "all" | "active_7d" | "active_30d" | "inactive_30d" | "inactive_90d";
export type RiskFilter = "all" | RiskLevel;

export interface UsersFilter {
  search: string | null;
  account: AccountFilter;
  language: LanguageFilter;
  assessment: AssessmentFilter;
  kai: KaiFilter;
  activity: ActivityFilter;
  risk: RiskFilter;
}

export const SORT_KEYS = [
  "registered_desc",
  "registered_asc",
  "last_active",
  "assessments",
  "kai",
  "risk",
  "name",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface Pagination {
  page: number;
  perPage: number;
  offset: number;
}

// ── List / detail view models ───────────────────────────────────────────────

/** One row in the users list — the focused columns; everything else is on the
 *  detail page. */
export interface UserListRow {
  id: string;
  name: string | null;
  email: string | null;
  language: string | null;
  country: string | null;
  status: AccountStatus;
  assessmentsCompleted: number;
  primaryResult: string | null;
  kaiSessions: number;
  plansSaved: number;
  lastActiveAt: string | null;
  risk: RiskLevel;
  engagement: EngagementLevel;
}

export interface UserSummaryMetrics {
  totalUsers: number;
  newInPeriod: number;
  compassCompletionRate: number | null;
  kaiAdoptionRate: number | null;
  activeLast30d: number;
}

export interface UserListResult {
  rows: UserListRow[];
  total: number;
  summary: UserSummaryMetrics;
}

export interface AssessmentSummary {
  id: string;
  label: string;
  startedAt: string | null;
  completedAt: string | null;
  locale: string | null;
  primaryCluster: string | null;
  archetype: string | null;
  confidence: number | null;
}

export interface UserDetailData {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean | null;
  language: string | null;
  country: string | null;
  registeredAt: string | null;
  lastActiveAt: string | null;
  status: AccountStatus;
  aggregate: UserAggregate;
  risk: RiskResult;
  engagement: EngagementResult;
  timeline: TimelineEvent[];
  assessments: AssessmentSummary[];
}
