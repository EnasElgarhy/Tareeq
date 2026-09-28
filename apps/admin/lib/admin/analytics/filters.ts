import type {
  AgeBand,
  AnalyticsFilters,
  DerivedRow,
  FlaggedFilterMode,
  TimeRange,
} from "@/lib/admin/analytics/types";

const FLAGGED_MODES: FlaggedFilterMode[] = ["include", "only", "exclude"];
const AGE_BANDS: AgeBand[] = ["under-16", "16-17", "18-19", "20-21", "22+", "unknown"];
const TIME_RANGES: TimeRange[] = ["7d", "30d", "90d", "12m"];
const DEFAULT_RANGE: TimeRange = "30d";

function paramOrNull(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : null;
}

function paramIsTrue(value: string | string[] | undefined): boolean {
  return paramOrNull(value) === "true";
}

/** Reads URLSearchParams-shaped input (Next.js `searchParams`) into typed filters. */
export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): AnalyticsFilters {
  const flaggedRaw = paramOrNull(searchParams.flagged);
  const flagged = FLAGGED_MODES.includes(flaggedRaw as FlaggedFilterMode)
    ? (flaggedRaw as FlaggedFilterMode)
    : "include";

  const ageBandRaw = paramOrNull(searchParams.ageBand);
  const ageBand = AGE_BANDS.includes(ageBandRaw as AgeBand)
    ? (ageBandRaw as AgeBand)
    : null;

  return {
    from: paramOrNull(searchParams.from),
    to: paramOrNull(searchParams.to),
    country: paramOrNull(searchParams.country),
    ageBand,
    gender: paramOrNull(searchParams.gender),
    catalogId: paramOrNull(searchParams.catalog),
    flagged,
    completedOnly: paramIsTrue(searchParams.completedOnly),
    researchOnly: paramIsTrue(searchParams.researchOnly),
  };
}

/** Parses the Growth section's range param (separate from the date filter). */
export function parseRangeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): TimeRange {
  const raw = paramOrNull(searchParams.range);
  return TIME_RANGES.includes(raw as TimeRange) ? (raw as TimeRange) : DEFAULT_RANGE;
}

function epoch(iso: string): number {
  return Date.parse(iso);
}

/**
 * Every filter except the date range. Exposed separately so callers (e.g.
 * the previous-period comparison window) can apply the same demographic/
 * catalog/quality filters while substituting their own date bounds.
 */
export function matchesNonDateFilters(
  row: DerivedRow,
  filters: AnalyticsFilters,
): boolean {
  if (filters.country && row.country !== filters.country) return false;
  if (filters.ageBand && row.ageBand !== filters.ageBand) return false;
  if (filters.gender && row.gender !== filters.gender) return false;

  if (filters.catalogId) {
    if (filters.catalogId === "legacy-core") {
      if (row.catalogId !== null) return false;
    } else if (row.catalogId !== filters.catalogId) {
      return false;
    }
  }

  if (filters.flagged === "only" && !row.isFlagged) return false;
  if (filters.flagged === "exclude" && row.isFlagged) return false;

  if (filters.completedOnly && row.completedAt === null) return false;
  if (filters.researchOnly && row.consentResearch !== true) return false;

  return true;
}

/**
 * Pure predicate: does this derived row pass the given filters? Date bounds
 * compare against `completedAt` (rows without a completion are excluded by
 * any date bound, since they can't be placed in time).
 */
export function matchesFilters(
  row: DerivedRow,
  filters: AnalyticsFilters,
): boolean {
  if (filters.from || filters.to) {
    if (!row.completedAt) return false;
    const rowMs = epoch(row.completedAt);
    if (Number.isNaN(rowMs)) return false;
    if (filters.from) {
      const fromMs = epoch(`${filters.from}T00:00:00.000Z`);
      if (rowMs < fromMs) return false;
    }
    if (filters.to) {
      const toMs = epoch(`${filters.to}T23:59:59.999Z`);
      if (rowMs > toMs) return false;
    }
  }

  return matchesNonDateFilters(row, filters);
}
