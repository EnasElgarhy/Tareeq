"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container, FadeIn } from "../Shared";
import { modelCopy } from "./modelContent";

/**
 * "Why four parts" (file 07): replaces the RIASEC comparison table. CORE's
 * curiosities are built on Holland's RIASEC, so the page no longer sets the
 * two against each other; a two-step visual shows how the parts work together.
 */
export function WhyFourParts() {
  const { locale } = useLocale();
  const { why, pillars } = modelCopy(locale);
  const [curiosities, ...others] = pillars;

  return (
    <section aria-labelledby="why-four-heading" className="border-t border-[var(--day-line)] py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-4xl">
          <FadeIn className="text-center">
            <p className="text-sm font-semibold text-[#7A4A21]">{why.kicker}</p>
            <h2
              id="why-four-heading"
              className="font-heading mt-4 text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
            >
              {why.headline}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--day-ink-2)]">{why.text}</p>
          </FadeIn>

          <FadeIn delay={0.1} className="mt-12">
            <ol className="grid gap-4 md:grid-cols-2">
              {why.steps.map((step, i) => {
                const parts = i === 0 ? [curiosities] : others;
                return (
                  <li
                    key={step}
                    className="rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-6 shadow-[var(--day-shadow-hero)] sm:p-8"
                  >
                    <span className="font-heading text-sm font-semibold text-[var(--day-ink-3)]">{i + 1}</span>
                    <div aria-hidden="true" className="mt-3 flex flex-wrap gap-2">
                      {parts.map((part) => (
                        <span
                          key={part.id}
                          className="rounded-full px-3 py-1 text-sm font-semibold"
                          style={{ background: `${part.dayAccent}18`, color: part.dayAccent }}
                        >
                          {part.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-lg font-medium leading-snug text-[var(--day-ink)]">{step}</p>
                  </li>
                );
              })}
            </ol>
            <p className="mt-8 text-center">
              <Link href="/research" className="font-semibold text-[#6D5BA8] underline-offset-4 hover:underline">
                {why.link}
              </Link>
            </p>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
