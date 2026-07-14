import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { KpiHero } from "@/components/admin/analytics/KpiHero";
import { InsightsFeed } from "@/components/admin/analytics/InsightsFeed";
import { QuestionHealthCard } from "@/components/admin/analytics/QuestionHealthCard";
import { AnswerDistributionCard } from "@/components/admin/analytics/AnswerDistributionCard";
import { QuestionCorrelationCard } from "@/components/admin/analytics/QuestionCorrelationCard";
import { QuestionVersionCompareCard } from "@/components/admin/analytics/QuestionVersionCompareCard";
import { QuestionTimelineCard } from "@/components/admin/analytics/QuestionTimelineCard";
import { PILLAR_NAMES, questionTypeLabel } from "@/lib/admin/content";
import { getQuestionAnalyticsViewModel } from "@/lib/admin/analytics/question-view-model";

export const dynamic = "force-dynamic";

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  return `${Math.round(ms / 1000)}s`;
}

export default async function QuestionAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vm = await getQuestionAnalyticsViewModel(id);
  if (!vm) notFound();

  const { question, label, metrics, health, insights, correlation, recentEvents } = vm;
  const optionLabels = Object.fromEntries(
    question.options.map((o) => [o.letter, o.text.en || o.letter]),
  );

  return (
    <>
      <PageHeader
        kicker={`Admin · Questions · ${question.version_label ?? "unlabeled version"}`}
        title={
          <>
            {label} <span className="text-adm-ink-faint">· {question.external_id}</span>
          </>
        }
        description={question.title.en || "(untitled question)"}
        actions={
          <span className="rounded-full bg-adm-sand px-3 py-1 text-xs font-bold text-adm-ink-muted">
            {questionTypeLabel(question.kind)} · {PILLAR_NAMES[question.pillar] ?? `Pillar ${question.pillar}`}
          </span>
        }
      />

      <div className="space-y-6">
        <section
          aria-label="Overview"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiHero label="Views" value={metrics.views.toLocaleString()} />
          <KpiHero
            label="Completion Rate"
            value={metrics.completionRatePct === null ? "—" : String(metrics.completionRatePct)}
            displaySuffix={metrics.completionRatePct !== null ? "%" : ""}
          />
          <KpiHero
            label="Drop-off Rate"
            value={metrics.dropOffRatePct === null ? "—" : String(metrics.dropOffRatePct)}
            displaySuffix={metrics.dropOffRatePct !== null ? "%" : ""}
          />
          <KpiHero label="Avg. Time" value={formatMs(metrics.time.avgMs)} />
        </section>

        <QuestionHealthCard health={health} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnswerDistributionCard
            distribution={metrics.answerDistribution}
            optionLabels={optionLabels}
          />

          <Card className="adm-fade-up p-5">
            <h2 className="mb-4 text-base font-bold text-adm-ink">Time Distribution</h2>
            {metrics.time.sampleCount === 0 ? (
              <p className="py-6 text-center text-sm text-adm-ink-muted">
                No time-spent data recorded yet.
              </p>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <dt className="text-adm-ink-muted">Average</dt>
                  <dd className="adm-display text-xl">{formatMs(metrics.time.avgMs)}</dd>
                </div>
                <div>
                  <dt className="text-adm-ink-muted">Median</dt>
                  <dd className="adm-display text-xl">{formatMs(metrics.time.medianMs)}</dd>
                </div>
                <div>
                  <dt className="text-adm-ink-muted">Fastest</dt>
                  <dd className="adm-display text-xl">{formatMs(metrics.time.fastestMs)}</dd>
                </div>
                <div>
                  <dt className="text-adm-ink-muted">Slowest</dt>
                  <dd className="adm-display text-xl">{formatMs(metrics.time.slowestMs)}</dd>
                </div>
              </dl>
            )}
            <p className="mt-4 border-t border-adm-line pt-3 text-xs text-adm-ink-muted">
              Based on {metrics.time.sampleCount} sample
              {metrics.time.sampleCount === 1 ? "" : "s"}. Revisits and
              answer-changes are additional interaction signals — see Behavior
              below.
            </p>
          </Card>
        </div>

        <Card className="adm-fade-up p-5">
          <h2 className="mb-4 text-base font-bold text-adm-ink">Behavior</h2>
          <dl className="grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-4">
            <div>
              <dt className="text-adm-ink-muted">Answers</dt>
              <dd className="adm-display text-xl">{metrics.answers}</dd>
            </div>
            <div>
              <dt className="text-adm-ink-muted">Answer change rate</dt>
              <dd className="adm-display text-xl">{metrics.answerChangeRatePct ?? "—"}%</dd>
            </div>
            <div>
              <dt className="text-adm-ink-muted">Revisit rate</dt>
              <dd className="adm-display text-xl">{metrics.revisitRatePct ?? "—"}%</dd>
            </div>
            <div>
              <dt className="text-adm-ink-muted">Abandonment rate</dt>
              <dd className="adm-display text-xl">{metrics.abandonmentRatePct ?? "—"}%</dd>
            </div>
          </dl>
          {metrics.skipRatePct === 0 && metrics.skips === 0 && (
            <p className="mt-3 text-xs text-adm-ink-faint">
              Skip rate: 0% — this consumer app has no skip affordance today
              (see QUESTION_ANALYTICS_ARCHITECTURE.md).
            </p>
          )}
        </Card>

        <InsightsFeed insights={insights} />

        <QuestionCorrelationCard label={label} correlation={correlation} />

        <div id="version-history" className="scroll-mt-6">
          <QuestionVersionCompareCard
            sibling={vm.comparisonToSibling?.sibling ?? null}
            comparison={vm.comparisonToSibling?.result ?? null}
          />
        </div>

        <QuestionTimelineCard events={recentEvents} />
      </div>
    </>
  );
}
