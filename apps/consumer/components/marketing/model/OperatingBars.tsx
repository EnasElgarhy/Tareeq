"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { modelCopy } from "./modelContent";

const ACCENT = "#6D5BA8";

/**
 * Two three-part bars, in the same style as the report (file 07: no
 * archetypes, no quadrant). Neither end is better; the middle is "a mix".
 */
export function OperatingBars() {
  const { locale } = useLocale();
  const { title, bars } = modelCopy(locale).operating;
  return (
    <div className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[var(--day-shadow-hero)] sm:p-8">
      <p className="font-heading text-lg font-semibold text-[var(--day-ink)]">{title}</p>
      <div className="mt-6 grid gap-4">
        {bars.map((bar) => (
          <figure key={bar.name} className="rounded-2xl bg-[var(--day-bg)] p-4 sm:p-5">
            <figcaption className="text-[0.9375rem] font-semibold text-[var(--day-ink)]">{bar.name}</figcaption>
            <div aria-hidden="true" className="relative mt-4 h-1.5 rounded-full bg-[#6D5BA8]/15">
              {[0, 50, 100].map((at) => (
                <span
                  key={at}
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--day-card)] rtl:translate-x-1/2"
                  style={{ insetInlineStart: `${at}%`, borderColor: ACCENT }}
                />
              ))}
            </div>
            <ol className="mt-3 grid grid-cols-3 gap-3 text-[13px] leading-snug text-[var(--day-ink-2)]">
              {bar.ends.map((end, i) => (
                <li key={end} className={i === 1 ? "text-center" : i === 2 ? "text-end" : "text-start"}>
                  {end}
                </li>
              ))}
            </ol>
          </figure>
        ))}
      </div>
    </div>
  );
}
