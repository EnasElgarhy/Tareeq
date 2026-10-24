import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import {
  NO_SOURCE,
  SOURCE_METRICS,
  type MetricCounts,
  type SourceReport,
} from "@/lib/admin/analytics/by-source";

function Count({ value }: { value: number | null }) {
  if (value === null) return <span className="text-adm-ink-faint">—</span>;
  return <span className={value === 0 ? "text-adm-ink-faint" : ""}>{value}</span>;
}

function Counts({ counts, strong = false }: { counts: MetricCounts; strong?: boolean }) {
  return (
    <>
      {SOURCE_METRICS.map((m) => (
        <Td
          key={m.key}
          className={`text-right tabular-nums ${strong ? "font-bold text-adm-ink" : ""}`}
        >
          <Count value={counts[m.key]} />
        </Td>
      ))}
    </>
  );
}

export function SourceReportTable({
  report,
  showPost,
}: {
  report: SourceReport;
  showPost: boolean;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Source</Th>
          {showPost && <Th>Post</Th>}
          {SOURCE_METRICS.map((m) => (
            <Th key={m.key} className="text-right">
              {m.label}
              {!m.eventName && (
                <span className="block text-[10px] font-semibold normal-case tracking-normal text-adm-gold-ink">
                  not tracked yet
                </span>
              )}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {report.rows.map((row) => (
          <Tr key={`${row.source}|${row.post ?? ""}`}>
            <Td className={row.source === NO_SOURCE ? "italic text-adm-ink-muted" : "font-semibold text-adm-ink"}>
              {row.source}
            </Td>
            {showPost && <Td>{row.post ?? <span className="text-adm-ink-faint">—</span>}</Td>}
            <Counts counts={row.counts} />
          </Tr>
        ))}
        <tr className="bg-adm-sand">
          <Td className="font-bold text-adm-ink">Total</Td>
          {showPost && <Td />}
          <Counts counts={report.totals} strong />
        </tr>
      </tbody>
    </Table>
  );
}
