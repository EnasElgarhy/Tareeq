import { Badge } from "@/components/admin/ui/Badge";
import { summarizeResult } from "@/lib/admin/response-format";

/** Compact result chips for a table cell. */
export function ResultSummaryInline({ result }: { result: unknown }) {
  const s = summarizeResult(result);
  if (!s.topCluster && !s.archetype) {
    return <span className="text-adm-ink-faint">In progress</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {s.topCluster && <Badge>{s.topCluster}</Badge>}
      {s.archetype && <Badge>{s.archetype}</Badge>}
      {s.confidenceLabel && (
        <span className="text-xs text-adm-ink-muted">{s.confidenceLabel}</span>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-faint">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-adm-ink">{value}</p>
    </div>
  );
}

/** Full result panel for the run detail page. */
export function ResultSummary({ result }: { result: unknown }) {
  const s = summarizeResult(result);
  const hasResult = s.topCluster || s.archetype || s.primaryDriver;

  if (!hasResult) {
    return (
      <p className="text-sm text-adm-ink-muted">
        No result yet — this assessment hasn&apos;t been completed.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
      {s.topCluster && <Stat label="Top cluster" value={s.topCluster} />}
      {s.archetype && <Stat label="Archetype" value={s.archetype} />}
      {s.primaryDriver && <Stat label="Primary driver" value={s.primaryDriver} />}
      {s.secondaryDriver && (
        <Stat label="Secondary driver" value={s.secondaryDriver} />
      )}
      {s.ecosystemFit && <Stat label="Ecosystem fit" value={s.ecosystemFit} />}
      {s.confidenceLabel && (
        <Stat
          label="Confidence"
          value={
            s.confidencePercentage != null
              ? `${s.confidenceLabel} · ${Math.round(s.confidencePercentage)}%`
              : s.confidenceLabel
          }
        />
      )}
    </div>
  );
}
