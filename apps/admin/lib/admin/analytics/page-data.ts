import {
  parseFiltersFromSearchParams,
  parseRangeFromSearchParams,
} from "@/lib/admin/analytics/filters";
import { getAnalyticsViewModel } from "@/lib/admin/analytics/queries";
import type { AnalyticsFilters, AnalyticsViewModel } from "@/lib/admin/analytics/types";

export type AnalyticsSearchParams = Record<string, string | string[] | undefined>;

/** Shared per-tab loader: every analytics route parses the same query string. */
export async function loadAnalyticsPage(
  searchParams: Promise<AnalyticsSearchParams>,
): Promise<AnalyticsViewModel> {
  const resolved = await searchParams;
  const filters = parseFiltersFromSearchParams(resolved);
  const range = parseRangeFromSearchParams(resolved);
  return getAnalyticsViewModel(filters, range);
}

/** Query string for just the filters (no `range`) — the base for range-toggle links. */
export function buildFilterQueryString(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.country) params.set("country", filters.country);
  if (filters.ageBand) params.set("ageBand", filters.ageBand);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.catalogId) params.set("catalog", filters.catalogId);
  if (filters.flagged !== "include") params.set("flagged", filters.flagged);
  if (filters.completedOnly) params.set("completedOnly", "true");
  if (filters.researchOnly) params.set("researchOnly", "true");
  return params.toString();
}

export function buildQueryString(vm: Pick<AnalyticsViewModel, "filters" | "range">): string {
  const base = buildFilterQueryString(vm.filters);
  if (vm.range === "30d") return base;
  return base ? `${base}&range=${vm.range}` : `range=${vm.range}`;
}
