import { TrendChart } from "@/components/admin/analytics/charts/TrendChart";
import { Card } from "@/components/admin/ui/Card";
import { RANGE_LABELS } from "@/lib/admin/analytics/trends";
import type { TimeRange, TrendSeries } from "@/lib/admin/analytics/types";

const RANGES: TimeRange[] = ["7d", "30d", "90d", "12m"];

const SERIES_COLOR: Record<string, string> = {
  assessments: "var(--adm-violet)",
  users: "var(--adm-mint)",
  completion_rate: "var(--adm-gold)",
  retakes: "var(--adm-blush)",
};

const SERIES_SUFFIX: Record<string, string> = {
  completion_rate: "%",
};

function RangeToggle({
  active,
  baseQuery,
}: {
  active: TimeRange;
  baseQuery: string;
}) {
  return (
    <div className="inline-flex rounded-adm-md border border-adm-line-strong p-1">
      {RANGES.map((r) => {
        const isActive = r === active;
        const qs = baseQuery ? `${baseQuery}&range=${r}` : `range=${r}`;
        return (
          <a
            key={r}
            href={`?${qs}`}
            aria-current={isActive ? "true" : undefined}
            className={`rounded-adm-sm px-3 py-1 text-xs font-bold transition-colors duration-adm-fast ${
              isActive
                ? "bg-adm-violet text-white"
                : "text-adm-ink-muted hover:text-adm-violet"
            }`}
          >
            {r}
          </a>
        );
      })}
    </div>
  );
}

export function GrowthSection({
  series,
  range,
  baseQueryWithoutRange,
}: {
  series: TrendSeries[];
  range: TimeRange;
  baseQueryWithoutRange: string;
}) {
  return (
    <section aria-label="Growth" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-adm-ink">Growth</h2>
          <p className="text-xs text-adm-ink-muted">Last {RANGE_LABELS[range]}</p>
        </div>
        <RangeToggle active={range} baseQuery={baseQueryWithoutRange} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {series.map((s, i) => (
          <Card
            key={s.key}
            className="adm-fade-up p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <h3 className="mb-3 text-sm font-bold text-adm-ink">{s.label}</h3>
            <TrendChart
              points={s.points}
              color={SERIES_COLOR[s.key] ?? "var(--adm-violet)"}
              valueSuffix={SERIES_SUFFIX[s.key] ?? ""}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}
