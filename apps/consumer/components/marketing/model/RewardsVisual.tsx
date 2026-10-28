"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { modelCopy } from "./modelContent";

const ACCENT = "#B45C50";

/** All eight motivators with equal weight: none is shown as better (file 07). */
export function RewardsVisual() {
  const { locale } = useLocale();
  const { title, items } = modelCopy(locale).rewards;
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <p className="font-heading text-lg font-semibold text-[var(--day-ink)]">{title}</p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ name, icon: Icon }) => (
          <li key={name} className="flex items-center gap-3 rounded-2xl bg-[var(--day-bg)] p-4">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F2A8B3]/30"
              style={{ color: ACCENT }}
            >
              <Icon size={21} weight="duotone" aria-hidden="true" />
            </span>
            <span className="text-[0.9375rem] font-medium leading-snug text-[var(--day-ink)]">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
