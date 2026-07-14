import type { ReactNode } from "react";
import type { BreakdownEntry } from "@/lib/admin/analytics/types";

export function BreakdownBars({
  title,
  icon,
  entries,
  emptyLabel = "No data yet.",
  limit = 8,
  colorFor,
}: {
  title: string;
  icon?: ReactNode;
  entries: BreakdownEntry[];
  emptyLabel?: string;
  limit?: number;
  /** Per-entry bar color; defaults to the brand violet for every bar. */
  colorFor?: (entry: BreakdownEntry, index: number) => string;
}) {
  const shown = entries.slice(0, limit);
  const max = shown.length > 0 ? Math.max(...shown.map((e) => e.count)) : 0;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-adm-ink">
        {icon}
        {title}
      </h3>
      {shown.length === 0 ? (
        <p className="text-sm text-adm-ink-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((e, i) => {
            const color = colorFor?.(e, i) ?? "var(--adm-violet)";
            return (
              <li key={e.key} className="text-[13px]">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate font-semibold text-adm-ink-soft">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {e.label}
                  </span>
                  <span className="shrink-0 text-adm-ink-muted">
                    {e.count.toLocaleString()} · {e.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-adm-sand">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: max > 0 ? `${(e.count / max) * 100}%` : "0%",
                      backgroundColor: color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
