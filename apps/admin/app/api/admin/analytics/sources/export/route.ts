import { NextResponse } from "next/server";
import { parseSourceReportParams } from "@/lib/admin/analytics/by-source";
import { buildSourceReportCsv } from "@/lib/admin/analytics/by-source-csv";
import { getSourceReport } from "@/lib/admin/analytics/by-source-queries";
import { requireAdmin } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

/** CSV of the weekly By source report, for the week and options on the page. */
export async function GET(request: Request) {
  await requireAdmin();

  const params = parseSourceReportParams(Object.fromEntries(new URL(request.url).searchParams));
  try {
    const { report } = await getSourceReport(params);
    return new NextResponse(buildSourceReportCsv(report, params), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mapmycore-by-source-week-${params.weekStart}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error("[analytics/sources/export] failed", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
