import { NextResponse } from "next/server";
import { analyticsBatchSchema, partitionValidEvents } from "@/lib/analytics/events";
import type { AnalyticsEvent } from "@/lib/analytics/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * This app's own ingestion endpoint — mirrors Tareeq-admin's
 * app/api/analytics/ingest/route.ts. Both apps share one Supabase project,
 * so each writes directly to the same `analytics_events` table rather than
 * one app proxying to the other across origins. See
 * ANALYTICS_INSTRUMENTATION.md for why there are two endpoints today and
 * how they'd collapse into one once these repos share a build pipeline.
 */
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: valid.length, rejected: rejectedCount }, { status: 200 });
}
