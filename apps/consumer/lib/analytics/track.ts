import type { EventName } from "@/lib/analytics/events";
import { flushQueue, startFlushScheduler } from "@/lib/analytics/flush";
import { createHttpProvider } from "@/lib/analytics/provider";
import { createQueue, type AnalyticsQueue } from "@/lib/analytics/queue";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { clearPendingEvents, loadPendingEvents, savePendingEvents } from "@/lib/analytics/storage";
import type {
  AnalyticsEvent,
  AnalyticsProvider,
  DeviceInfo,
  DeviceType,
  TrackEventPayload,
} from "@/lib/analytics/types";

/**
 * The only function application code should call. Everything else in this
 * directory — queueing, batching, retry, storage, session — is an
 * implementation detail behind this one entry point.
 */

const DEFAULT_ENDPOINT = "/api/analytics/ingest";
const MAX_BATCH_SIZE = 20;

interface Runtime {
  queue: AnalyticsQueue;
  provider: AnalyticsProvider;
}

let runtime: Runtime | null = null;

function persist(queue: AnalyticsQueue): void {
  const remaining = queue.peekAll();
  if (remaining.length === 0) clearPendingEvents();
  else savePendingEvents(remaining);
}

function getRuntime(): Runtime {
  if (runtime) return runtime;

  const provider = createHttpProvider(DEFAULT_ENDPOINT);
  const queue = createQueue(loadPendingEvents());

  if (typeof window !== "undefined") {
    startFlushScheduler(queue, provider, {
      onAfterFlush: () => persist(queue),
    });
  }

  runtime = { queue, provider };
  return runtime;
}

/**
 * Pseudonymizes a user id for analytics correlation. This runs in public
 * client code with no secret salt — it is NOT the same security property as
 * the server-side export hash in lib/admin/analytics/csv.ts. Treat it as a
 * stable pseudonym ("same person across events"), not as protection against
 * someone who already has the raw id.
 */
async function hashUserId(userId: string): Promise<string> {
  const data = new TextEncoder().encode(`tareeq-analytics-v1:${userId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function detectDevice(): DeviceInfo | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent ?? "";
  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = !isTablet && /Mobi|Android|iPhone/i.test(ua);
  const type: DeviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  return { type, userAgent: ua.slice(0, 200) };
}

function detectLocale(): string | null {
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return null;
}

async function buildEvent(name: EventName, payload: TrackEventPayload): Promise<AnalyticsEvent> {
  const { assessmentId, assessmentVersion, questionId, userId, country, ...metadata } = payload;
  return {
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event_name: name,
    session_id: getOrCreateSessionId(),
    user_id_hash: userId ? await hashUserId(userId) : null,
    assessment_id: assessmentId ?? null,
    assessment_version: assessmentVersion ?? null,
    question_id: questionId ?? null,
    locale: detectLocale(),
    device: detectDevice(),
    country: country ?? null,
    metadata,
  };
}

/**
 * Records an analytics event. Fire-and-forget — never throws, never blocks
 * the caller on a network round trip. Events are batched and sent in the
 * background (see queue.ts / flush.ts); a server-side call (no long-lived
 * page to schedule a timer against) flushes immediately instead.
 */
export function trackEvent(name: EventName, payload: TrackEventPayload = {}): void {
  void (async () => {
    try {
      const { queue, provider } = getRuntime();
      const event = await buildEvent(name, payload);
      queue.enqueue(event);
      persist(queue);

      if (typeof window === "undefined") {
        // No browser scheduler is running for this call — send right away.
        await flushQueue(queue, provider, { onAfterFlush: () => persist(queue) });
        return;
      }
      if (queue.size() >= MAX_BATCH_SIZE) {
        await flushQueue(queue, provider, { onAfterFlush: () => persist(queue) });
      }
    } catch {
      // Tracking must never surface an error to the caller — a dropped
      // event is an acceptable failure mode, a crashed page/action is not.
    }
  })();
}
