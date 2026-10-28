"use client";

import { Button } from "@/components/admin/ui/Button";
import { Field, Select } from "@/components/admin/ui/Field";
import {
  GROUP_BY_OPTIONS,
  weekBounds,
  type SourceReportParams,
} from "@/lib/admin/analytics/by-source";

function weekLabel(weekStart: string): string {
  const { weekEnd } = weekBounds(weekStart);
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export function SourceReportToolbar({
  params,
  weeks,
  exportHref,
}: {
  params: SourceReportParams;
  /** Mondays, newest first. */
  weeks: string[];
  exportHref: string;
}) {
  const options = weeks.includes(params.weekStart) ? weeks : [params.weekStart, ...weeks];
  return (
    <form
      action="/admin/analytics/sources"
      method="GET"
      className="adm-fade-up flex flex-wrap items-end gap-3 rounded-adm-lg border border-adm-line bg-adm-card p-4 shadow-adm-xs"
    >
      <div className="w-48">
        <Field label="Week (Mon–Sun, Dubai)">
          {(p) => (
            <Select name="week" defaultValue={params.weekStart} {...p}>
              {options.map((week, i) => (
                <option key={week} value={week}>
                  {weekLabel(week)}
                  {i === 0 && week === weeks[0] ? " (this week)" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="w-44">
        <Field label="Credit to">
          {(p) => (
            <Select name="touch" defaultValue={params.touch} {...p}>
              <option value="first">First touch</option>
              <option value="last">Latest touch</option>
            </Select>
          )}
        </Field>
      </div>
      <div className="w-56">
        <Field label="Rows">
          {(p) => (
            <Select name="groupBy" defaultValue={params.groupBy} {...p}>
              {GROUP_BY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Button type="submit" size="md">
        Apply
      </Button>
      <a
        href={exportHref}
        className="ml-auto inline-flex h-10 items-center rounded-adm-md border border-adm-line-strong px-5 text-sm font-semibold text-adm-ink-soft transition-colors duration-adm-fast hover:border-adm-violet hover:text-adm-violet"
      >
        Download CSV
      </a>
    </form>
  );
}
