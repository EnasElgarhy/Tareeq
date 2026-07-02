import { Card } from "@/components/admin/ui/Card";

export function AnswerDistributionCard({
  distribution,
  optionLabels,
}: {
  distribution: Record<string, number>;
  /** letter -> option text, so the bar labels read as words, not just letters. */
  optionLabels: Record<string, string>;
}) {
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="adm-fade-up p-5">
      <h2 className="mb-4 text-base font-bold text-adm-ink">Answer Distribution</h2>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-adm-ink-muted">
          No answers recorded yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map(([answer, count]) => {
            const sharePct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
            return (
              <li key={answer}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-adm-ink">
                    {answer}
                    {optionLabels[answer] ? ` · ${optionLabels[answer]}` : ""}
                  </span>
                  <span className="text-adm-ink-muted">
                    {count} ({sharePct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-adm-sand">
                  <div
                    className="h-full rounded-full bg-adm-violet-soft"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
