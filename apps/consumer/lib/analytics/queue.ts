import type { AnalyticsEvent } from "@/lib/analytics/types";

/**
 * Pure in-memory FIFO queue — no timers, no network, no storage. Those
 * concerns live in flush.ts (when to send) and storage.ts (durability)
 * respectively, so this piece is trivial to unit test in isolation.
 */
export interface AnalyticsQueue {
  enqueue(event: AnalyticsEvent): void;
  /** Removes and returns up to `limit` events, oldest first. */
  drain(limit?: number): AnalyticsEvent[];
  /** Puts events back at the front of the queue (a failed flush's retries). */
  requeue(events: AnalyticsEvent[]): void;
  /** How many times this event has been requeued after a failed send. */
  attemptsFor(eventId: string): number;
  /** Drops attempt-tracking for an event that's been sent or permanently dropped. */
  forget(eventId: string): void;
  size(): number;
  peekAll(): AnalyticsEvent[];
}

export function createQueue(initial: AnalyticsEvent[] = []): AnalyticsQueue {
  let items: AnalyticsEvent[] = [...initial];
  const attempts = new Map<string, number>();

  return {
    enqueue(event) {
      items.push(event);
    },
    drain(limit = items.length) {
      return items.splice(0, limit);
    },
    requeue(events) {
      for (const event of events) {
        attempts.set(event.event_id, (attempts.get(event.event_id) ?? 0) + 1);
      }
      items = [...events, ...items];
    },
    attemptsFor(eventId) {
      return attempts.get(eventId) ?? 0;
    },
    forget(eventId) {
      attempts.delete(eventId);
    },
    size() {
      return items.length;
    },
    peekAll() {
      return [...items];
    },
  };
}
