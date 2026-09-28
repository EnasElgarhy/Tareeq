"use client";

import { CareerComparisonIcon } from "@/components/brand/DomainIcons";

/** An N-way comparison grid — for three or more options across shared
 * criteria. ComparisonCard stays the simple 2-column version. */
export function ComparisonTableCard({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: Array<{ label: string; values: string[] }>;
}) {
  return (
    <div className="daybreak-story-card rounded-story-alt p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <CareerComparisonIcon size={18} />
        <p className="daybreak-heading text-[15px] leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[11.5px]">
          <thead>
            <tr>
              <th className="w-0" />
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-[color:var(--day-line,rgba(43,36,28,0.1))] px-2 pb-1.5 text-start font-black text-[color:var(--day-ink,#2a2118)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="whitespace-nowrap border-b border-[color:var(--day-line,rgba(43,36,28,0.1))] py-1.5 pe-3 text-start font-bold text-[color:var(--day-ink-3,#675d4e)]"
                >
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={`${row.label}-${index}`}
                    className="border-b border-[color:var(--day-line,rgba(43,36,28,0.1))] px-2 py-1.5 text-[color:var(--day-ink-2,#5c5142)]"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
