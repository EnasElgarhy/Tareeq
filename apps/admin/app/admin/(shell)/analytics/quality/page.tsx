import { FilterToolbar } from "@/components/admin/analytics/FilterToolbar";
import { HealthPanel } from "@/components/admin/analytics/HealthPanel";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { loadAnalyticsPage, type AnalyticsSearchParams } from "@/lib/admin/analytics/page-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsQualityPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const vm = await loadAnalyticsPage(searchParams);

  return (
    <>
      <FilterToolbar
        filters={vm.filters}
        countryOptions={vm.countryOptions}
        genderOptions={vm.genderOptions}
        catalogOptions={vm.catalogOptions}
        action="/admin/analytics/quality"
      />

      {vm.totalRowsMatched === 0 ? (
        <EmptyState
          title="No assessments match these filters"
          description="Try widening the date range or clearing a filter."
        />
      ) : (
        <HealthPanel quality={vm.dataQuality} qualityScorePct={vm.qualityScorePct} />
      )}
    </>
  );
}
