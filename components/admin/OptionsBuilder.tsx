"use client";

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

export const OPT_INPUT =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20";

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

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 px-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
        <span className="w-10 text-center">Key</span>
        <span className="flex-1">Answer</span>
        <span className="w-20 text-center">Cluster</span>
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
              className={`${OPT_INPUT} w-20`}
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
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Remove answer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-500 transition hover:border-[#6E48E4] hover:text-[#6E48E4]"
      >
        + Add answer
      </button>
    </div>
  );
}
