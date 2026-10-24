import { NextResponse } from "next/server";
import { applyTimingListParams, parseTimingListParams } from "@/lib/admin/analytics/timing";
import { buildTimingCsv } from "@/lib/admin/analytics/timing-csv";
import { getTimingData, parseTimingRange } from "@/lib/admin/analytics/timing-queries";
import { requireAdmin } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

/** CSV of the Timing tab, with the same dates, filter and sort as the page. */
export async function GET(request: Request) {
  await requireAdmin();

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const range = parseTimingRange(searchParams);
  try {
    const data = await getTimingData(range);
    const attempts = applyTimingListParams(data.attempts, parseTimingListParams(searchParams));
    return new NextResponse(buildTimingCsv(attempts), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mapmycore-question-timing-${range.from}-to-${range.to}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("[analytics/timing/export] failed", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
