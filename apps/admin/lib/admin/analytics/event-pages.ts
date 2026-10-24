/**
 * PostgREST returns at most 1,000 rows per request (the project's max-rows
 * setting), so `.limit(5000)` alone silently stops at 1,000. Event-level
 * reports page through with `.range()` instead, up to a hard cap, and say
 * when the cap cut the read short.
 */

export const EVENT_PAGE_SIZE = 1000;
export const EVENT_ROW_CAP = 50_000;

export interface PagedRows<T> {
  rows: T[];
  /** True when the cap was reached and later rows were not read. */
  truncated: boolean;
}

interface PageError {
  message: string;
  code?: string;
}

type PageResult<T> = PromiseLike<{ data: T[] | null; error: PageError | null }>;

/** An Error that keeps the PostgREST code, so callers can tell "table missing" apart. */
export class PageReadError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
  ) {
    super(message);
    this.name = "PageReadError";
  }
}

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PageResult<T>,
  cap: number = EVENT_ROW_CAP,
): Promise<PagedRows<T>> {
  const rows: T[] = [];
  for (let from = 0; from < cap; from += EVENT_PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + EVENT_PAGE_SIZE - 1);
    if (error) throw new PageReadError(error.message, error.code ?? null);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < EVENT_PAGE_SIZE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}
