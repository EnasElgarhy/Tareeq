import { NextResponse } from "next/server";
import {
  buildAnonymizedRowsCsv,
  buildFlaggedRowsCsv,
  buildSummaryCsv,
} from "@/lib/admin/analytics/csv";
import {
  parseFiltersFromSearchParams,
  parseRangeFromSearchParams,
} from "@/lib/admin/analytics/filters";
import { getAnalyticsViewModel } from "@/lib/admin/analytics/queries";
import { requireAdmin } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

const EXPORT_TYPES = ["summary", "rows", "flagged"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];
const FILTER_KEYS = [
  "from",
  "to",
  "country",
  "ageBand",
  "gender",
  "catalog",
  "flagged",
  "completedOnly",
  "researchOnly",
  "range",
] as const;

/**
 * CSV export for the admin Analytics surface — server-side only, admin-gated.
 * `?type=summary|rows|flagged` selects which of the three exports to build;
 * the rest of the query string is the same filter set the page itself reads.
 */
export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type");
  const type = EXPORT_TYPES.includes(typeParam as ExportType)
    ? (typeParam as ExportType)
    : null;
  if (!type) {
    return NextResponse.json(
      { error: "Invalid or missing export type." },
      { status: 400 },
    );
  }

  const searchParams: Record<string, string | undefined> = {};
  for (const key of FILTER_KEYS) {
    searchParams[key] = url.searchParams.get(key) ?? undefined;
  }
  const filters = parseFiltersFromSearchParams(searchParams);
  const range = parseRangeFromSearchParams(searchParams);

  try {
    const vm = await getAnalyticsViewModel(filters, range);

    const exporters: Record<ExportType, { csv: string; filename: string }> = {
      summary: {
        csv: buildSummaryCsv(vm),
        filename: "tareeq-analytics-summary.csv",
      },
      rows: {
        csv: buildAnonymizedRowsCsv(vm.rows),
        filename: "tareeq-analytics-assessments.csv",
      },
      flagged: {
        csv: buildFlaggedRowsCsv(vm.flaggedRows),
        filename: "tareeq-analytics-flagged.csv",
      },
    };
    const { csv, filename } = exporters[type];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
