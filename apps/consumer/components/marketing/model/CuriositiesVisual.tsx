"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { modelCopy } from "./modelContent";

const ACCENT = "#9A6A12";

/** The eight curiosities with their one-line descriptions (file 07). */
export function CuriositiesVisual() {
  const { locale } = useLocale();
  const { title, items } = modelCopy(locale).curiosities;
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <p className="font-heading text-lg font-semibold text-[var(--day-ink)]">{title}</p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ name, line, icon: Icon }) => (
          <li key={name} className="flex items-start gap-3 rounded-2xl bg-[var(--day-bg)] p-4">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F4C660]/25"
              style={{ color: ACCENT }}
            >
              <Icon size={21} weight="duotone" aria-hidden="true" />
            </span>
            <span className="grid gap-0.5">
              <span className="text-[0.9375rem] font-semibold leading-tight text-[var(--day-ink)]">{name}</span>
              <span className="text-sm leading-snug text-[var(--day-ink-2)]">{line}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
