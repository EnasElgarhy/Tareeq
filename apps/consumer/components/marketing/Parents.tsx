"use client";

import { Baby, EyeOff, FlaskConical, HeartHandshake, Lock, Plus, Share2, ShieldCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getReportOffer } from "@/lib/payments/report-access";
import { ChatStory } from "./parents/ChatStory";
import { PARENTS_COPY, type ParentsCopy } from "./parents/parentsCopy";
import { REPORT_SHOTS } from "./report-story/story-data";
import { SendToChildButton } from "./SendToChildButton";
import { Container, FadeIn } from "./Shared";

const CTA =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-gold-gradient px-8 py-3.5 text-base font-semibold text-[#14101F] shadow-lg shadow-[#F4C660]/25 transition-transform hover:scale-[1.02] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]";

/** One icon per privacy point, in the order of the approved text. */
const PRIVACY_ICONS = [Baby, Users, Trash2, FlaskConical, Share2, HeartHandshake, EyeOff, Lock] as const;

/** Splits "Only for ages 13 and up. Anyone younger…" into its lead and the rest. */
function lead(point: string): [string, string] {
  const dot = point.indexOf(". ");
  return dot > 0 && dot < 60 ? [point.slice(0, dot + 1), point.slice(dot + 2)] : [point, ""];
}

/** The parent's question, small, above the approved headline. */
function Heading({ id, question, headline, light = false }: { id: string; question: string; headline: string; light?: boolean }) {
  return (
    <div>
      <p className={`text-[15px] font-semibold ${light ? "text-[#C8B6F0]" : "text-[#6D5BA8]"}`}>{question}</p>
      <h2
        id={id}
        className={`mt-2 font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl ${light ? "text-[#F5EEE6]" : ""}`}
      >
        {headline}
      </h2>
    </div>
  );
}

/**
 * Opening: the evening at home. The family room at dusk, the promise, and
 * the one thing to do; the sent message floats over the scene.
 */
function Opening({ copy, message }: { copy: ParentsCopy; message: string }) {
  return (
    <header className="relative isolate overflow-hidden bg-[#08051A] text-[#F5EEE6]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/marketing/parents/living-room.jpg"
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_60%] rtl:-scale-x-100"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08051A] via-[#08051A]/80 to-[#08051A]/10 rtl:bg-gradient-to-l" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#08051A] to-transparent" />

      <Container className="grid min-h-[92svh] items-center gap-12 pb-20 pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:pt-28">
        <div className="max-w-[40rem]">
          <p className="text-[15px] text-[#C8B6F0]">{copy.eyebrow}</p>
          <h1 className="mt-5 font-heading text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[4.6rem]">
            {copy.headline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-[#F5EEE6]/75">{copy.subline}</p>
          <div className="mt-10 flex flex-col items-start gap-3">
            <SendToChildButton className={CTA} placement="parents-hero" />
            <p className="text-sm text-[#F5EEE6]/60">{copy.underCta}</p>
          </div>
        </div>

        <FadeIn delay={0.3} className="hidden justify-self-end lg:block">
          <figure className="w-[300px] rotate-[-2deg] rounded-[22px] bg-[#0B141A]/90 p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur rtl:rotate-[2deg]">
            <figcaption className="flex items-center gap-2 px-1 pb-2.5 text-[12px] font-semibold text-[#9FE2C0]">
              <span className="size-2 rounded-full bg-[#25D366]" />
              {copy.messageLabel}
            </figcaption>
            <div className="rounded-[14px] rounded-se-[4px] bg-[#005C4B] px-3.5 py-3 text-[13.5px] leading-relaxed text-[#E9EDEF]">
              {message}
              <span className="mt-1.5 block font-medium text-[#53BDEB]" dir="ltr">
                mapmycore.com
              </span>
            </div>
          </figure>
        </FadeIn>
      </Container>
    </header>
  );
}

/** Why it matters: one statement in large type, read before any detail. */
function Why({ copy }: { copy: ParentsCopy }) {
  return (
    <section aria-labelledby="parents-why" className="bg-[#08051A] pb-28 pt-8 text-[#F5EEE6] md:pb-36">
      <Container>
        <FadeIn>
          <h2 id="parents-why" className="max-w-[18ch] font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
            {copy.why.headline}
          </h2>
        </FadeIn>
        <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-16">
          <p className="max-w-[44ch] text-lg leading-relaxed text-[#F5EEE6]/70">{copy.why.text}</p>
          <p className="max-w-[30ch] font-heading text-2xl font-medium leading-snug text-[#F4C660] sm:text-[1.75rem]">
            {copy.why.highlight}
          </p>
        </div>
      </Container>
    </section>
  );
}

/** A point whose full approved text opens on tap. */
function Reveal({ title, body, dark = false, big = false }: { title: string; body: string; dark?: boolean; big?: boolean }) {
  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-start justify-between gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6D5BA8] [&::-webkit-details-marker]:hidden ${
          big ? "font-heading text-2xl font-semibold leading-snug sm:text-[1.65rem]" : "font-heading text-lg font-semibold leading-snug"
        }`}
      >
        <span>{title}</span>
        <span
          className={`mt-1 grid size-7 shrink-0 place-items-center rounded-full transition-transform duration-300 group-open:rotate-45 ${
            dark ? "bg-white/10 text-[#F4C660]" : "bg-[#221248] text-[#F5EEE6]"
          }`}
        >
          <Plus aria-hidden="true" className="size-4" />
        </span>
      </summary>
      <p className={`pt-3 leading-relaxed ${dark ? "text-[#F5EEE6]/75" : "text-[var(--day-ink-2)]"}`}>{body}</p>
    </details>
  );
}

/**
 * What the report shows: three real report pages fanned like printouts on a
 * table, the four points beside them, the example pinned on top.
 */
function Report({ copy }: { copy: ParentsCopy }) {
  const { locale } = useLocale();
  const shots = REPORT_SHOTS[locale];
  const fan = [
    { shot: shots[0], cls: "start-0 top-10 -rotate-[7deg] rtl:rotate-[7deg]" },
    { shot: shots[1], cls: "start-[24%] top-0 rotate-[1deg] rtl:-rotate-[1deg] z-10" },
    { shot: shots[2], cls: "end-0 top-14 rotate-[8deg] rtl:-rotate-[8deg] z-20" },
  ];
  return (
    <section id="parents-report" aria-labelledby="parents-report-title" className="overflow-hidden py-24 md:py-32">
      <Container>
        <Heading id="parents-report-title" question={copy.questions.report} headline={copy.report.headline} />
        <div className="mt-14 grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div aria-hidden="true" className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[520px]">
            {fan.map(({ shot, cls }) => (
              <div
                key={shot.src}
                className={`absolute h-[360px] w-[46%] overflow-hidden rounded-[22px] border-[6px] border-[#FFFCF6] bg-[#FFFCF6] shadow-[0_30px_60px_-24px_rgba(34,18,72,0.45)] sm:h-[460px] ${cls}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.src} alt="" width={600} height={shot.height} loading="lazy" className="block w-full" />
              </div>
            ))}
            <figure className="absolute -bottom-2 end-2 z-30 max-w-[290px] rotate-[2deg] rounded-[18px] bg-[#F4C660] p-4 text-[#14101F] shadow-[0_24px_50px_-20px_rgba(8,5,26,0.5)] rtl:-rotate-[2deg] sm:end-6">
              <figcaption className="text-xs font-bold">{copy.report.exampleLabel}</figcaption>
              <p className="mt-1.5 line-clamp-5 text-[13px] leading-snug">{copy.report.example}</p>
            </figure>
          </div>

          <div>
            <ul className="divide-y divide-[var(--day-line)] border-y border-[var(--day-line)]">
              {copy.report.points.map((point) => (
                <li key={point.title} className="py-5">
                  <Reveal title={point.title} body={point.body} />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[15px] text-[var(--day-ink-2)]">{copy.report.note}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** How to help: the four openers as things to say, set over the photo of a parent and child. */
function Help({ copy }: { copy: ParentsCopy }) {
  return (
    <section id="parents-help" aria-labelledby="parents-help-title" className="relative isolate overflow-hidden bg-[#221248] py-24 text-[#F5EEE6] md:py-32">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/marketing/parents/together.jpg"
        alt=""
        width={1600}
        height={1000}
        loading="lazy"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#221248]/95 via-[#221248]/70 to-[#08051A]/95" />
      <Container>
        <Heading id="parents-help-title" question={copy.questions.help} headline={copy.help.headline} light />
        <p className="mt-4 max-w-[52ch] text-lg text-[#F5EEE6]/75">{copy.help.intro}</p>
        <ul className="mt-14 grid gap-5 md:grid-cols-2">
          {copy.help.points.map((point, i) => (
            <FadeIn key={point.title} delay={i * 0.06}>
              <li
                className={`list-none rounded-[26px] p-6 backdrop-blur-md sm:p-7 ${
                  i % 2 === 0
                    ? "rounded-es-[6px] bg-white/[0.08] ring-1 ring-white/15"
                    : "rounded-ee-[6px] bg-[#F5EEE6] text-[#14101F] md:translate-y-10"
                }`}
              >
                <Reveal title={point.title} body={point.body} dark={i % 2 === 0} big />
              </li>
            </FadeIn>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Privacy and safety: eight promises on the night, each a short line that opens. */
function Privacy({ copy }: { copy: ParentsCopy }) {
  return (
    <section id="parents-privacy" aria-labelledby="parents-privacy-title" className="bg-[#08051A] pb-24 pt-20 text-[#F5EEE6] md:pb-32">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading id="parents-privacy-title" question={copy.questions.privacy} headline={copy.privacy.headline} light />
          <ShieldCheck aria-hidden="true" className="hidden size-20 text-[#F4C660]/80 md:block" strokeWidth={1.2} />
        </div>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[26px] bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {copy.privacy.points.map((point, i) => {
            const [title, rest] = lead(point);
            const Icon = PRIVACY_ICONS[i] ?? ShieldCheck;
            return (
              <li key={point} className="flex flex-col gap-4 bg-[#100A24] p-6">
                <Icon aria-hidden="true" className="size-6 text-[#F4C660]" strokeWidth={1.6} />
                {rest ? <Reveal title={title} body={rest} dark /> : <p className="font-heading text-lg font-semibold leading-snug">{title}</p>}
              </li>
            );
          })}
        </ul>
        <Link
          href="/privacy-policy"
          className="mt-8 inline-flex font-semibold text-[#F4C660] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4C660]"
        >
          {copy.privacy.link}
        </Link>
      </Container>
    </section>
  );
}

/** The price as a ticket: one payment, what it includes, torn at the fold. */
function Price({ copy }: { copy: ParentsCopy }) {
  const offer = getReportOffer();
  const full = Math.round(offer.listAmountMinor / 100);
  const now = Math.round(offer.amountMinor / 100);
  const notch = "radial-gradient(circle at 0 50%, transparent 16px, #000 17px)";
  return (
    <section id="parents-price" aria-labelledby="parents-price-title" className="py-24 md:py-32">
      <Container>
        <Heading id="parents-price-title" question={copy.questions.price} headline={copy.price.headline} />
        <div className="mt-12 grid overflow-hidden rounded-[30px] shadow-[0_40px_80px_-40px_rgba(34,18,72,0.5)] md:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex flex-col justify-center gap-3 bg-[#221248] p-8 text-[#F5EEE6] sm:p-10">
            <span className="text-lg text-[#F5EEE6]/50 line-through">{copy.price.full(full)}</span>
            <span className="font-heading text-6xl font-bold tracking-[-0.03em] text-[#F4C660] sm:text-7xl">{copy.price.now(now)}</span>
            <span className="text-sm text-[#F5EEE6]/70">{copy.price.under}</span>
          </div>
          <div
            className="relative bg-[#FFFCF6] p-8 sm:p-10"
            style={{ WebkitMaskImage: notch, maskImage: notch }}
          >
            <span aria-hidden="true" className="absolute inset-y-6 start-0 hidden border-s-2 border-dashed border-[#221248]/15 md:block" />
            <h3 className="font-heading text-xl font-semibold">{copy.price.includedTitle}</h3>
            <ul className="mt-5 grid gap-4">
              {copy.price.included.map((item, i) => (
                <li key={item} className="grid grid-cols-[2rem_1fr] items-start gap-3 leading-relaxed text-[var(--day-ink-2)]">
                  <span className="grid size-8 place-items-center rounded-full bg-[#EEEBF6] font-heading text-sm font-semibold text-[#4B3D82]">
                    {i + 1}
                  </span>
                  <span className="pt-1">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[var(--day-ink-3)]">{copy.price.note}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * For parents. Approved wording (28 Oct update, Part B, with the 29 Oct
 * corrections), told around the questions a parent arrives with: the evening
 * at home, why it matters, how it happens (a WhatsApp thread), what the
 * report shows, how to help, safety, price.
 */
export const Parents = () => {
  const { locale, t } = useLocale();
  const copy = PARENTS_COPY[locale];

  return (
    <div className="bg-[color:var(--day-bg)] text-[color:var(--day-ink)]">
      <main>
        <Opening copy={copy} message={t("parents.send_child.message")} />
        <Why copy={copy} />
        <ChatStory copy={copy} />
        <Report copy={copy} />
        <Help copy={copy} />
        <Privacy copy={copy} />
        <Price copy={copy} />

        <section aria-labelledby="parents-closing" className="relative isolate overflow-hidden bg-[#08051A] py-28 text-[#F5EEE6] md:py-36">
          <div aria-hidden="true" className="absolute -top-56 start-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,198,96,0.22),transparent_65%)]" />
          <Container className="flex flex-col items-center gap-8 text-center">
            <h2 id="parents-closing" className="max-w-[20ch] font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
              {copy.closing.headline}
            </h2>
            <div className="flex flex-col items-center gap-3">
              <SendToChildButton className={CTA} placement="parents-closing" />
              <p className="text-sm text-[#F5EEE6]/60">{copy.closing.underCta}</p>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
};
