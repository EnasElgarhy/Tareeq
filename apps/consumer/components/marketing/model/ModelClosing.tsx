"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container, FadeIn } from "../Shared";
import { PILLARS } from "./modelContent";

/** Night close; `#start` lets the floating CTA step aside for this one. */
export function ModelClosing() {
  const { t } = useLocale();

  return (
    <section
      id="start"
      aria-labelledby="model-closing-heading"
      className="relative scroll-mt-20 pb-56 pt-10 text-center md:pb-72"
    >
      <Container>
        <FadeIn>
          <p
            aria-hidden="true"
            className="font-heading flex justify-center gap-3 text-5xl font-bold sm:text-6xl"
          >
            {PILLARS.map((p) => (
              <span key={p.id} style={{ color: p.nightAccent }}>
                {p.letter}
              </span>
            ))}
          </p>
          <h2
            id="model-closing-heading"
            className="font-heading mx-auto mt-8 max-w-2xl text-[clamp(2.25rem,4.5vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F5EEE6]"
          >
            Four answers are waiting to be found.
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/start"
              className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-9 py-4 text-base font-semibold text-[#14101F] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660] motion-reduce:transform-none"
            >
              {t("marketing.hero.cta")}
            </Link>
            <Link
              href="/research"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-base font-medium text-[#F5EEE6]/85 transition-colors hover:border-[#F4C660]/60 hover:text-[#F4C660] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
            >
              Read the research
            </Link>
          </div>
          <p className="mt-5 text-sm text-[#F5EEE6]/55">
            {t("marketing.hero.time")}
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}
