import { Sparkline } from "@/components/admin/analytics/charts/Sparkline";
import { Card } from "@/components/admin/ui/Card";
import type { PeriodComparison } from "@/lib/admin/analytics/types";

function TrendChip({
  comparison,
  positiveIsGood,
  unit,
}: {
  comparison: PeriodComparison;
  positiveIsGood: boolean;
  unit: string;
}) {
  if (comparison.direction === "new") {
    return (
      <span className="inline-flex items-center rounded-full bg-adm-violet/10 px-2 py-0.5 text-xs font-bold text-adm-deep">
        New
      </span>
    );
  }
  if (comparison.direction === "none" || comparison.deltaPct === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-adm-sand px-2 py-0.5 text-xs font-bold text-adm-ink-faint">
        No data yet
      </span>
    );
  }

  const isFlat = comparison.direction === "flat";
  const isUp = comparison.direction === "up";
  const isGood = isFlat ? null : isUp === positiveIsGood;
  const colorCls = isFlat
    ? "bg-adm-sand text-adm-ink-muted"
    : isGood
      ? "bg-adm-mint/20 text-adm-mint-ink"
      : "bg-adm-error/15 text-adm-error-ink";
  const arrow = isFlat ? "→" : isUp ? "↑" : "↓";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${colorCls}`}
    >
      {arrow} {Math.abs(comparison.deltaPct)}
      {unit}
    </span>
  );
}

export function KpiHero({
  label,
  value,
  displaySuffix = "",
  comparison,
  comparisonUnit = "%",
  positiveIsGood = true,
  sparklinePoints,
  periodLabel = "vs previous period",
  note,
}: {
  label: string;
  value: string;
  displaySuffix?: string;
  comparison?: PeriodComparison;
  comparisonUnit?: string;
  positiveIsGood?: boolean;
  sparklinePoints?: number[];
  periodLabel?: string;
  note?: string;
}) {
  const hasSpark = sparklinePoints && sparklinePoints.some((v) => v > 0);

  return (
    <Card className="adm-fade-up adm-lift p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="adm-display text-[2.5rem] leading-none">
          {value}
          <span className="text-2xl">{displaySuffix}</span>
        </p>
        {hasSpark && (
          <Sparkline points={sparklinePoints!} width={88} height={36} />
        )}
      </div>
      {comparison && (
        <div className="mt-3 flex items-center gap-2">
          <TrendChip
            comparison={comparison}
            positiveIsGood={positiveIsGood}
            unit={comparisonUnit}
          />
          <span className="text-xs text-adm-ink-muted">{periodLabel}</span>
        </div>
      )}
      {note && <p className="mt-2 text-xs text-adm-ink-faint">{note}</p>}
    </Card>
  );
}

export function KpiHeroSkeleton() {
  return (
    <Card className="p-6">
      <div className="adm-skeleton h-3 w-28" />
      <div className="adm-skeleton mt-4 h-10 w-24" />
      <div className="adm-skeleton mt-4 h-5 w-20" />
    </Card>
  );
}
