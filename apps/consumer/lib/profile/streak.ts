/**
 * Day-over-day visit streak — "any app visit counts as a day" (a
 * deliberate product call, not the strictest option, but the simplest
 * to reason about and the lowest-friction for a brand-new feature).
 * Mirrors lib/kai/proactive/last-seen.ts: a small localStorage array of
 * ISO date-only strings, read/derived, never touched by AI.
 */

const VISIT_DATES_KEY = "tareeq.profile.visitDates.v1";
const STREAK_BADGE_THRESHOLD = 7;
const MAX_STORED_DATES = 90;

/** Local calendar date, not UTC — `toISOString()` would roll to the
 * wrong day for any timezone ahead of UTC (e.g. everywhere this product
 * actually ships: Egypt and the Gulf are all UTC+2 to UTC+4), since
 * `new Date()` and `new Date(y, m, d)` are local-time constructs. */
function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readVisitDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VISIT_DATES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === "string") : [];
  } catch {
    return [];
  }
}

/** Idempotent per day — calling this twice in the same day is a no-op
 * the second time, so it's safe to call on every mount. */
export function recordVisitToday(now: Date = new Date()): string[] {
  if (typeof window === "undefined") return [];
  const today = dateKey(now);
  const existing = readVisitDates();
  if (existing.includes(today)) return existing;

  const next = [...existing, today].slice(-MAX_STORED_DATES);
  try {
    window.localStorage.setItem(VISIT_DATES_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — streak just won't persist, harmless
  }
  return next;
}

export interface StreakInfo {
  /** Consecutive days visited, ending today (0 if today hasn't been
   * recorded yet — call recordVisitToday() before computing this for
   * an accurate "as of today" count). */
  count: number;
  /** Monday..Sunday of the current calendar week, true = visited. */
  weekVisited: boolean[];
  badgeUnlocked: boolean;
  daysUntilBadge: number;
}

/** Pure — takes the visit-date list rather than reading storage itself,
 * so it's trivially testable with fixed dates. */
export function computeStreak(visitDates: readonly string[], now: Date = new Date()): StreakInfo {
  const visited = new Set(visitDates);

  let count = 0;
  const cursor = new Date(now);
  while (visited.has(dateKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const isoWeekday = (now.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - isoWeekday);
  const weekVisited = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return visited.has(dateKey(day));
  });

  const badgeUnlocked = count >= STREAK_BADGE_THRESHOLD;
  return {
    count,
    weekVisited,
    badgeUnlocked,
    daysUntilBadge: badgeUnlocked ? 0 : STREAK_BADGE_THRESHOLD - count,
  };
}
