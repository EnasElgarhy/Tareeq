import type { AnalyticsEvent } from "@/lib/analytics/types";

/**
 * Durable local persistence for queued-but-not-yet-flushed events, so a
 * hard page close before a flush doesn't silently lose them — they're
 * reloaded into the queue on the next page load and retried. No-ops outside
 * a browser (server-side calls have no "page" to survive).
 */

const STORAGE_KEY = "tareeq_analytics_pending_events";
const MAX_STORED = 500;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPendingEvents(): AnalyticsEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function savePendingEvents(events: AnalyticsEvent[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_STORED)));
  } catch {
    // Storage full or unavailable (private browsing) — events still live in
    // the in-memory queue for this page session; only unload-durability is lost.
  }
}

export function clearPendingEvents(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
