import type {
  AccountFilter,
  ActivityFilter,
  AssessmentFilter,
  KaiFilter,
  LanguageFilter,
  RiskFilter,
  UsersFilter,
} from "@/lib/admin/users/types";

/** A plain string→string map (Next.js searchParams-shaped input). */
export type RawParams = Record<string, string | string[] | undefined>;

function one(params: RawParams, key: string): string | null {
  const v = params[key];
  const s = Array.isArray(v) ? v[0] : v;
  const trimmed = typeof s === "string" ? s.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Pick `raw` only if it's in the allowlist, else the first (default) option. */
function oneOf<T extends string>(raw: string | null, allowed: readonly T[]): T {
  return (allowed as readonly string[]).includes(raw ?? "") ? (raw as T) : allowed[0];
}

const ACCOUNT: readonly AccountFilter[] = ["all", "active", "deleted"];
const LANGUAGE: readonly LanguageFilter[] = ["all", "en", "ar"];
const ASSESSMENT: readonly AssessmentFilter[] = [
  "all",
  "none",
  "in_progress",
  "compass_completed",
  "multiple_completed",
];
const KAI: readonly KaiFilter[] = ["all", "never", "used", "has_plans"];
const ACTIVITY: readonly ActivityFilter[] = [
  "all",
  "active_7d",
  "active_30d",
  "inactive_30d",
  "inactive_90d",
];
const RISK: readonly RiskFilter[] = ["all", "healthy", "needs_attention", "high_risk"];

const SEARCH_MAX = 100;

/** Parse operational filters from URL query params. Unknown values fall back
 *  to the permissive default ("all"), so a hand-edited URL never errors. */
export function parseUserFilters(params: RawParams): UsersFilter {
  const rawSearch = one(params, "q");
  return {
    search: rawSearch ? rawSearch.slice(0, SEARCH_MAX) : null,
    account: oneOf(one(params, "account"), ACCOUNT),
    language: oneOf(one(params, "language"), LANGUAGE),
    assessment: oneOf(one(params, "assessment"), ASSESSMENT),
    kai: oneOf(one(params, "kai"), KAI),
    activity: oneOf(one(params, "activity"), ACTIVITY),
    risk: oneOf(one(params, "risk"), RISK),
  };
}

/** True when no filter is narrowing the list (used to show "clear filters"). */
export function isDefaultFilter(f: UsersFilter): boolean {
  return (
    !f.search &&
    f.account === "all" &&
    f.language === "all" &&
    f.assessment === "all" &&
    f.kai === "all" &&
    f.activity === "all" &&
    f.risk === "all"
  );
}

/** Serialise back to URLSearchParams, omitting defaults for clean URLs. */
export function filtersToSearchParams(f: UsersFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search) p.set("q", f.search);
  if (f.account !== "all") p.set("account", f.account);
  if (f.language !== "all") p.set("language", f.language);
  if (f.assessment !== "all") p.set("assessment", f.assessment);
  if (f.kai !== "all") p.set("kai", f.kai);
  if (f.activity !== "all") p.set("activity", f.activity);
  if (f.risk !== "all") p.set("risk", f.risk);
  return p;
}
