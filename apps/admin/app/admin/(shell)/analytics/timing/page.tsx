import { TimingTable } from "@/components/admin/analytics/TimingTable";
import { TimingToolbar } from "@/components/admin/analytics/TimingToolbar";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import type { AnalyticsSearchParams } from "@/lib/admin/analytics/page-data";
import { applyTimingListParams, parseTimingListParams } from "@/lib/admin/analytics/timing";
import { getTimingData, parseTimingRange } from "@/lib/admin/analytics/timing-queries";

export const dynamic = "force-dynamic";

export default async function AnalyticsTimingPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const resolved = await searchParams;
  const range = parseTimingRange(resolved);
  const params = parseTimingListParams(resolved);
  const data = await getTimingData(range);
  const attempts = applyTimingListParams(data.attempts, params);
  const flaggedCount = data.attempts.filter((a) => a.flagged).length;

  const baseQuery = new URLSearchParams({ from: range.from, to: range.to, fast: params.fast });
  const exportQuery = new URLSearchParams(baseQuery);
  exportQuery.set("sort", params.sort);
  exportQuery.set("dir", params.dir);

  return (
    <>
      <TimingToolbar
        range={range}
        params={params}
        exportHref={`/api/admin/analytics/timing/export?${exportQuery.toString()}`}
      />

      <Card tone="tinted" className="p-4 text-[13px] leading-relaxed text-adm-ink-soft">
        <strong className="text-adm-ink">{data.attempts.length}</strong> CORE attempts timed,{" "}
        <strong className="text-adm-error-ink">{flaggedCount}</strong> flagged as fast. A part is
        flagged when its median time is under 2 s or 90% of its answers sit in one screen
        position; the attempt is flagged when any part is (spec §5). Times come from the
        browser&apos;s question events, which are not linked to a student account yet, so those
        attempts show as anonymous.
        {!data.hasResponsesTable && " The core_responses table is not in this database yet."}
        {data.truncated && " Only the first 50,000 events were read: narrow the dates."}
      </Card>

      {attempts.length === 0 ? (
        <EmptyState
          title="No timed attempts"
          description={
            params.fast === "only"
              ? "Nobody in this range was flagged as fast."
              : "No CORE question timings were recorded in this range."
          }
        />
      ) : (
        <TimingTable attempts={attempts} params={params} baseQuery={baseQuery.toString()} />
      )}
    </>
  );
}
