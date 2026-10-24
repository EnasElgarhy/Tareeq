"use client";

import { Button } from "@/components/admin/ui/Button";
import { Field, Input, Select } from "@/components/admin/ui/Field";
import type { TimingListParams } from "@/lib/admin/analytics/timing";
import type { TimingRange } from "@/lib/admin/analytics/timing-queries";

/** Plain GET form, like FilterToolbar; the sort travels along as hidden fields. */
export function TimingToolbar({
  range,
  params,
  exportHref,
}: {
  range: TimingRange;
  params: TimingListParams;
  exportHref: string;
}) {
  return (
    <form
      action="/admin/analytics/timing"
      method="GET"
      className="adm-fade-up flex flex-wrap items-end gap-3 rounded-adm-lg border border-adm-line bg-adm-card p-4 shadow-adm-xs"
    >
      <div className="w-36">
        <Field label="From">
          {(p) => <Input type="date" name="from" defaultValue={range.from} {...p} />}
        </Field>
      </div>
      <div className="w-36">
        <Field label="To">
          {(p) => <Input type="date" name="to" defaultValue={range.to} {...p} />}
        </Field>
      </div>
      <div className="w-48">
        <Field label="Answer speed">
          {(p) => (
            <Select name="fast" defaultValue={params.fast} {...p}>
              <option value="include">All attempts</option>
              <option value="only">Flagged as fast only</option>
              <option value="exclude">Hide flagged</option>
            </Select>
          )}
        </Field>
      </div>
      <input type="hidden" name="sort" value={params.sort} />
      <input type="hidden" name="dir" value={params.dir} />
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
