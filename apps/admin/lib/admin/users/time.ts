const MS_PER_DAY = 86_400_000;

/**
 * Whole days between an ISO timestamp and a reference "now" ISO. Returns null
 * for missing/invalid input (callers must treat null as "unknown", never 0).
 * Negative diffs (future timestamps) clamp to 0.
 */
export function daysSince(iso: string | null | undefined, nowIso: string): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.max(0, Math.floor((now - then) / MS_PER_DAY));
}
