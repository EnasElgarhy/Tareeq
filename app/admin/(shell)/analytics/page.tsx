import { AlertsPanel } from "@/components/admin/analytics/AlertsPanel";
import { ExecutiveOverview } from "@/components/admin/analytics/ExecutiveOverview";
import { FilterToolbar } from "@/components/admin/analytics/FilterToolbar";
import { GrowthSection } from "@/components/admin/analytics/GrowthSection";
import { InsightsFeed } from "@/components/admin/analytics/InsightsFeed";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import {
  buildFilterQueryString,
  loadAnalyticsPage,
  type AnalyticsSearchParams,
} from "@/lib/admin/analytics/page-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsOverviewPage({
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
        action="/admin/analytics"
      />

      {vm.truncated && (
        <p className="text-xs font-semibold text-adm-gold-ink">
          Showing the {vm.rows.length.toLocaleString()} most recent
          assessments — narrow the date range for a complete picture of an
          earlier period.
        </p>
      )}

      {vm.totalRowsMatched === 0 ? (
        <EmptyState
          title="No assessments match these filters"
          description="Try widening the date range or clearing a filter. If this is a fresh environment, run scripts/seed_sample_responses.mts to preview this view with sample data."
        />
      ) : (
        <div className="space-y-6">
          <ExecutiveOverview vm={vm} />
          <GrowthSection
            series={vm.growth}
            range={vm.range}
            baseQueryWithoutRange={buildFilterQueryString(vm.filters)}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InsightsFeed insights={vm.insights} />
            <AlertsPanel alerts={vm.alerts} />
          </div>
        </div>
      )}
    </>
  );
}
