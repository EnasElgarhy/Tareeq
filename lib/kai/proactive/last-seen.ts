const LAST_SEEN_KEY = "tareeq.kai.lastSeenAt.v1";

/**
 * Nothing in the app previously recorded "when did this person last show
 * up" — needed for the inactivity nudge, so it's tracked here. Read the
 * old value BEFORE calling markSeenNow() for the current visit, or the
 * nudge will never fire (it'd always compare "now" against "now").
 */
export function readLastSeenAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markSeenNow(now: Date = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, now.toISOString());
  } catch {
    // storage unavailable (private mode) — nudge just won't fire this session, harmless
  }
}

/** Whole days between a stored ISO timestamp and `now`. Null when there's
 * no prior visit to compare against (first-ever session) or the stored
 * value is unparseable. */
export function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / (24 * 60 * 60 * 1000));
}
