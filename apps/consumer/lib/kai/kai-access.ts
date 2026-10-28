/**
 * Kai is included for 3 months from taking CORE (28 Oct update, Part A.2).
 * After that the report stays open but Kai stops answering, and the student
 * is shown the end date beforehand. "Taking CORE" is the attempt's
 * `completed_at`.
 */

export const KAI_ACCESS_MONTHS = 3;

/**
 * Same day of the month, 3 months on (UTC). A day that does not exist in the
 * target month rolls back to its last day: 30 Nov → 28 or 29 Feb.
 */
export function kaiAccessEndsAt(completedAt: string): string | null {
  const start = new Date(completedAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(1);
  end.setUTCMonth(start.getUTCMonth() + KAI_ACCESS_MONTHS);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return end.toISOString();
}

export function isKaiAccessOpen(completedAt: string | null, now: Date = new Date()): boolean {
  if (!completedAt) return false;
  const endsAt = kaiAccessEndsAt(completedAt);
  return endsAt !== null && now.getTime() < Date.parse(endsAt);
}
