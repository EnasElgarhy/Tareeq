import { Card } from "@/components/admin/ui/Card";
import type { FunnelStage } from "@/lib/admin/analytics/types";

interface Drop {
  fromKey: string;
  toKey: string;
  dropPct: number;
}

function labelFor(key: string, funnel: FunnelStage[]): string {
  return funnel.find((s) => s.key === key)?.label ?? key;
}

export function FunnelVisual({ funnel }: { funnel: FunnelStage[] }) {
  const base = funnel[0]?.count ?? 0;

  const drops: Drop[] = funnel.slice(1).map((stage, i) => {
    const prev = funnel[i].count;
    const dropPct = prev > 0 ? Math.round(((prev - stage.count) / prev) * 100) : 0;
    return { fromKey: funnel[i].key, toKey: stage.key, dropPct };
  });
  const biggestLeak = drops.reduce<Drop | null>(
    (worst, d) => (!worst || d.dropPct > worst.dropPct ? d : worst),
    null,
  );

  return (
    <Card className="adm-fade-up p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-adm-ink">Assessment Funnel</h2>
        {biggestLeak && biggestLeak.dropPct > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-adm-error/15 px-2.5 py-1 text-xs font-bold text-adm-error-ink">
            ⚠ Biggest leak: {labelFor(biggestLeak.fromKey, funnel)} →{" "}
            {labelFor(biggestLeak.toKey, funnel)} (-{biggestLeak.dropPct}%)
          </span>
        )}
      </div>
      <ul className="space-y-4">
        {funnel.map((stage, i) => {
          const widthPct =
            base > 0 ? Math.max(4, Math.round((stage.count / base) * 100)) : 0;
          const drop = i > 0 ? drops[i - 1] : null;
          const isLeak =
            drop && biggestLeak && drop.toKey === biggestLeak.toKey && drop.dropPct > 0;
          return (
            <li key={stage.key}>
              {drop && (
                <p
                  className={`mb-1.5 text-[11px] font-bold ${
                    isLeak ? "text-adm-error-ink" : "text-adm-ink-faint"
                  }`}
                >
                  ↓ {drop.dropPct}% drop-off
                </p>
              )}
              <div className="mb-1 flex items-baseline justify-between text-[13px]">
                <span className="font-semibold text-adm-ink-soft">
                  {stage.label}
                </span>
                <span className="font-bold text-adm-ink">
                  {stage.count.toLocaleString()}
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-adm-sand">
                <div
                  className={`h-full rounded-full ${isLeak ? "bg-adm-error" : "bg-adm-violet"}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-adm-ink-muted">
        “Viewed results” and “downloaded/shared” read from an events table
        that isn&apos;t populated yet — they show 0 until the consumer app
        emits those events.
      </p>
    </Card>
  );
}
