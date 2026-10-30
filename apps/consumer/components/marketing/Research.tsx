"use client";

import { Check, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { DayPage, DotList } from "./PageShell";
import { REFERENCES, SCIENCE_COPY, type ScienceSection } from "./science/scienceCopy";
import { ChooseNotRate, CuriosityCircle } from "./science/ScienceVisuals";
import { Container, FadeIn } from "./Shared";

/** The four parts of CORE, in the order file 07 lists them. */
const LETTERS = ["C", "O", "R", "E"] as const;
const LETTER_TONES: Record<(typeof LETTERS)[number], string> = {
  C: "bg-[#6D5BA8] text-white",
  O: "bg-[#F4C660] text-[#14101F]",
  R: "bg-[#F2A8B3] text-[#14101F]",
  E: "bg-[#C8B6F0] text-[#14101F]",
};
const SECTION_IDS = ["parts", "how", "limits"] as const;

/** "Curiosities: built on…" → ["Curiosities", "built on…"]. */
function splitTitle(title: string): [string, string] {
  const at = title.indexOf(":");
  return at === -1 ? [title, ""] : [title.slice(0, at).trim(), title.slice(at + 1).trim()];
}

/** "Built on: A (1997); B (1982)." → ["A (1997)", "B (1982)"] (Arabic uses "؛"). */
function citations(builtOn?: string): string[] {
  if (!builtOn) return [];
  const body = builtOn.slice(builtOn.indexOf(":") + 1);
  return body
    .split(/[;؛]/)
    .map((c) => c.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

/** The paragraph that says what CORE does not claim gets its own box. */
const NOT_CLAIMED = /^(What we don’t claim|ما لا ندّعيه)\s*:\s*/;

function Paragraphs({ items }: { items?: readonly string[] }) {
  return (
    <>
      {items?.map((paragraph) => {
        const match = paragraph.match(NOT_CLAIMED);
        if (!match) {
          return (
            <p key={paragraph.slice(0, 40)} className="leading-relaxed text-[var(--day-ink-2)]">
              {paragraph}
            </p>
          );
        }
        return (
          <p key={paragraph.slice(0, 40)} className="rounded-2xl bg-[var(--day-inset)] p-4 text-[15px] leading-relaxed text-[var(--day-ink-2)]">
            <strong className="mb-1 block text-[13px] font-bold text-[var(--day-ink)]">{match[1]}</strong>
            <span className="block first-letter:uppercase">{paragraph.slice(match[0].length)}</span>
          </p>
        );
      })}
    </>
  );
}

function Citations({ builtOn }: { builtOn?: string }) {
  const list = citations(builtOn);
  if (list.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {list.map((c) => (
        <li key={c} className="rounded-full border border-[var(--day-line)] bg-[var(--day-bg)] px-2.5 py-1 text-[12px] text-[var(--day-ink-3)]">
          {c}
        </li>
      ))}
    </ul>
  );
}

const PART_ART: Record<(typeof LETTERS)[number], string> = {
  C: "/marketing/science/part-c.jpg",
  O: "/marketing/science/part-o.jpg",
  R: "/marketing/science/part-r.jpg",
  E: "/marketing/science/part-e.jpg",
};

/** Section 1: each part as an editorial row beside its scene; the circle follows Curiosities. */
function FourParts({ section }: { section: ScienceSection }) {
  return (
    <div className="grid gap-20 md:gap-28">
      {section.blocks.map((block, i) => {
        const [name, rest] = splitTitle(block.title);
        const letter = LETTERS[i] ?? "C";
        const flip = i % 2 === 1;
        return (
          <div key={block.title} className="grid gap-20 md:gap-28">
            <FadeIn>
              <article className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                <figure className={`relative ${flip ? "md:order-2" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PART_ART[letter]}
                    alt=""
                    width={960}
                    height={720}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-[32px] object-cover shadow-[0_40px_80px_-40px_rgba(34,18,72,0.7)]"
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute -top-5 -start-2 grid size-16 md:-start-5 place-items-center rounded-2xl font-heading text-3xl font-extrabold shadow-[0_16px_30px_-12px_rgba(8,5,26,0.5)] ${LETTER_TONES[letter]}`}
                  >
                    {letter}
                  </span>
                </figure>
                <div className="grid gap-4">
                  <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#6D5BA8]">{name}</span>
                  {rest ? <h3 className="font-heading text-3xl font-semibold leading-tight first-letter:uppercase sm:text-4xl">{rest}</h3> : null}
                  <Paragraphs items={block.paragraphs} />
                  <Citations builtOn={block.builtOn} />
                </div>
              </article>
            </FadeIn>
            {i === 0 ? (
              <FadeIn>
                <CuriosityCircle />
              </FadeIn>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Section 2: a pinned index beside the blocks it lists. */
function HowItWorks({ section }: { section: ScienceSection }) {
  const anchor = (i: number) => `how-${i + 1}`;
  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
      <nav aria-label={section.title} className="hidden lg:block">
        <ol className="sticky top-28 grid gap-1 border-s border-[var(--day-line)]">
          {section.blocks.map((block, i) => (
            <li key={block.title}>
              <a href={`#${anchor(i)}`} className="-ms-px block border-s-2 border-transparent py-1.5 ps-4 text-[14px] leading-snug text-[var(--day-ink-2)] transition-colors hover:border-[#6D5BA8] hover:text-[var(--day-ink)]">
                {block.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="grid divide-y divide-[var(--day-line)]">
        {section.blocks.map((block, i) => (
          <article key={block.title} id={anchor(i)} className="grid scroll-mt-28 gap-4 py-8 first:pt-0">
            <h3 className="font-heading text-2xl font-semibold leading-snug">{block.title}</h3>
            <Paragraphs items={block.paragraphs} />
            {i === 0 ? <ChooseNotRate /> : null}
            {block.bullets ? <DotList items={block.bullets} /> : null}
            <Citations builtOn={block.builtOn} />
          </article>
        ))}
      </div>
    </div>
  );
}

/** Section 3: what CORE is and isn't, and how we check our work. */
function HonestLimits({ section }: { section: ScienceSection }) {
  const [isBlock, ...others] = section.blocks;
  const [is, ...isnt] = isBlock?.bullets ?? [];
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      {isBlock ? (
        <article className="grid gap-5 rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-6 sm:p-7">
          <h3 className="font-heading text-2xl font-semibold">{isBlock.title}</h3>
          <Paragraphs items={isBlock.paragraphs} />
          {is ? (
            <p className="flex items-start gap-3 rounded-2xl bg-[#EEEBF6] p-4 font-semibold text-[#2E2650]">
              <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#6D5BA8]" />
              {is}
            </p>
          ) : null}
          <ul className="grid gap-2.5">
            {isnt.map((line) => (
              <li key={line} className="flex items-start gap-3 text-[var(--day-ink-2)]">
                <X aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#C0605A]" />
                {line}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
      {others.map((block) => (
        <article key={block.title} className="grid content-start gap-4 rounded-[28px] bg-[#221248] p-6 text-[#F5EEE6] sm:p-7">
          <h3 className="font-heading text-2xl font-semibold">{block.title}</h3>
          {block.paragraphs?.map((p) => (
            <p key={p.slice(0, 40)} className="leading-relaxed text-[#F5EEE6]/80">
              {p}
            </p>
          ))}
          {block.bullets ? <DotList items={block.bullets} /> : null}
        </article>
      ))}
    </div>
  );
}

/**
 * The science (file 07, Part 2, with the 28 Oct addition). Plain words first;
 * each claim's sources sit under it as citation chips, and the full reference
 * list folds away at the end.
 */
export const Research = () => {
  const { locale } = useLocale();
  const copy = SCIENCE_COPY[locale];
  const [parts, how, limits] = copy.sections;
  const bodies = [
    parts ? <FourParts section={parts} /> : null,
    how ? <HowItWorks section={how} /> : null,
    limits ? <HonestLimits section={limits} /> : null,
  ];

  return (
    <DayPage>
      <main>
        <header className="relative isolate overflow-hidden bg-[#08051A] pb-40 pt-32 text-[#F5EEE6] md:pb-48 md:pt-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marketing/science/observatory.jpg"
            alt=""
            width={1920}
            height={1080}
            className="absolute inset-0 -z-10 h-full w-full object-cover object-[72%_50%] rtl:-scale-x-100"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08051A] via-[#08051A]/80 to-[#08051A]/10 rtl:bg-gradient-to-l" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-[#08051A]/70" />
          <Container>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#F4C660]">
                <span aria-hidden="true">✦</span>
                {copy.kicker}
              </span>
              <h1 className="mt-5 font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.02em] sm:text-7xl">{copy.headline}</h1>
              <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-[#F5EEE6]/80">{copy.line}</p>
              <nav aria-label={copy.kicker} className="mt-9 flex flex-wrap gap-2">
                {[...copy.sections.map((s, i) => ({ label: s.title, href: `#${SECTION_IDS[i]}` })), { label: copy.referencesTitle, href: "#references" }].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/20 bg-white/[0.07] px-4 py-2 text-[14px] font-semibold text-[#F5EEE6] backdrop-blur-md transition-colors hover:border-[#F4C660]/60 hover:text-[#F4C660] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </Container>
        </header>

        <Container className="relative z-10 -mt-24 md:-mt-28">
          <p className="grid gap-4 rounded-[32px] bg-[var(--day-card)] p-7 font-heading text-xl font-semibold leading-snug text-[var(--day-ink)] shadow-[0_40px_80px_-40px_rgba(8,5,26,0.55)] sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-10 sm:text-2xl">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-[#F4C660] text-xl text-[#14101F]">✦</span>
            {copy.note}
          </p>
        </Container>

        {copy.sections.map((section, i) => (
          <section key={section.title} id={SECTION_IDS[i]} aria-labelledby={`${SECTION_IDS[i]}-title`} className="scroll-mt-20 pt-20 md:pt-24">
            <Container>
              <h2 id={`${SECTION_IDS[i]}-title`} className="mb-8 font-heading text-4xl font-semibold tracking-[-0.015em] md:mb-10">
                {section.title}
              </h2>
              {bodies[i]}
            </Container>
          </section>
        ))}

        <section id="references" aria-labelledby="references-title" className="scroll-mt-20 pb-10 pt-20 md:pt-24">
          <Container>
            <details className="group rounded-[28px] border border-[var(--day-line)] bg-[var(--day-card)] p-6 sm:p-7">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <h2 id="references-title" className="font-heading text-2xl font-semibold">
                  {copy.referencesTitle} <span className="text-[var(--day-ink-3)]">({REFERENCES.length})</span>
                </h2>
                <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open:rotate-180" />
              </summary>
              <ol dir="ltr" lang="en" className="mt-6 grid list-decimal gap-x-10 gap-y-2 ps-5 text-start text-[13.5px] leading-relaxed text-[var(--day-ink-2)] md:grid-cols-2">
                {REFERENCES.map((reference) => (
                  <li key={reference}>{reference}</li>
                ))}
              </ol>
            </details>
            <p className="mt-10">
              <Link href="/model" className="inline-flex items-center rounded-full bg-[#14101F] px-6 py-3 font-semibold text-[#F5EEE6] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]">
                {locale === "ar" ? "نموذج كور ←" : "The CORE model →"}
              </Link>
            </p>
          </Container>
        </section>
      </main>
    </DayPage>
  );
};
