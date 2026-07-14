const STORAGE_KEY = "tareeq.question.attempts.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readCounts(): Record<string, number> {
  if (!isBrowser()) return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Increments and returns how many times this question has been viewed in
 * the current browser session — sessionStorage-backed, mirroring
 * lib/analytics/session.ts's storage pattern. Used as the `attempt_number`
 * metadata on question_viewed/question_revisited so a later abandonment or
 * change-rate analysis can tell "first time seeing this" from "third time
 * back on it" without needing a server round trip.
 */
export function bumpQuestionAttempt(externalId: string): number {
  if (!isBrowser()) return 1;
  const counts = readCounts();
  const next = (counts[externalId] ?? 0) + 1;
  counts[externalId] = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // Storage full/unavailable — attempt_number just won't increment this
    // time; not worth failing the question render over.
  }
  return next;
}

/** Test/teardown hook. */
export function resetQuestionAttempts(): void {
  if (isBrowser()) window.sessionStorage.removeItem(STORAGE_KEY);
}
