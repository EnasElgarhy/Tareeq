"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/admin/ui/Card";
import { InlineStatus } from "@/components/admin/ui/Toast";

type ExportType = "summary" | "rows" | "flagged";

interface ExportOption {
  type: ExportType;
  title: string;
  description: string;
  buttonLabel: string;
  icon: ReactNode;
}

// Restrained inline icons — no icon-lib dependency, matches the calm admin
// visual language (thin strokes, currentColor).
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const OPTIONS: ExportOption[] = [
  {
    type: "summary",
    title: "Summary report",
    description: "High-level metrics and totals for presentations or reporting.",
    buttonLabel: "Export summary",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="M5 20V10M12 20V4M19 20v-6" />
      </svg>
    ),
  },
  {
    type: "rows",
    title: "Assessment data",
    description: "One anonymized row per assessment for deeper analysis.",
    buttonLabel: "Export assessment data",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden>
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path d="M3.5 10h17M9 10v9" />
      </svg>
    ),
  },
  {
    type: "flagged",
    title: "Flagged records",
    description: "Only records currently marked for review.",
    buttonLabel: "Export flagged records",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
      </svg>
    ),
  },
];

function summaryLine(
  dateFrom: string | null,
  dateTo: string | null,
  assessmentLabel: string,
  recordCount: number | null,
): string {
  const range =
    dateFrom || dateTo
      ? `${dateFrom ?? "start"} → ${dateTo ?? "today"}`
      : "All time";
  const parts = [range, assessmentLabel];
  if (recordCount != null) {
    parts.push(`${recordCount.toLocaleString()} record${recordCount === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

export function ExportPanel({
  queryString,
  saltConfigured,
  dateFrom = null,
  dateTo = null,
  assessmentLabel = "All assessments",
  recordCount = null,
}: {
  queryString: string;
  saltConfigured: boolean;
  dateFrom?: string | null;
  dateTo?: string | null;
  assessmentLabel?: string;
  recordCount?: number | null;
}) {
  const [selected, setSelected] = useState<ExportType>("summary");
  const option = OPTIONS.find((o) => o.type === selected) ?? OPTIONS[0];
  const suffix = queryString ? `&${queryString}` : "";
  const href = `/api/admin/analytics/export?type=${selected}${suffix}`;

  return (
    <Card className="adm-fade-up p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-adm-ink">Export data</h2>
      </div>
      <p className="text-[13px] text-adm-ink-muted">
        Download data based on the filters above.
      </p>

      {/* Pre-export summary of what the download will contain */}
      <p className="mt-3 text-[12px] font-medium text-adm-ink-soft">
        {summaryLine(dateFrom, dateTo, assessmentLabel, recordCount)}
      </p>

      {!saltConfigured && (
        <div className="mt-3">
          <InlineStatus kind="error">
            Export unavailable: ANALYTICS_HASH_SALT is not configured.
          </InlineStatus>
        </div>
      )}

      {/* Single-choice selector */}
      <fieldset
        className="mt-4 grid gap-2.5"
        disabled={!saltConfigured}
        aria-label="Choose what to export"
      >
        {OPTIONS.map((o) => {
          const isSelected = o.type === selected;
          return (
            <label
              key={o.type}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-adm-md border p-3.5 transition-colors duration-adm-fast",
                isSelected
                  ? "border-adm-violet bg-adm-violet-soft"
                  : "border-adm-line hover:border-adm-line-strong",
                !saltConfigured ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name="export-type"
                value={o.type}
                checked={isSelected}
                onChange={() => setSelected(o.type)}
                className="sr-only"
              />
              <span
                className={[
                  "mt-0.5 grid size-9 shrink-0 place-items-center rounded-adm-sm",
                  isSelected ? "bg-adm-violet text-white" : "bg-adm-sand text-adm-ink-soft",
                ].join(" ")}
              >
                {o.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-adm-ink">{o.title}</span>
                  {isSelected && (
                    <span className="text-adm-violet" aria-hidden>
                      <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-adm-ink-muted">
                  {o.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {/* Primary action */}
      <div className="mt-4">
        {saltConfigured ? (
          <a
            href={href}
            className="inline-flex h-10 items-center rounded-adm-md bg-adm-violet px-5 text-[13px] font-semibold text-white transition-colors duration-adm-fast hover:bg-adm-deep"
          >
            {option.buttonLabel}
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Set ANALYTICS_HASH_SALT in the environment to enable exports."
            className="inline-flex h-10 cursor-not-allowed items-center rounded-adm-md bg-adm-line px-5 text-[13px] font-semibold text-adm-ink-muted opacity-60"
          >
            Export CSV
          </button>
        )}
      </div>

      <p className="mt-3 text-[11.5px] leading-snug text-adm-ink-muted">
        Names and emails are excluded. Assessment exports use anonymized user IDs.
      </p>
    </Card>
  );
}
