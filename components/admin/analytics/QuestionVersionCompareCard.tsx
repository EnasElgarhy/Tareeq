import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import type { QuestionWithVersion } from "@/lib/admin/analytics/question-queries";
import type {
  MetricDelta,
  QuestionVersionComparison,
} from "@/lib/admin/analytics/question-version-comparison";

function DeltaRow({
  label,
  delta,
  unit = "",
  format = (v: number) => String(v),
}: {
  label: string;
  delta: MetricDelta;
  unit?: string;
  format?: (v: number) => string;
}) {
  const arrow = delta.improved === null ? "→" : delta.improved ? "↑" : "↓";
  const colorCls =
    delta.improved === null
      ? "text-adm-ink-muted"
      : delta.improved
        ? "text-adm-mint-ink"
        : "text-adm-error-ink";

  return (
    <div className="flex items-center justify-between border-b border-adm-line py-2.5 text-[13px] last:border-b-0">
      <span className="text-adm-ink-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-adm-ink-soft">
          {delta.oldValue === null ? "—" : format(delta.oldValue)}
          {unit}
        </span>
        <span className="text-adm-ink-faint">→</span>
        <span className="font-semibold text-adm-ink">
          {delta.newValue === null ? "—" : format(delta.newValue)}
          {unit}
        </span>
        {delta.delta !== null && (
          <span className={`font-bold ${colorCls}`}>
            {arrow} {Math.abs(delta.delta)}
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

export function QuestionVersionCompareCard({
  sibling,
  comparison,
}: {
  sibling: QuestionWithVersion | null;
  comparison: QuestionVersionComparison | null;
}) {
  if (!sibling || !comparison) {
    return (
      <EmptyState
        title="No other versions yet"
        description="This question only exists in one content version so far — version comparison will appear once it's been cloned into a draft or published elsewhere."
      />
    );
  }

  return (
    <Card className="adm-fade-up p-5">
      <h2 className="mb-1 text-base font-bold text-adm-ink">Version History</h2>
      <p className="mb-4 text-[13px] text-adm-ink-muted">
        Comparing <strong>{comparison.oldVersionLabel}</strong> →{" "}
        <strong>{comparison.newVersionLabel}</strong> (current)
      </p>

      {comparison.wording.titleChanged && (
        <div className="mb-4 rounded-adm-md bg-adm-sand/60 p-3 text-[13px]">
          <p className="mb-1 font-semibold text-adm-ink">Wording changed</p>
          <p className="text-adm-ink-muted line-through">{comparison.wording.oldTitle.en}</p>
          <p className="text-adm-ink">{comparison.wording.newTitle.en}</p>
        </div>
      )}
      {comparison.wording.optionsChanged && (
        <p className="mb-4 text-[13px] font-semibold text-adm-gold-ink">
          Answer options also changed between these versions.
        </p>
      )}
      {!comparison.wording.titleChanged && !comparison.wording.optionsChanged && (
        <p className="mb-4 text-[13px] text-adm-ink-muted">
          Wording is identical between these two versions — only behavior is compared below.
        </p>
      )}

      <DeltaRow label="Completion rate" delta={comparison.completionRate} unit="%" />
      <DeltaRow
        label="Avg. time spent"
        delta={comparison.avgTime}
        unit="s"
        format={(v) => String(Math.round(v / 1000))}
      />
      <DeltaRow label="Drop-off rate" delta={comparison.dropOffRate} unit="%" />
      <DeltaRow label="Health score" delta={comparison.healthScore} unit="" />

      {comparison.answerDistributionShift.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
            Answer share shift
          </p>
          {comparison.answerDistributionShift.map((shift) => (
            <div
              key={shift.answer}
              className="flex items-center justify-between border-b border-adm-line py-1.5 text-[13px] last:border-b-0"
            >
              <span className="text-adm-ink-soft">{shift.answer}</span>
              <span className="text-adm-ink-muted">
                {shift.oldSharePct === null ? "—" : `${shift.oldSharePct}%`} →{" "}
                {shift.newSharePct === null ? "—" : `${shift.newSharePct}%`}
                {shift.deltaPct !== null && (
                  <span className="ml-2 font-semibold text-adm-ink">
                    ({shift.deltaPct > 0 ? "+" : ""}
                    {shift.deltaPct} pts)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
