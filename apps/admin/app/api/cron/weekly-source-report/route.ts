import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { shiftWeek, weekStartFor, type SourceReportParams } from "@/lib/admin/analytics/by-source";
import { buildWeeklySourceEmail } from "@/lib/admin/analytics/by-source-email";
import { getSourceReport } from "@/lib/admin/analytics/by-source-queries";
import { recipientsFrom, sendEmail } from "@/lib/email/send-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Emails last week's By source report. Called every Friday morning by the
 * scheduled GitHub workflow (.github/workflows/weekly-source-report.yml) with
 * `Authorization: Bearer $CRON_SECRET`. Recipients: WEEKLY_REPORT_TO.
 * The week is the last full Monday-to-Sunday (Dubai), so a Friday run reports
 * a complete week rather than four days of this one.
 */

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params: SourceReportParams = {
    weekStart: shiftWeek(weekStartFor(new Date()), -1),
    touch: "first",
    groupBy: "post",
  };
  const origin = process.env.ADMIN_SITE_URL?.trim() || new URL(request.url).origin;
  const pageUrl = `${origin}/admin/analytics/sources?week=${params.weekStart}&touch=first&groupBy=post`;

  try {
    const { report } = await getSourceReport(params);
    const result = await sendEmail({
      to: recipientsFrom(process.env.WEEKLY_REPORT_TO),
      ...buildWeeklySourceEmail(report, params, pageUrl),
    });
    if (!result.sent) {
      console.error("[cron/weekly-source-report] not sent", result);
      return NextResponse.json({ sent: false, reason: result.reason }, { status: 503 });
    }
    return NextResponse.json({ sent: true, week: params.weekStart });
  } catch (error) {
    console.error("[cron/weekly-source-report] failed", error);
    return NextResponse.json({ error: "Report failed." }, { status: 500 });
  }
}
