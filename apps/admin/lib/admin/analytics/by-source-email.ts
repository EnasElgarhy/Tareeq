import {
  groupByOption,
  SOURCE_METRICS,
  weekBounds,
  type SourceReport,
  type SourceReportParams,
} from "@/lib/admin/analytics/by-source";

/**
 * The Friday-morning email of the weekly By source report (28 Oct update,
 * Part A.1). Pure: the cron route fetches the report and sends this.
 */

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cell(value: number | null): string {
  return value === null ? "—" : String(value);
}

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface WeeklyEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildWeeklySourceEmail(
  report: SourceReport,
  params: SourceReportParams,
  pageUrl: string,
): WeeklyEmail {
  const { weekStart, weekEnd } = weekBounds(params.weekStart);
  const range = `${dayLabel(weekStart)} to ${dayLabel(weekEnd)}`;
  const showPost = params.groupBy === "post";
  const firstColumn = groupByOption(params.groupBy).column;
  const headers = [firstColumn, ...(showPost ? ["Content"] : []), ...SOURCE_METRICS.map((m) => m.label)];
  const rows = [
    ...report.rows.map((row) => [
      row.source,
      ...(showPost ? [row.post ?? "—"] : []),
      ...SOURCE_METRICS.map((m) => cell(row.counts[m.key])),
    ]),
    ["Total", ...(showPost ? [""] : []), ...SOURCE_METRICS.map((m) => cell(report.totals[m.key]))],
  ];

  const th = 'style="text-align:left;padding:6px 10px;border-bottom:1px solid #ddd;font-size:12px;color:#555"';
  const td = 'style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px"';
  const table = `<table style="border-collapse:collapse;font-family:Arial,sans-serif">
<thead><tr>${headers.map((h) => `<th ${th}>${escapeHtml(h)}</th>`).join("")}</tr></thead>
<tbody>${rows
    .map((r, i) => {
      const weight = i === rows.length - 1 ? "font-weight:bold;" : "";
      return `<tr>${r.map((v) => `<td ${td.replace('style="', `style="${weight}`)}>${escapeHtml(v)}</td>`).join("")}</tr>`;
    })
    .join("")}</tbody></table>`;

  const intro = `Map My CORE, week of ${range} (Dubai time), credited to the ${params.touch === "first" ? "first" : "latest"} source.`;
  const html = `<div style="font-family:Arial,sans-serif;color:#222">
<p>${escapeHtml(intro)}</p>
${report.rows.length === 0 ? "<p>Nothing was recorded this week.</p>" : table}
<p style="font-size:13px"><a href="${escapeHtml(pageUrl)}">Open the report in the admin panel</a> to change the grouping or download the CSV.</p>
</div>`;

  const text = [
    intro,
    "",
    ...(report.rows.length === 0 ? ["Nothing was recorded this week."] : [headers, ...rows].map((r) => r.join(" | "))),
    "",
    `Admin panel: ${pageUrl}`,
  ].join("\n");

  return { subject: `Map My CORE weekly report by source: ${range}`, html, text };
}
