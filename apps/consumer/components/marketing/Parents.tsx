"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getReportOffer } from "@/lib/payments/report-access";
import { Card, DayPage, DotList, PageHero, Section } from "./PageShell";
import { PARENTS_COPY } from "./parents/parentsCopy";
import { SendToChildButton } from "./SendToChildButton";
import { Container, FadeIn } from "./Shared";
import { SunriseDunes } from "./Illustrations";

const CTA =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-gold-gradient px-8 py-3.5 text-base font-semibold text-[#14101F] shadow-lg shadow-[#F4C660]/20 transition-transform hover:scale-[1.02] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]";

function SendCta({ under, placement }: { under: string; placement: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <SendToChildButton className={CTA} placement={placement} />
      <p className="text-sm text-[color:var(--day-ink-2)]">{under}</p>
    </div>
  );
}

/** For parents (28 Oct update, Part B): eight sections, both languages. */
export const Parents = () => {
  const { locale } = useLocale();
  const copy = PARENTS_COPY[locale];
  const offer = getReportOffer();
  const full = Math.round(offer.listAmountMinor / 100);
  const now = Math.round(offer.amountMinor / 100);

  return (
    <DayPage>
      <main>
        <PageHero
          eyebrow={copy.eyebrow}
          title={copy.headline}
          lede={copy.subline}
          art={SunriseDunes}
          artClass="w-80 h-auto"
        />
        <Container className="-mt-4 pb-6">
          <SendCta under={copy.underCta} placement="parents-hero" />
        </Container>

        <Section title={copy.why.headline} className="border-t border-[var(--day-line)]">
          <FadeIn className="grid max-w-3xl gap-6">
            <p className="text-lg leading-relaxed text-[var(--day-ink-2)]">{copy.why.text}</p>
            <p className="font-heading text-2xl font-semibold leading-snug text-[#6D5BA8]">
              {copy.why.highlight}
            </p>
          </FadeIn>
        </Section>

        <Section title={copy.how.headline} className="border-t border-[var(--day-line)]">
          <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {copy.how.steps.map((step, i) => (
              <li key={step.title} className="h-full">
                <FadeIn delay={i * 0.06} className="h-full">
                  <Card className="relative h-full overflow-hidden !p-6">
                    <span
                      aria-hidden="true"
                      className="font-heading text-[2.5rem] font-bold leading-none text-[#6D5BA8]/25"
                    >
                      {i + 1}
                    </span>
                    <h3 className="mt-3 font-heading text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--day-ink-2)]">{step.body}</p>
                  </Card>
                </FadeIn>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={copy.report.headline} className="border-t border-[var(--day-line)]">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.2fr_1fr]">
            <ul className="grid gap-6">
              {copy.report.points.map((point) => (
                <li key={point.title}>
                  <h3 className="font-heading text-lg font-semibold">{point.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-[var(--day-ink-2)]">{point.body}</p>
                </li>
              ))}
            </ul>
            <FadeIn delay={0.1}>
              <figure className="rounded-story border border-[#6D5BA8]/20 bg-[#EEEBF6] p-6">
                <figcaption className="text-xs font-semibold text-[#4B3D82]">{copy.report.exampleLabel}</figcaption>
                <p className="mt-2 leading-relaxed text-[#2E2650]">{copy.report.example}</p>
              </figure>
              <p className="mt-4 text-sm text-[var(--day-ink-2)]">{copy.report.note}</p>
            </FadeIn>
          </div>
        </Section>

        <Section title={copy.help.headline} className="border-t border-[var(--day-line)]">
          <p className="-mt-6 mb-10 max-w-2xl text-lg text-[var(--day-ink-2)]">{copy.help.intro}</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {copy.help.points.map((point, i) => (
              <FadeIn key={point.title} delay={(i % 2) * 0.08}>
                <Card className="h-full !p-6">
                  <h3 className="font-heading text-lg font-semibold text-[#3D8A73]">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--day-ink-2)]">{point.body}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </Section>

        <Section title={copy.privacy.headline} className="border-t border-[var(--day-line)]">
          <DotList items={copy.privacy.points} className="max-w-3xl" />
          <Link
            href="/privacy-policy"
            className="mt-8 inline-flex items-center gap-1 font-semibold text-[#6D5BA8] underline-offset-4 hover:underline"
          >
            {copy.privacy.link}
            <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
          </Link>
        </Section>

        <Section className="border-t border-[var(--day-line)]">
          <Card className="mx-auto grid max-w-3xl gap-6 !p-8 md:grid-cols-[1fr_1.2fr] md:gap-10">
            <div>
              <h2 className="font-heading text-3xl font-semibold leading-tight">{copy.price.headline}</h2>
              <p className="mt-5 flex items-baseline gap-3">
                <span className="text-lg text-[var(--day-ink-2)] line-through">{copy.price.full(full)}</span>
                <span className="font-heading text-4xl font-bold">{copy.price.now(now)}</span>
              </p>
              <p className="mt-2 text-sm text-[var(--day-ink-2)]">{copy.price.under}</p>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">{copy.price.includedTitle}</h3>
              <DotList items={copy.price.included} className="mt-4 text-[15px]" />
              <p className="mt-5 text-sm text-[var(--day-ink-2)]">{copy.price.note}</p>
              <div className="mt-6">
                <SendToChildButton className={CTA} placement="parents-price" />
              </div>
            </div>
          </Card>
        </Section>

        <Section className="border-t border-[var(--day-line)]">
          <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">{copy.closing.headline}</h2>
            <div className="flex flex-col items-center gap-3">
              <SendToChildButton className={CTA} placement="parents-closing" />
              <p className="text-sm text-[color:var(--day-ink-2)]">{copy.closing.underCta}</p>
            </div>
          </FadeIn>
        </Section>
      </main>
    </DayPage>
  );
};
