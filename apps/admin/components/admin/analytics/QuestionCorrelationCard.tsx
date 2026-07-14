import { Card } from "@/components/admin/ui/Card";
import { Table, Th, Tr } from "@/components/admin/ui/Table";
import {
  describeCorrelation,
  type QuestionOutcomeCorrelation,
} from "@/lib/admin/analytics/question-correlation";

export function QuestionCorrelationCard({
  label,
  correlation,
}: {
  label: string;
  correlation: QuestionOutcomeCorrelation;
}) {
  return (
    <Card className="adm-fade-up p-5">
      <h2 className="mb-1 text-base font-bold text-adm-ink">
        Correlation to Final Profile
      </h2>
      <p className="mb-4 text-[13px] text-adm-ink-muted">
        {describeCorrelation(label, correlation)}
      </p>

      {correlation.perAnswer.length === 0 ? (
        <p className="py-4 text-center text-sm text-adm-ink-muted">
          {correlation.sampleSize === 0
            ? "No completed assessments with a scored result answered this question yet."
            : `Only ${correlation.sampleSize} completed responses so far — need at least 10 to measure correlation.`}
        </p>
      ) : (
        <Table>
          <thead>
            <Tr>
              <Th>Answer</Th>
              <Th>Sample</Th>
              <Th>Dominant outcome</Th>
              <Th>Share</Th>
              <Th>Lift vs. baseline</Th>
            </Tr>
          </thead>
          <tbody>
            {correlation.perAnswer.map((row) => (
              <Tr key={row.answer}>
                <td className="px-4 py-2.5 font-semibold text-adm-ink">{row.answer}</td>
                <td className="px-4 py-2.5 text-adm-ink-soft">{row.sampleSize}</td>
                <td className="px-4 py-2.5 text-adm-ink-soft">{row.dominantOutcome ?? "—"}</td>
                <td className="px-4 py-2.5 text-adm-ink-soft">
                  {row.dominantSharePct === null ? "—" : `${row.dominantSharePct}%`}
                </td>
                <td className="px-4 py-2.5 text-adm-ink-soft">
                  {row.liftVsBaseline === null ? "—" : `${row.liftVsBaseline}x`}
                  {row.sampleSize < 5 && (
                    <span className="ml-1.5 text-[11px] text-adm-ink-faint">
                      (small sample)
                    </span>
                  )}
                </td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
