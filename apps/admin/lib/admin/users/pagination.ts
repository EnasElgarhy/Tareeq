import type { Pagination } from "@/lib/admin/users/types";

export const PER_PAGE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PER_PAGE = 25;

function toInt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse page/perPage from URL params into a DB-ready offset. Guards against
 * hand-edited URLs: perPage is clamped to the allowlist and page to >= 1, so
 * a query can never request an unbounded window.
 */
export function parsePagination(
  pageRaw: string | null | undefined,
  perPageRaw: string | null | undefined,
): Pagination {
  const perPageCandidate = toInt(perPageRaw) ?? DEFAULT_PER_PAGE;
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perPageCandidate)
    ? perPageCandidate
    : DEFAULT_PER_PAGE;
  const page = Math.max(1, toInt(pageRaw) ?? 1);
  return { page, perPage, offset: (page - 1) * perPage };
}

/** Total page count for a result set (at least 1). */
export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}
