"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/locale";

/** Dedicated first screen — pick EN or AR before the assessment begins. */
export function LanguageChooser() {
  const { setLocale } = useLocale();

  const cards: Array<{
    locale: Locale;
    name: string;
    note: string;
    dir: "ltr" | "rtl";
  }> = [
    { locale: "en", name: "English", note: "Continue in English", dir: "ltr" },
    { locale: "ar", name: "العربية", note: "المتابعة بالعربية", dir: "rtl" },
  ];

  return (
    <main
      dir="ltr"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night px-6 py-12 text-sand"
      style={{ background: "var(--night-gradient, #08051a)" }}
    >
      {/* faint compass ring */}
      <svg
        viewBox="0 0 600 600"
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 opacity-[0.10]"
        fill="none"
      >
        <circle cx="300" cy="300" r="280" stroke="#9D7FF0" strokeWidth="1" />
        <circle cx="300" cy="300" r="200" stroke="#9D7FF0" strokeWidth="1" strokeDasharray="4 8" />
        <path d="M300 60 L322 300 L300 540 L278 300 Z" fill="#6E48E4" />
      </svg>

      <div className="anim-fade-in relative z-10 w-full max-w-md text-center">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.32em]"
          style={{ color: "var(--violet-soft, #9D7FF0)" }}
        >
          Tareeq
        </p>
        <h1
          className="mt-3 text-[28px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
        >
          Choose your language
        </h1>
        <p className="mt-1 text-[20px] text-sand/80" dir="rtl">
          اختر لغتك
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <button
              key={c.locale}
              type="button"
              dir={c.dir}
              onClick={() => setLocale(c.locale)}
              className="glass-tile group flex flex-col items-center justify-center gap-1 rounded-3xl px-6 py-8 text-center transition active:scale-[0.98] hover:bg-white/[0.06]"
            >
              <span className="text-2xl font-bold text-sand">{c.name}</span>
              <span className="text-[12.5px] text-sand/55">{c.note}</span>
              <span
                aria-hidden
                className="mt-3 inline-block h-1 w-8 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                style={{ background: "var(--violet, #6E48E4)" }}
              />
            </button>
          ))}
        </div>

        <p className="mt-8 text-[12px] text-sand/40">
          You can change this later · يمكنك تغييرها لاحقاً
        </p>
      </div>
    </main>
  );
}
