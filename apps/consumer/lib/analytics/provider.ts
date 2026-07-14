import type { AnalyticsEvent, AnalyticsProvider, FlushResult } from "@/lib/analytics/types";

/**
 * Transport abstraction — this is what makes the library provider-agnostic.
 * `trackEvent()` never talks to a network directly; it only ever enqueues
 * onto a queue that a provider eventually drains. Swapping the backing
 * store (Supabase today, PostHog/Mixpanel/GA4 later) means writing a new
 * `AnalyticsProvider` and wiring it in track.ts — no call site changes.
 */

/** Sends a batch to our own ingestion endpoint (Supabase-backed today). */
export function createHttpProvider(endpoint: string): AnalyticsProvider {
  return {
    name: "http",
    async send(events: AnalyticsEvent[]): Promise<FlushResult> {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
          // Lets the request complete even if this fires from a
          // pagehide/unload handler.
          keepalive: true,
        });

        if (response.ok) {
          return { ok: true, retryable: [] };
        }
        // 4xx = the server rejected the payload outright (malformed/schema
        // mismatch) — retrying would fail identically, so don't.
        if (response.status >= 400 && response.status < 500) {
          return { ok: false, retryable: [], error: `Rejected (${response.status})` };
        }
        // 5xx — likely transient; worth retrying.
        return { ok: false, retryable: events, error: `Server error (${response.status})` };
      } catch (error) {
        return {
          ok: false,
          retryable: events,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    },
  };
}

/** Sends nowhere — used in tests and contexts where tracking should be inert. */
export function createNoopProvider(): AnalyticsProvider {
  return {
    name: "noop",
    async send(): Promise<FlushResult> {
      return { ok: true, retryable: [] };
    },
  };
}
