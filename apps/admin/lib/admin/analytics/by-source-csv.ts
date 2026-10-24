import {
  SOURCE_METRICS,
  weekBounds,
  type SourceReport,
  type SourceReportParams,
  type SourceRow,
} from "@/lib/admin/analytics/by-source";
import { rowsToCsv, type CsvColumn } from "@/lib/admin/analytics/csv";

export function buildSourceReportCsv(report: SourceReport, params: SourceReportParams): string {
  const { weekStart, weekEnd } = weekBounds(params.weekStart);
  const columns: CsvColumn<SourceRow>[] = [
    { key: "week", header: "Week (Mon–Sun, Dubai)", value: () => `${weekStart} to ${weekEnd}` },
    { key: "touch", header: "Attribution", value: () => `${params.touch} touch` },
    { key: "source", header: "Source", value: (r) => r.source },
    { key: "post", header: "Post", value: (r) => r.post },
    ...SOURCE_METRICS.map(
      (m): CsvColumn<SourceRow> => ({
        key: m.key,
        header: m.eventName ? m.label : `${m.label} (not tracked yet)`,
        value: (r) => r.counts[m.key],
      }),
    ),
  ];
  const totalRow: SourceRow = { source: "Total", post: null, counts: report.totals };
  return rowsToCsv([...report.rows, totalRow], columns);
}
