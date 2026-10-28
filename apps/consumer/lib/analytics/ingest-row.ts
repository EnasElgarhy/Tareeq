import type { AnalyticsEvent } from "@/lib/analytics/types";

/**
 * One `analytics_events` row. Shared by the browser ingest endpoint and
 * server-side tracking (track-server.ts), so both write the same shape.
 */
const LEGACY_EVENT_TYPE: Partial<Record<string, string>> = {
  results_viewed: "results_viewed",
  results_downloaded: "result_downloaded",
  results_shared: "result_shared",
};

export function toDbRow(event: AnalyticsEvent) {
  return {
    event_id: event.event_id,
    event_name: event.event_name,
    event_type: LEGACY_EVENT_TYPE[event.event_name] ?? null,
    assessment_id: event.assessment_id,
    assessment_version: event.assessment_version,
    question_id: event.question_id ?? null,
    session_id: event.session_id,
    user_id_hash: event.user_id_hash,
    locale: event.locale,
    device: event.device,
    country: event.country,
    occurred_at: event.timestamp,
    metadata: event.metadata,
  };
}
