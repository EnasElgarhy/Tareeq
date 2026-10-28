import "server-only";

import type { EventName } from "@/lib/analytics/events";
import { toDbRow } from "@/lib/analytics/ingest-row";
import { buildEvent } from "@/lib/analytics/track";
import type { TrackEventPayload } from "@/lib/analytics/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * `trackEvent` for route handlers and the Stripe webhook. The browser
 * library posts to the relative `/api/analytics/ingest`, which a server
 * cannot fetch, so server events were silently lost; this writes the row
 * straight to `analytics_events` instead. Never throws: a dropped event must
 * not fail the request that recorded it. Await it, so the write finishes
 * before the response does.
 */
export async function trackServerEvent(
  name: EventName,
  payload: TrackEventPayload = {},
): Promise<void> {
  try {
    const event = await buildEvent(name, payload);
    const { error } = await createSupabaseAdminClient()
      .from("analytics_events")
      .upsert([toDbRow(event)], { onConflict: "event_id", ignoreDuplicates: true });
    if (error) console.error(`[analytics] ${name} not recorded`, error.message);
  } catch (error) {
    console.error(`[analytics] ${name} not recorded`, error);
  }
}
