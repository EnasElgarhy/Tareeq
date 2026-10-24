"use client";

import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { MarketingLogo } from "@/components/marketing/MarketingLogo";
import type { Locale } from "@/lib/i18n/locale";

interface LanguageCard {
  locale: Locale;
  /** Script emblem: what the language looks like, not a flag. */
  emblem: string;
  name: string;
  note: string;
  dir: "ltr" | "rtl";
}

const CARDS: readonly LanguageCard[] = [
  { locale: "en", emblem: "Aa", name: "English", note: "Continue in English", dir: "ltr" },
  { locale: "ar", emblem: "أب", name: "العربية", note: "المتابعة بالعربية", dir: "rtl" },
];

/**
 * The first screen: pick English or Arabic before anything else. The real
 * logo opens it; each language is one clear button with a script emblem,
 * on the night ground with the website's gold dawn glow.
 */
export function LanguageChooser() {
  const { setLocale } = useLocale();

  return (
    <main
      dir="ltr"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#08051A] px-6 py-12 text-sand"
    >
      {/* Gold dawn glow above, faint compass rings behind. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-280px] h-[560px] w-[760px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(244,198,96,0.22), rgba(110,72,228,0.12) 55%, rgba(8,5,26,0) 100%)",
        }}
      />
      <svg
        viewBox="0 0 600 600"
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
        fill="none"
      >
        <circle cx="300" cy="300" r="290" stroke="#C8B6F0" strokeWidth="1" />
        <circle cx="300" cy="300" r="215" stroke="#C8B6F0" strokeWidth="1" strokeDasharray="3 9" />
      </svg>

      <div className="anim-fade-in relative z-10 flex w-full max-w-[640px] flex-col items-center text-center">
        <div className="flex items-center gap-2.5">
          <MarketingLogo />
        </div>

        <h1 className="mt-10 font-heading text-[30px] font-bold leading-tight tracking-[-0.02em] sm:text-[34px]">
          Choose your language
        </h1>
        <p lang="ar" dir="rtl" className="mt-1.5 font-arabic text-[22px] font-semibold text-sand/80">
          اختر لغتك
        </p>

        <ul className="mt-9 grid w-full gap-3 sm:grid-cols-2">
          {CARDS.map((card) => (
            <li key={card.locale}>
              <button
                type="button"
                dir={card.dir}
                lang={card.locale}
                onClick={() => setLocale(card.locale)}
                className="group flex w-full items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-start transition duration-200 hover:border-[#F4C660]/60 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660] active:scale-[0.98] motion-reduce:transition-none"
              >
                <span
                  aria-hidden
                  className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#F4C660]/12 text-[22px] font-bold text-[#F4C660] transition group-hover:bg-[#F4C660] group-hover:text-[#14101F]"
                >
                  {card.emblem}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="text-[19px] font-bold leading-tight text-sand">{card.name}</span>
                  <span className="text-[13px] text-sand/60">{card.note}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  size={18}
                  className="shrink-0 text-sand/40 transition group-hover:translate-x-0.5 group-hover:text-[#F4C660] rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                />
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[12px] text-sand/45">
          You can change this later
          <span aria-hidden className="mx-2 text-sand/25">
            |
          </span>
          <span lang="ar" dir="rtl">
            يمكنك تغييرها لاحقاً
          </span>
        </p>
      </div>
    </main>
  );
}
