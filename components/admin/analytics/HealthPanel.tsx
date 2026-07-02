import { RadialScore } from "@/components/admin/analytics/charts/RadialScore";
import { Card } from "@/components/admin/ui/Card";
import type { DataQualityMetrics } from "@/lib/admin/analytics/types";

export function HealthPanel({
  quality,
  qualityScorePct,
}: {
  quality: DataQualityMetrics;
  qualityScorePct: number | null;
}) {
  const warnings = [
    { count: quality.missingAnswersCount, label: "missing answers" },
    { count: quality.rushedCount, label: "rushed assessments (< 4 min)" },
    { count: quality.veryLongCount, label: "very long assessments (> 30 min)" },
    { count: quality.allSameAnswerCount, label: "all-same-answer patterns" },
  ].filter((w) => w.count > 0);

  return (
    <Card className="adm-fade-up p-6">
      <h2 className="mb-5 text-base font-bold text-adm-ink">Platform Health</h2>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <RadialScore
          value={qualityScorePct}
          label="Overall quality"
          size={140}
          strokeWidth={12}
        />
        <div className="flex-1">
          {warnings.length === 0 ? (
            <p className="text-sm text-adm-ink-muted">
              No data quality warnings — {quality.cleanCount.toLocaleString()}{" "}
              of {quality.totalCount.toLocaleString()} records are clean.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
                Warnings
              </p>
              <ul className="space-y-1.5">
                {warnings.map((w) => (
                  <li
                    key={w.label}
                    className="flex items-center gap-2 text-[13px] text-adm-ink-soft"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-adm-gold-ink"
                    />
                    {w.count.toLocaleString()} {w.label}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-xs text-adm-ink-muted">
            {quality.cleanCount.toLocaleString()} of{" "}
            {quality.totalCount.toLocaleString()} records clean ·{" "}
            {quality.suspiciousCount.toLocaleString()} flagged for review
          </p>
        </div>
      </div>
    </Card>
  );
}
