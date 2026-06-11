"use client";

import { ClusterChip } from "@/components/admin/ui/Badge";
import type { ClusterCode } from "@/lib/admin/clusters";
import type { ClusterRow } from "@/lib/admin/content";

export interface EditOption {
  key: string;
  letter: string;
  text: Record<string, string>;
  cluster_code: string | null;
  driver_code: string | null;
  axis_value: string | null;
}

export function nextLetter(options: EditOption[]): string {
  const used = new Set(options.map((o) => o.letter.toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const l = String.fromCharCode(65 + i);
    if (!used.has(l)) return l;
  }
  return "";
}

let keyCounter = 0;
export function makeOption(letter: string): EditOption {
  return {
    key: `tmp-${keyCounter++}`,
    letter,
    text: { en: "" },
    cluster_code: null,
    driver_code: null,
    axis_value: null,
  };
}

/** Dense admin control — used by the option rows and the editor's own fields. */
export const OPT_INPUT =
  "w-full rounded-adm-sm border border-adm-line-strong bg-adm-card px-2.5 py-1.5 " +
  "text-[13px] text-adm-ink placeholder:text-adm-ink-faint outline-none " +
  "transition-colors duration-adm-fast hover:border-adm-ink-faint " +
  "focus:border-adm-violet focus:ring-2 focus:ring-adm-violet/25";

const KNOWN_CODES = new Set([
  "TECH",
  "ENG",
  "SCI",
  "ART",
  "BUS",
  "LAW",
  "PPL",
  "ENV",
]);

/**
 * Controlled answer builder — the parent holds the options array and passes
 * onChange. Shared by the create flow (QuestionBuilder) and edit flow
 * (QuestionEditor). Each answer carries its scoring metadata (cluster / driver
 * / axis), which is how an answer feeds the CORE scoring engine.
 */
export function OptionsBuilder({
  options,
  onChange,
  clusters,
}: {
  options: EditOption[];
  onChange: (next: EditOption[]) => void;
  clusters: ClusterRow[];
}) {
  function patch(key: string, p: Partial<EditOption>) {
    onChange(options.map((o) => (o.key === key ? { ...o, ...p } : o)));
  }
  function setText(key: string, en: string) {
    onChange(
      options.map((o) =>
        o.key === key ? { ...o, text: { ...o.text, en } } : o,
      ),
    );
  }
  function add() {
    onChange([...options, makeOption(nextLetter(options))]);
  }
  function remove(key: string) {
    onChange(options.filter((o) => o.key !== key));
  }

  const usedClusters = [
    ...new Set(
      options
        .map((o) => o.cluster_code)
        .filter((c): c is string => !!c && KNOWN_CODES.has(c)),
    ),
  ] as ClusterCode[];

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 px-1 text-[10.5px] font-bold uppercase tracking-wide text-adm-ink-muted">
        <span className="w-10 text-center">Key</span>
        <span className="flex-1">Answer</span>
        <span className="w-24 text-center">Cluster</span>
        <span className="w-20 text-center">Driver</span>
        <span className="w-16 text-center">Axis</span>
        <span className="w-7" />
      </div>
      <div className="grid gap-1.5">
        {options.map((o) => (
          <div key={o.key} className="flex items-center gap-1.5">
            <input
              value={o.letter}
              onChange={(e) => patch(o.key, { letter: e.target.value })}
              className={`${OPT_INPUT} w-10 text-center font-bold`}
              maxLength={2}
            />
            <input
              value={o.text.en ?? ""}
              onChange={(e) => setText(o.key, e.target.value)}
              placeholder="Answer text"
              className={`${OPT_INPUT} flex-1`}
            />
            <select
              value={o.cluster_code ?? ""}
              onChange={(e) =>
                patch(o.key, { cluster_code: e.target.value || null })
              }
              className={`${OPT_INPUT} w-24`}
              title="Cluster this answer points to"
            >
              <option value="">—</option>
              {clusters.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              value={o.driver_code ?? ""}
              onChange={(e) =>
                patch(o.key, { driver_code: e.target.value || null })
              }
              placeholder="driver"
              className={`${OPT_INPUT} w-20`}
              title="Driver code"
            />
            <input
              value={o.axis_value ?? ""}
              onChange={(e) =>
                patch(o.key, { axis_value: e.target.value || null })
              }
              placeholder="axis"
              className={`${OPT_INPUT} w-16`}
              title="Axis value"
            />
            <button
              type="button"
              onClick={() => remove(o.key)}
              aria-label="Remove answer"
              className="flex h-8 w-7 shrink-0 items-center justify-center rounded-adm-sm text-adm-ink-muted transition-colors duration-adm-fast hover:bg-adm-error/10 hover:text-adm-error-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={add}
          className="rounded-adm-md border border-dashed border-adm-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-adm-ink-muted transition-colors duration-adm-fast hover:border-adm-violet hover:text-adm-violet"
        >
          + Add answer
        </button>
        {usedClusters.length > 0 && (
          <div className="hidden flex-wrap gap-1 sm:flex" aria-hidden="true">
            {usedClusters.map((code) => (
              <ClusterChip key={code} code={code} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
