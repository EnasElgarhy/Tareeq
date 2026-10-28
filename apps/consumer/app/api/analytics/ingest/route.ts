import { NextResponse } from "next/server";
import { analyticsBatchSchema, partitionValidEvents } from "@/lib/analytics/events";
import { toDbRow } from "@/lib/analytics/ingest-row";
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
