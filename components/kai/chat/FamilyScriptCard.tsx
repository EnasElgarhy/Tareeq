"use client";

import { ParentsIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Literal lines the learner can say — e.g. to a parent. Rendered as
 * quoted, sequential speech rather than a bare bullet list so it reads
 * as something to actually say out loud. */
export function FamilyScriptCard({ title, script }: { title: string; script: string[] }) {
  const { t } = useLocale();
  return (
    <div className="justify-self-start rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] sm:max-w-[480px]">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
          <ParentsIcon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--day-ink-3,#675d4e)]">
            {t("kai.chat.family_script_label")}
          </p>
          <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
        </div>
      </div>
      <div className="grid gap-2 border-s-2 border-gold/30 ps-3">
        {script.map((line) => (
          <p key={line} className="text-[12.5px] italic leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">
            “{line}”
          </p>
        ))}
      </div>
    </div>
  );
}
