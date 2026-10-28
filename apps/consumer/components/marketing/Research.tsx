"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Constellation } from "./Illustrations";
import { DayPage, DotList, PageHero, Section } from "./PageShell";
import { REFERENCES, SCIENCE_COPY, type ScienceBlock } from "./science/scienceCopy";
import { FadeIn } from "./Shared";

function Block({ block }: { block: ScienceBlock }) {
  return (
    <article className="grid gap-3">
      <h3 className="font-heading text-xl font-semibold leading-snug text-[var(--day-ink)]">{block.title}</h3>
      {block.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="leading-relaxed text-[var(--day-ink-2)]">
          {paragraph}
        </p>
      ))}
      {block.bullets ? <DotList items={block.bullets} /> : null}
      {block.builtOn ? <p className="text-sm text-[var(--day-ink-3)]">{block.builtOn}</p> : null}
    </article>
  );
}

/**
 * The science (file 07, Part 2, with the 28 Oct addition): plain-language text
 * first, the "Built on" line under it in smaller type, references at the end.
 */
export const Research = () => {
  const { locale } = useLocale();
  const copy = SCIENCE_COPY[locale];

  return (
    <DayPage>
      <main>
        <PageHero
          eyebrow={copy.kicker}
          title={copy.headline}
          lede={copy.line}
          art={Constellation}
          artClass="w-56 h-auto"
        />
        <Section className="!pt-0">
          <p className="max-w-3xl rounded-story border border-[#6D5BA8]/20 bg-[#EEEBF6] p-6 leading-relaxed text-[#2E2650]">
            {copy.note}
          </p>
        </Section>

        {copy.sections.map((section) => (
          <Section key={section.title} title={section.title} className="border-t border-[var(--day-line)]">
            <div className="grid max-w-5xl gap-12 md:grid-cols-2 md:gap-x-14">
              {section.blocks.map((block, i) => (
                <FadeIn key={block.title} delay={(i % 2) * 0.06}>
                  <Block block={block} />
                </FadeIn>
              ))}
            </div>
          </Section>
        ))}

        <Section title={copy.referencesTitle} className="border-t border-[var(--day-line)]">
          <ol dir="ltr" lang="en" className="grid max-w-4xl gap-2 text-start text-sm leading-relaxed text-[var(--day-ink-2)]">
            {REFERENCES.map((reference) => (
              <li key={reference} className="ps-6 -indent-6">
                {reference}
              </li>
            ))}
          </ol>
          <p className="mt-10">
            <Link href="/model" className="font-semibold text-[#6D5BA8] underline-offset-4 hover:underline">
              {locale === "ar" ? "نموذج كور ←" : "The CORE model →"}
            </Link>
          </p>
        </Section>
      </main>
    </DayPage>
  );
};
