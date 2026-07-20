import { ExportPanel } from "@/components/admin/analytics/ExportPanel";
import { FilterToolbar } from "@/components/admin/analytics/FilterToolbar";
import { buildQueryString, loadAnalyticsPage, type AnalyticsSearchParams } from "@/lib/admin/analytics/page-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsExportsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const vm = await loadAnalyticsPage(searchParams);
  const assessmentLabel = vm.filters.catalogId
    ? (vm.catalogOptions.find((o) => o.id === vm.filters.catalogId)?.label ??
      "Selected assessment")
    : "All assessments";

  return (
    <>
      <FilterToolbar
        filters={vm.filters}
        countryOptions={vm.countryOptions}
        genderOptions={vm.genderOptions}
        catalogOptions={vm.catalogOptions}
        action="/admin/analytics/exports"
      />
      <ExportPanel
        queryString={buildQueryString(vm)}
        saltConfigured={Boolean(process.env.ANALYTICS_HASH_SALT)}
        dateFrom={vm.filters.from}
        dateTo={vm.filters.to}
        assessmentLabel={assessmentLabel}
        recordCount={vm.overview.totalCompleted}
      />
    </>
  );
}
