import { Card } from "@/components/admin/ui/Card";
import { RadialScore } from "@/components/admin/analytics/charts/RadialScore";
import type { HealthScoreResult } from "@/lib/admin/analytics/question-health";

const STATUS_STYLES: Record<HealthScoreResult["status"], string> = {
  Healthy: "bg-adm-mint/25 text-adm-mint-ink",
  "Needs Review": "bg-adm-gold/25 text-adm-gold-ink",
  Critical: "bg-adm-error/15 text-adm-error-ink",
  "Insufficient Data": "bg-adm-sand text-adm-ink-muted border border-adm-line-strong",
};

const FACTOR_LABELS: Record<string, string> = {
  completion: "Completion",
  time: "Time (vs. baseline)",
  entropy: "Answer entropy",
  changeRate: "Change rate",
  abandonment: "Abandonment",
};

export function QuestionHealthCard({ health }: { health: HealthScoreResult }) {
  const factorEntries = Object.entries(health.factors) as Array<
    [keyof HealthScoreResult["factors"], number | null]
  >;

  return (
    <Card className="adm-fade-up p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-base font-bold text-adm-ink">Health Score</h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[health.status]}`}
        >
          {health.status}
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <RadialScore value={health.score} label="Health" />

        <div className="w-full flex-1 space-y-2">
          {health.status === "Insufficient Data" ? (
            <p className="text-sm text-adm-ink-muted">
              Fewer than 5 views recorded — not enough traffic yet to compute a
              reliable score.
            </p>
          ) : (
            factorEntries.map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs font-semibold text-adm-ink-muted">
                  {FACTOR_LABELS[key] ?? key}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-adm-sand">
                  {value !== null && (
                    <div
                      className="h-full rounded-full bg-adm-violet"
                      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    />
                  )}
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-bold text-adm-ink">
                  {value === null ? "—" : `${Math.round(value)}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
