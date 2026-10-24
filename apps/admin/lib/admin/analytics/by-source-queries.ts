import {
  aggregateBySource,
  SOURCE_EVENT_NAMES,
  weekBounds,
  type SourceEvent,
  type SourceReport,
  type SourceReportParams,
} from "@/lib/admin/analytics/by-source";
import { fetchAllPages } from "@/lib/admin/analytics/event-pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface SourceReportData {
  report: SourceReport;
  truncated: boolean;
}

interface RawSourceEvent {
  event_name: string;
  metadata: Record<string, unknown> | null;
}

/** One week of the report's events, aggregated by source. */
export async function getSourceReport(params: SourceReportParams): Promise<SourceReportData> {
  const sb = createSupabaseAdminClient();
  const { startIso, endIso } = weekBounds(params.weekStart);
  const { rows, truncated } = await fetchAllPages<RawSourceEvent>((from, to) =>
    sb
      .from("analytics_events")
      .select("event_name,metadata")
      .in("event_name", SOURCE_EVENT_NAMES)
      .gte("occurred_at", startIso)
      .lt("occurred_at", endIso)
      .order("occurred_at", { ascending: true })
      .range(from, to),
  );
  const events: SourceEvent[] = rows.map((row) => ({
    eventName: row.event_name,
    metadata: row.metadata ?? {},
  }));
  return {
    report: aggregateBySource(events, params.touch, params.groupBy),
    truncated,
  };
}
