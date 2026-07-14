import { Card } from "@/components/admin/ui/Card";
import type { Insight } from "@/lib/admin/analytics/types";

const SEVERITY_DOT: Record<Insight["severity"], string> = {
  positive: "bg-adm-mint-ink",
  warning: "bg-adm-gold-ink",
  info: "bg-adm-violet",
};

export function InsightsFeed({ insights }: { insights: Insight[] }) {
  return (
    <Card className="adm-fade-up p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-base font-bold text-adm-ink">AI Insights</h2>
        <p className="text-xs text-adm-ink-muted">
          Deterministic for now — model-generated later
        </p>
      </div>
      {insights.length === 0 ? (
        <p className="py-6 text-center text-sm text-adm-ink-muted">
          Not enough historical data yet to surface insights. Check back as
          more assessments come in.
        </p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="flex items-start gap-3 rounded-adm-md bg-adm-sand/60 p-3"
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[insight.severity]}`}
              />
              <p className="text-[13px] text-adm-ink-soft">{insight.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
