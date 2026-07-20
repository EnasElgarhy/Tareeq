"use client";

import { Button } from "@/components/admin/ui/Button";
import { Field, Input, Select } from "@/components/admin/ui/Field";
import type { AnalyticsFilters, CatalogOption } from "@/lib/admin/analytics/types";

/**
 * Plain GET form, submitted to the current tab's own path — switching a
 * filter re-renders the active tab rather than bouncing to Overview. No
 * client JS required for the submission itself.
 */
export function FilterToolbar({
  filters,
  countryOptions,
  genderOptions,
  catalogOptions,
  action,
}: {
  filters: AnalyticsFilters;
  countryOptions: string[];
  genderOptions: string[];
  catalogOptions: CatalogOption[];
  action: string;
}) {
  return (
    <form
      action={action}
      method="GET"
      className="adm-fade-up flex flex-wrap items-end gap-3 rounded-adm-lg border border-adm-line bg-adm-card p-4 shadow-adm-xs"
    >
      <div className="w-32">
        <Field label="From">
          {(p) => <Input type="date" name="from" defaultValue={filters.from ?? ""} {...p} />}
        </Field>
      </div>
      <div className="w-32">
        <Field label="To">
          {(p) => <Input type="date" name="to" defaultValue={filters.to ?? ""} {...p} />}
        </Field>
      </div>
      <div className="w-44">
        <Field label="Assessment">
          {(p) => (
            <Select name="catalog" defaultValue={filters.catalogId ?? ""} {...p}>
              <option value="">All assessments</option>
              <option value="legacy-core">Legacy CORE</option>
              {catalogOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="w-32">
        <Field label="Country">
          {(p) => (
            <Select name="country" defaultValue={filters.country ?? ""} {...p}>
              <option value="">All</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="w-28">
        <Field label="Age">
          {(p) => (
            <Select name="ageBand" defaultValue={filters.ageBand ?? ""} {...p}>
              <option value="">All</option>
              <option value="under-16">Under 16</option>
              <option value="16-17">16–17</option>
              <option value="18-19">18–19</option>
              <option value="20-21">20–21</option>
              <option value="22+">22+</option>
              <option value="unknown">Unknown</option>
            </Select>
          )}
        </Field>
      </div>
      <div className="w-28">
        <Field label="Gender">
          {(p) => (
            <Select name="gender" defaultValue={filters.gender ?? ""} {...p}>
              <option value="">All</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="w-36">
        <Field label="Records">
          {(p) => (
            <Select name="flagged" defaultValue={filters.flagged} {...p}>
              <option value="include">All records</option>
              <option value="exclude">Exclude flagged</option>
              <option value="only">Only flagged</option>
            </Select>
          )}
        </Field>
      </div>

      <label className="flex h-10 items-center gap-2 text-[13px] font-semibold text-adm-ink-soft">
        <input
          type="checkbox"
          name="completedOnly"
          value="true"
          defaultChecked={filters.completedOnly}
          className="h-4 w-4 rounded border-adm-line-strong text-adm-violet focus:ring-2 focus:ring-adm-violet/25"
        />
        Completed only
      </label>
      <label className="flex h-10 items-center gap-2 text-[13px] font-semibold text-adm-ink-soft">
        <input
          type="checkbox"
          name="researchOnly"
          value="true"
          defaultChecked={filters.researchOnly}
          className="h-4 w-4 rounded border-adm-line-strong text-adm-violet focus:ring-2 focus:ring-adm-violet/25"
        />
        Consented only
      </label>

      <div className="ml-auto flex h-10 items-center gap-3">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <a
          href={action}
          className="text-[13px] font-semibold text-adm-ink-muted hover:text-adm-violet"
        >
          Reset
        </a>
      </div>
    </form>
  );
}
