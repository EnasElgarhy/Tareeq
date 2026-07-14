import { FilterToolbar } from "@/components/admin/analytics/FilterToolbar";
import { ResultsDistributionSection } from "@/components/admin/analytics/ResultsDistributionSection";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { loadAnalyticsPage, type AnalyticsSearchParams } from "@/lib/admin/analytics/page-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsResearchPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const vm = await loadAnalyticsPage(searchParams);
  const { researchConsentRatePct, consentCollectedCount } = vm.overview;

  return (
    <>
      <FilterToolbar
        filters={vm.filters}
        countryOptions={vm.countryOptions}
        genderOptions={vm.genderOptions}
        catalogOptions={vm.catalogOptions}
        action="/admin/analytics/research"
      />

      {vm.totalRowsMatched === 0 ? (
        <EmptyState
          title="No assessments match these filters"
          description="Try widening the date range or clearing a filter."
        />
      ) : (
        <div className="space-y-4">
          <Card className="adm-fade-up flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="text-base font-bold text-adm-ink">
                Research consent
              </h2>
              <p className="mt-1 text-xs text-adm-ink-muted">
                {consentCollectedCount === 0
                  ? "No consent step exists in the live flow yet — every row reads as not asked."
                  : `${consentCollectedCount.toLocaleString()} respondents have been asked.`}
              </p>
            </div>
            <p className="adm-display text-3xl">
              {researchConsentRatePct !== null ? `${researchConsentRatePct}%` : "—"}
            </p>
          </Card>
          <ResultsDistributionSection
            distribution={vm.resultsDistribution}
            totalRows={vm.totalRowsMatched}
          />
        </div>
      )}
    </>
  );
}
