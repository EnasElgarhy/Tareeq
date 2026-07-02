import { KpiHero } from "@/components/admin/analytics/KpiHero";
import type { AnalyticsViewModel } from "@/lib/admin/analytics/types";

export function ExecutiveOverview({ vm }: { vm: AnalyticsViewModel }) {
  const { overview, comparisons, qualityScorePct, heroSparklines } = vm;

  return (
    <section
      aria-label="Executive overview"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <KpiHero
        label="Total Assessments"
        value={overview.totalCompleted.toLocaleString()}
        comparison={comparisons.totalCompleted}
        comparisonUnit="%"
        sparklinePoints={heroSparklines.totalCompleted}
      />
      <KpiHero
        label="Completion Rate"
        value={overview.completionRatePct !== null ? String(overview.completionRatePct) : "—"}
        displaySuffix="%"
        comparison={comparisons.completionRatePct}
        comparisonUnit=" pts"
        sparklinePoints={heroSparklines.completionRatePct}
      />
      <KpiHero
        label="Avg. Completion Time"
        value={
          overview.avgCompletionSeconds !== null
            ? String(Math.round(overview.avgCompletionSeconds / 60))
            : "—"
        }
        displaySuffix=" min"
        comparison={comparisons.avgCompletionSeconds}
        comparisonUnit="%"
        positiveIsGood={false}
        sparklinePoints={heroSparklines.avgCompletionSeconds}
      />
      <KpiHero
        label="Research Consent"
        value={
          overview.researchConsentRatePct !== null
            ? String(overview.researchConsentRatePct)
            : "—"
        }
        displaySuffix="%"
        comparison={comparisons.researchConsentRatePct}
        comparisonUnit=" pts"
        sparklinePoints={heroSparklines.researchConsentRatePct}
        note={overview.consentCollectedCount === 0 ? "Not collected yet" : undefined}
      />
      <KpiHero
        label="Data Quality Score"
        value={qualityScorePct !== null ? String(Math.round(qualityScorePct)) : "—"}
        displaySuffix="%"
        comparison={comparisons.qualityScorePct}
        comparisonUnit=" pts"
        sparklinePoints={heroSparklines.qualityScorePct}
      />
    </section>
  );
}
