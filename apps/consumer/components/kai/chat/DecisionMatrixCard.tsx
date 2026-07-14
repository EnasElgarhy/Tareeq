"use client";

import { Scale } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { KaiDecisionMatrixRow } from "@/lib/kai/chat-types";

const MAX_SCORE = 5;

/** Criteria scored per option (1-5), with an optional final
 * recommendation — for weighing a small set of real choices rather
 * than just listing pros/cons side by side (see ComparisonTableCard). */
export function DecisionMatrixCard({
  title,
  options,
  rows,
  recommendation,
}: {
  title: string;
  options: string[];
  rows: KaiDecisionMatrixRow[];
  recommendation?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
      <div className="mb-2.5 flex items-center gap-2">
        <Scale size={18} />
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] border-collapse text-[11.5px]">
          <thead>
            <tr>
              <th className="w-0" />
              {options.map((option) => (
                <th
                  key={option}
                  className="border-b border-[color:var(--day-line,rgba(43,36,28,0.1))] px-2 pb-1.5 text-start font-black text-[color:var(--day-ink,#2a2118)]"
                >
                  {option}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.criterion}>
                <th
                  scope="row"
                  className="whitespace-nowrap border-b border-[color:var(--day-line,rgba(43,36,28,0.1))] py-1.5 pe-3 text-start font-bold text-[color:var(--day-ink-3,#675d4e)]"
                >
                  {row.criterion}
                </th>
                {row.scores.map((score, index) => (
                  <td key={`${row.criterion}-${index}`} className="border-b border-[color:var(--day-line,rgba(43,36,28,0.1))] px-2 py-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold tabular-nums"
                      style={{ background: `rgba(157,127,240,${Math.min(1, Math.max(0.08, score / MAX_SCORE)) * 0.22})` }}
                    >
                      {score}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recommendation ? (
        <div className="mt-3 rounded-[14px] bg-violet/[0.06] p-2.5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-violet">
            {t("kai.chat.recommendation_label")}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">{recommendation}</p>
        </div>
      ) : null}
    </div>
  );
}
