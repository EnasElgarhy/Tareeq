import { Suspense } from "react";
import {
  CoverageSection,
  CoverageSkeleton,
  HealthSection,
  HealthSkeleton,
  StatsSection,
  StatsSkeleton,
} from "@/components/admin/dashboard/DashboardParts";
import PageHeader from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const dynamic = "force-dynamic";

/**
 * Streaming dashboard: the shell + header paint immediately, then each section
 * resolves independently behind its own Suspense boundary (skeleton → content),
 * so the page never blocks on the slowest query.
 */
export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        kicker="Admin · Overview"
        title="The compass, at a glance."
        description="Assessment activity and content health. Result analytics fill in once the live app starts recording assessments."
      />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Suspense fallback={<CoverageSkeleton />}>
          <CoverageSection />
        </Suspense>
        <Suspense fallback={<HealthSkeleton />}>
          <HealthSection />
        </Suspense>
      </div>

      <section aria-label="Recent activity" className="mt-6">
        <h2 className="mb-3 text-base font-bold text-adm-ink">Recent activity</h2>
        <EmptyState
          title="Nothing logged yet"
          description="An editor activity feed and result analytics arrive once assessment persistence + events are wired up."
        />
      </section>
    </>
  );
}
