import Link from "next/link";
import { SourceReportTable } from "@/components/admin/analytics/SourceReportTable";
import { SourceReportToolbar } from "@/components/admin/analytics/SourceReportToolbar";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import {
  NO_SOURCE,
  parseSourceReportParams,
  recentWeeks,
  shiftWeek,
  weekStartFor,
  type SourceReportParams,
} from "@/lib/admin/analytics/by-source";
import { getSourceReport } from "@/lib/admin/analytics/by-source-queries";
import type { AnalyticsSearchParams } from "@/lib/admin/analytics/page-data";

export const dynamic = "force-dynamic";

const PICKER_WEEKS = 12;

function query(params: SourceReportParams, weekStart = params.weekStart): string {
  return new URLSearchParams({
    week: weekStart,
    touch: params.touch,
    groupBy: params.groupBy,
  }).toString();
}

const stepLink =
  "inline-flex h-8 items-center rounded-adm-md border border-adm-line-strong px-3 text-[13px] font-semibold text-adm-ink-soft hover:border-adm-violet hover:text-adm-violet";

export default async function AnalyticsSourcesPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const now = new Date();
  const params = parseSourceReportParams(await searchParams, now);
  const { report, truncated } = await getSourceReport(params);
  const isCurrentWeek = params.weekStart === weekStartFor(now);

  return (
    <>
      <SourceReportToolbar
        params={params}
        weeks={recentWeeks(now, PICKER_WEEKS)}
        exportHref={`/api/admin/analytics/sources/export?${query(params)}`}
      />

      <div className="flex items-center gap-2">
        <Link href={`?${query(params, shiftWeek(params.weekStart, -1))}`} className={stepLink}>
          ← Previous week
        </Link>
        {!isCurrentWeek && (
          <Link href={`?${query(params, shiftWeek(params.weekStart, 1))}`} className={stepLink}>
            Next week →
          </Link>
        )}
      </div>

      <Card tone="tinted" className="p-4 text-[13px] leading-relaxed text-adm-ink-soft">
        Counts are events in the week, credited to the {params.touch === "first" ? "first" : "latest"}{" "}
        source and post on the visitor&apos;s attribution cookie. Visits are session starts; report
        and Kai opens count every opening. &ldquo;{NO_SOURCE}&rdquo; covers events with no source,
        including everything before tracking began on 22 Oct 2026. Ask-a-parent links are not
        tracked yet, so that column stays empty.
        {isCurrentWeek && " This week is still in progress."}
        {truncated && " Only the first 50,000 events were read."}
      </Card>

      {report.rows.length === 0 ? (
        <EmptyState title="Nothing recorded this week" description="Pick an earlier week." />
      ) : (
        <SourceReportTable report={report} showPost={params.groupBy === "post"} />
      )}
    </>
  );
}
