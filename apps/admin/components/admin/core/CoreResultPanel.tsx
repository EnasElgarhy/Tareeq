import { Badge } from "@/components/admin/ui/Badge";
import { CORE_QUESTION_SET } from "@/lib/admin/core/framework";
import { axisZoneLabel, summarizeCoreResult } from "@/lib/admin/core/result";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-faint">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold capitalize text-adm-ink">
        {value}
      </p>
    </div>
  );
}

/** Compact CORE 2.0 result chips for a table cell. */
export function CoreResultInline({ result }: { result: unknown }) {
  const s = summarizeCoreResult(CORE_QUESTION_SET, result);
  if (!s || s.leadingCuriosities.length === 0) {
    return <span className="text-adm-ink-faint">In progress</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {s.leadingCuriosities.map((c) => (
        <Badge key={c}>{c}</Badge>
      ))}
      {s.directionClarity && (
        <span className="text-xs capitalize text-adm-ink-muted">
          {s.directionClarity}
        </span>
      )}
    </div>
  );
}

/** Full CORE 2.0 result for the run detail page. */
export function CoreResultPanel({ result }: { result: unknown }) {
  const s = summarizeCoreResult(CORE_QUESTION_SET, result);
  if (!s) {
    return (
      <p className="text-sm text-adm-ink-muted">
        No CORE 2.0 result stored for this attempt.
      </p>
    );
  }
  const versions = Object.entries(s.contentVersions)
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ");
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        <Stat
          label="Leading curiosities"
          value={s.leadingCuriosities.join(", ") || "—"}
        />
        <Stat label="Direction" value={s.directionClarity ?? "—"} />
        <Stat
          label="Leading motivators"
          value={s.leadingMotivators.join(", ") || "No small set"}
        />
        {s.axes.map((a) => (
          <Stat
            key={a.axis}
            label={a.axis}
            value={axisZoneLabel(CORE_QUESTION_SET, a)}
          />
        ))}
      </div>
      <p className="text-xs text-adm-ink-muted">
        Scoring {s.scoringVersion}
        {versions ? ` · ${versions}` : ""}
      </p>
    </div>
  );
}
