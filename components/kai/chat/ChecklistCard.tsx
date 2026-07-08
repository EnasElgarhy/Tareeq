"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** A short, in-chat check-off list. Session-only local state — not
 * persisted. Saving and tracking progress across sessions is reserved
 * for action_plan (see ActionPlanCard + lib/kai/plans/). */
export function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  const { t } = useLocale();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="justify-self-start rounded-[18px] border border-mint/30 bg-mint/[0.06] p-3.5 sm:max-w-[480px]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("kai.chat.checklist_progress")
            .replace("{done}", String(checked.size))
            .replace("{total}", String(items.length))}
        </span>
      </div>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item, index) => {
          const isChecked = checked.has(index);
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={isChecked}
                className="flex w-full items-start gap-2 text-start text-[12px] leading-snug"
              >
                {isChecked ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-mint" />
                ) : (
                  <Circle size={16} className="mt-0.5 shrink-0 text-[color:var(--day-ink-3,#675d4e)]" />
                )}
                <span className={isChecked ? "text-[color:var(--day-ink-3,#675d4e)] line-through" : "text-[color:var(--day-ink-2,#5c5142)]"}>
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
