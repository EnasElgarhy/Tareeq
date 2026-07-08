"use client";

import { CareerComparisonIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function ComparisonCard({
  leftLabel,
  leftPoints,
  rightLabel,
  rightPoints,
}: {
  leftLabel: string;
  leftPoints: string[];
  rightLabel: string;
  rightPoints: string[];
}) {
  const { t } = useLocale();
  return (
    <div className="justify-self-start rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] sm:max-w-[480px]">
      <div className="mb-2.5 flex items-center gap-2">
        <CareerComparisonIcon size={18} />
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("kai.chat.comparing_label")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] bg-[color:var(--day-inset,#efe7da)] p-2.5">
          <p className="mb-1.5 truncate text-[12px] font-black text-[color:var(--day-ink,#2a2118)]">{leftLabel}</p>
          <ul className="grid gap-1">
            {leftPoints.map((point) => (
              <li key={point} className="text-[11px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
                • {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] bg-violet/[0.05] p-2.5">
          <p className="mb-1.5 truncate text-[12px] font-black text-[color:var(--day-ink,#2a2118)]">{rightLabel}</p>
          <ul className="grid gap-1">
            {rightPoints.map((point) => (
              <li key={point} className="text-[11px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
