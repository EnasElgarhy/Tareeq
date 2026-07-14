import { NextResponse } from "next/server";
import { analyticsBatchSchema, partitionValidEvents } from "@/lib/analytics/events";
import type { AnalyticsEvent } from "@/lib/analytics/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Single ingestion endpoint for every analytics producer (this app's own
 * admin actions, the consumer app, and — eventually — the partner/research
 * portals). Public (no admin gate): the consumer app's quiz flow is
 * anonymous. Validates per-event rather than per-batch, so one malformed
 * event doesn't sink the rest.
 */

// Maps the new taxonomy back onto the Phase 1 3-value `event_type` column,
// so the original funnel query (and anything else still reading it) keeps
// working without a code change.
const LEGACY_EVENT_TYPE: Partial<Record<string, string>> = {
  results_viewed: "results_viewed",
  results_downloaded: "result_downloaded",
  results_shared: "result_shared",
};

function toDbRow(event: AnalyticsEvent) {
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsedBody = analyticsBatchSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const { valid, rejectedCount } = partitionValidEvents(parsedBody.data.events);
  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid events in batch." }, { status: 400 });
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("analytics_events")
    .upsert(valid.map(toDbRow), { onConflict: "event_id", ignoreDuplicates: true });

  if (error) {
    // A DB-side failure is ours, not the caller's — let the client retry
    // (the provider treats 5xx as retryable, 4xx as not).
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: valid.length, rejected: rejectedCount }, { status: 200 });
}
