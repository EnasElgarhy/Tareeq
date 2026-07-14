import type { AnalyticsQueue } from "@/lib/analytics/queue";
import type { AnalyticsEvent, AnalyticsProvider } from "@/lib/analytics/types";

export interface FlushOptions {
  maxAttempts?: number;
  onDrop?: (events: AnalyticsEvent[]) => void;
  /** Called once per flush pass (any outcome) — track.ts uses this to re-sync storage. */
  onAfterFlush?: () => void;
}

const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * One flush pass: drains the queue, sends the batch via the provider, and
 * either forgets (success), requeues (transient failure, under the attempt
 * cap), or drops (malformed, or retries exhausted) each event.
 */
export async function flushQueue(
  queue: AnalyticsQueue,
  provider: AnalyticsProvider,
  options: FlushOptions = {},
): Promise<void> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const batch = queue.drain();
  if (batch.length === 0) return;

  const result = await provider.send(batch);
  if (result.ok) {
    for (const event of batch) queue.forget(event.event_id);
    options.onAfterFlush?.();
    return;
  }

  const retryableIds = new Set(result.retryable.map((e) => e.event_id));
  const rejected = batch.filter((e) => !retryableIds.has(e.event_id));
  const candidates = batch.filter((e) => retryableIds.has(e.event_id));

  const dropped: AnalyticsEvent[] = [...rejected];
  const toRetry: AnalyticsEvent[] = [];
  for (const event of candidates) {
    if (queue.attemptsFor(event.event_id) + 1 >= maxAttempts) {
      dropped.push(event);
      queue.forget(event.event_id);
    } else {
      toRetry.push(event);
    }
  }
  for (const event of rejected) queue.forget(event.event_id);

  if (toRetry.length > 0) queue.requeue(toRetry);
  if (dropped.length > 0) options.onDrop?.(dropped);
  options.onAfterFlush?.();
}

export interface FlushSchedulerOptions extends FlushOptions {
  /** Flush on this interval. 0 disables interval-based flushing. */
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 10_000;

/**
 * Wires interval and page-unload flush triggers for a long-lived browser
 * session. Returns a teardown function. No-ops (beyond the interval) outside
 * a browser — a single server-side call should flush immediately via
 * `flushQueue` instead of scheduling anything.
 */
export function startFlushScheduler(
  queue: AnalyticsQueue,
  provider: AnalyticsProvider,
  options: FlushSchedulerOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const teardownFns: (() => void)[] = [];

  if (intervalMs > 0) {
    const timer = setInterval(() => {
      if (queue.size() > 0) void flushQueue(queue, provider, options);
    }, intervalMs);
    teardownFns.push(() => clearInterval(timer));
  }

  if (typeof window !== "undefined") {
    const onPageHide = () => {
      void flushQueue(queue, provider, options);
    };
    window.addEventListener("pagehide", onPageHide);
    teardownFns.push(() => window.removeEventListener("pagehide", onPageHide));
  }

  return () => teardownFns.forEach((fn) => fn());
}
