"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { BRAND } from "@/lib/brand";
import { FAQ_COPY } from "./faq/faqCopy";
import { Accordion, DayPage, PageHero, Section } from "./PageShell";
import { FadeIn } from "./Shared";
import { WayQuestion } from "./WayIcons";

const FaqArt = ({ className }: { className?: string }) => (
  <WayQuestion size={120} className={className} />
);

/** FAQ (28 Oct update, Part B): four groups, both languages. */
export const Faq = () => {
  const { locale } = useLocale();
  const copy = FAQ_COPY[locale];

  return (
    <DayPage>
      <main>
        <PageHero title={copy.title} art={FaqArt} artClass="w-28 h-28 text-[#6D5BA8]" />
        {copy.groups.map((group, i) => (
          <Section
            key={group.title}
            title={group.title}
            className={i === 0 ? "!pt-4" : "border-t border-[var(--day-line)]"}
          >
            <FadeIn className="max-w-3xl">
              <Accordion items={group.items} testPrefix={`faq-${i + 1}`} defaultOpen={i === 0 ? 0 : -1} />
            </FadeIn>
          </Section>
        ))}
        <Section className="border-t border-[var(--day-line)]">
          <p className="text-lg text-[var(--day-ink-2)]">{copy.closing}</p>
          <a
            href={`mailto:${BRAND.supportEmail}`}
            dir="ltr"
            className="mt-2 inline-block font-heading text-xl font-semibold text-[#6D5BA8] underline-offset-4 hover:underline"
          >
            {BRAND.supportEmail}
          </a>
        </Section>
      </main>
    </DayPage>
  );
};
