"use client";

import { MessagesSquare } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { KaiObjectionResponseItem } from "@/lib/kai/chat-types";

/** Likely objections (from family, or anyone skeptical) paired with a
 * calm, honest response the learner can actually use. */
export function ObjectionResponseCard({ title, items }: { title: string; items: KaiObjectionResponseItem[] }) {
  const { t } = useLocale();
  return (
    <div className="justify-self-start rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] sm:max-w-[480px]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/12 text-violet">
          <MessagesSquare size={18} />
        </span>
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <div className="grid gap-2.5">
        {items.map((item) => (
          <div key={item.objection} className="rounded-[14px] bg-[color:var(--day-inset,#efe7da)] p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
              {t("kai.chat.objection_label")}
            </p>
            <p className="mt-0.5 text-[12px] font-bold leading-snug text-[color:var(--day-ink,#2a2118)]">{item.objection}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.06em] text-violet">
              {t("kai.chat.response_label")}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">{item.response}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
