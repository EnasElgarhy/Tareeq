import { SORT_KEYS, type SortKey } from "@/lib/admin/users/types";

const DEFAULT_SORT: SortKey = "registered_desc";

/** Allowlisted sort-key parsing — never passes an arbitrary string toward a
 *  query. Unknown input falls back to the default (newest registration). */
export function parseSort(raw: string | null | undefined): SortKey {
  return (SORT_KEYS as readonly string[]).includes(raw ?? "")
    ? (raw as SortKey)
    : DEFAULT_SORT;
}

export function isDefaultSort(sort: SortKey): boolean {
  return sort === DEFAULT_SORT;
}
