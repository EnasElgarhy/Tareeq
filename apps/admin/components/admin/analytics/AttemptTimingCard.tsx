import { Card } from "@/components/admin/ui/Card";
import { FastFlag } from "@/components/admin/analytics/TimingTable";
import type { AttemptTimingLookup } from "@/lib/admin/analytics/timing-queries";

function fmtShare(share: number | null): string {
  return share === null ? "—" : `${Math.round(share * 100)}%`;
}

/** Time per question for one stored attempt, or why there is none yet. */
export function AttemptTimingCard({ lookup }: { lookup: AttemptTimingLookup }) {
  const { attempt, hasResponsesTable } = lookup;
  if (!attempt) {
    return (
      <Card tone="tinted" className="p-5 text-sm text-adm-ink-muted">
        Per-question timing is not saved for this attempt.{" "}
        {hasResponsesTable
          ? "Its answers were stored without time on screen."
          : "The core_responses table is not in this database yet."}{" "}
        Timings recorded by the browser appear, unnamed, under Analytics · Timing.
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-faint">
            Average per question
          </p>
          <p className="adm-display mt-0.5 text-3xl tabular-nums">{attempt.avgSeconds.toFixed(1)} s</p>
          <p className="mt-1 text-xs text-adm-ink-muted">{attempt.answered} questions timed</p>
        </div>
        <FastFlag attempt={attempt} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {attempt.parts.map((part) => (
          <div
            key={part.part}
            className={`rounded-adm-md border p-3 ${
              part.flags.flagged ? "border-adm-error/40 bg-adm-error/5" : "border-adm-line"
            }`}
          >
            <p className="text-xs font-bold text-adm-ink">Part {part.part}</p>
            <dl className="mt-1.5 space-y-0.5 text-xs text-adm-ink-soft">
              <div className="flex justify-between gap-2">
                <dt>Average</dt>
                <dd className="tabular-nums">{part.avgSeconds.toFixed(1)} s</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Median</dt>
                <dd className={`tabular-nums ${part.flags.rushed ? "font-bold text-adm-error-ink" : ""}`}>
                  {part.medianSeconds.toFixed(1)} s
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Same position</dt>
                <dd className={`tabular-nums ${part.flags.samePosition ? "font-bold text-adm-error-ink" : ""}`}>
                  {fmtShare(part.flags.largestSamePositionShare)}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-adm-ink-faint">
        A part is flagged when its median is under 2 s or 90% of its answers sit in one screen position (spec §5).
      </p>
    </Card>
  );
}
