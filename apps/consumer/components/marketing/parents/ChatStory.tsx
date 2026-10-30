"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { coreWording } from "@/lib/core-v2/content/core-content";
import { getReportOffer } from "@/lib/payments/report-access";
import { Container } from "../Shared";
import { EXAMPLE } from "../report-story/story-data";
import type { ParentsCopy } from "./parentsCopy";

/**
 * "How it works", told the way it happens for most families here: in one
 * WhatsApp conversation between a parent and their child. The section pins
 * while the reader scrolls; each step adds its messages to the thread. Every
 * line in the thread is real product text.
 */

const CHILD = { en: "Sara", ar: "سارة" } as const;
const TIMES = ["7:02", "7:31", "7:40", "8:15"] as const;
/** WhatsApp's own label on a forwarded message. */
const FORWARDED = { en: "Forwarded", ar: "تمت إعادة توجيهها" } as const;
const KAI = { en: "Kai", ar: "كاي" } as const;

function Ticks() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 11" className="inline size-3.5 text-[#53BDEB]">
      <path d="M1 6l3 3 6-7M6 9l1 1 7-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bubble({ from, time, children }: { from: "parent" | "child"; time: string; children: ReactNode }) {
  const mine = from === "parent";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={`max-w-[84%] rounded-[14px] px-2.5 pb-1.5 pt-2 text-[12.5px] leading-snug shadow-[0_1px_1px_rgba(0,0,0,0.12)] ${
        mine ? "ms-auto rounded-se-[4px] bg-[#D9FDD3] text-[#111B21]" : "me-auto rounded-ss-[4px] bg-white text-[#111B21]"
      }`}
    >
      {children}
      <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-[#667781]" dir="ltr">
        {time}
        {mine ? <Ticks /> : null}
      </span>
    </motion.div>
  );
}

function LinkCard({ title, line, children }: { title: string; line?: string; children?: ReactNode }) {
  return (
    <span className="mb-1.5 block overflow-hidden rounded-[10px] bg-black/[0.05]">
      <span className="block h-14 bg-gradient-to-br from-[#221248] via-[#3B2A7A] to-[#F4C660]/70" />
      <span className="block px-2.5 py-2">
        <span className="block font-semibold">{title}</span>
        {line ? (
          <span className="block text-[11px] text-[#667781]" dir="ltr">
            {line}
          </span>
        ) : null}
        {children}
      </span>
    </span>
  );
}

/** The messages each step adds, in order. Steps build on each other. */
function useThread(): ReactNode[][] {
  const { locale, t } = useLocale();
  const w = (id: string) => coreWording(locale, id) ?? "";
  const offer = getReportOffer();
  const price = locale === "ar" ? `${Math.round(offer.amountMinor / 100)} درهمًا` : `${Math.round(offer.amountMinor / 100)} AED`;
  return [
    [
      <Bubble key="invite" from="parent" time={TIMES[0]}>
        <LinkCard title="Map My CORE" line="mapmycore.com" />
        {t("parents.send_child.message")}
      </Bubble>,
    ],
    [
      <Bubble key="ask" from="child" time={TIMES[1]}>
        <LinkCard title={t("pay.title")} line="mapmycore.com/pay">
          <span className="mt-2 block rounded-full bg-[#F4C660] py-1 text-center text-[11.5px] font-bold text-[#14101F]">{price}</span>
        </LinkCard>
        {t(locale === "ar" ? "unlock.ask.message.ar" : "unlock.ask.message.en")}
      </Bubble>,
    ],
    [
      <motion.p
        key="paid"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto rounded-full bg-[#FFF3C4] px-3 py-1 text-center text-[11px] font-semibold text-[#54656F]"
      >
        {t("pay.paid.title")}
      </motion.p>,
      <Bubble key="report" from="child" time={TIMES[2]}>
        <span className="mb-1.5 block rounded-[10px] bg-[#221248] p-2.5 text-[#F5EEE6]">
          <span className="block text-[10px] text-[#F4C660]">{w("S4-CLOSEST")}</span>
          <span className="mt-0.5 block font-semibold">{EXAMPLE.job[locale]}</span>
          <span className="mt-1.5 flex flex-wrap gap-1">
            {EXAMPLE.study[locale].slice(0, 3).map((field) => (
              <span key={field} className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                {field}
              </span>
            ))}
          </span>
        </span>
        {w("CUR-RD-NAME")} · {w("CUR-PW-NAME")}
      </Bubble>,
    ],
    [
      // Sara forwards Kai's question from the app, with her own answer: how
      // a report conversation actually reaches a parent on WhatsApp.
      <Bubble key="kai" from="child" time={TIMES[3]}>
        <span className="mb-1 flex items-center gap-1 text-[10.5px] italic text-[#667781]">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 rtl:-scale-x-100">
            <path d="M9 3l5 5-5 5M14 8H6a4 4 0 0 0-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {FORWARDED[locale]}
        </span>
        <span className="mb-1.5 block rounded-[12px] bg-[#221248] p-2.5 text-[#F5EEE6]">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kai/avatar/kai-avatar-talk.webp" alt="" width={24} height={24} className="rounded-full ring-2 ring-[#F4C660]" />
            <span className="text-[11px] font-semibold">
              {KAI[locale]} <span className="font-normal text-[#C8B6F0]">{t("core.kai.asks")}</span>
            </span>
          </span>
          <span className="mt-2 block text-[12.5px] font-semibold leading-snug">{w("S3-KAI-Q")}</span>
          <span className="mt-2 flex flex-wrap gap-1">
            <span className="rounded-full bg-[#F4C660] px-2 py-0.5 text-[10px] font-semibold text-[#14101F]">{w("CUR-RD-NAME")}</span>
            <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px]">{w("CUR-PW-NAME")}</span>
          </span>
        </span>
        {EXAMPLE.reply[locale]}
      </Bubble>,
    ],
  ];
}

function PhoneThread({ upTo }: { upTo: number }) {
  const { locale } = useLocale();
  const thread = useThread();
  const shown = thread.slice(0, upTo + 1).flat();
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[40px] border-[9px] border-[#14101F] bg-[#EFE7DE] shadow-[0_50px_100px_-40px_rgba(8,5,26,0.85)]">
      <div className="relative z-10 flex shrink-0 items-center gap-2.5 bg-[#075E54] px-3 pb-2.5 pt-5 text-white">
        <span className="grid size-8 place-items-center rounded-full bg-[#F2A8B3] text-[13px] font-bold text-[#14101F]">
          {CHILD[locale].slice(0, 1)}
        </span>
        <span className="text-[13.5px] font-semibold">{CHILD[locale]}</span>
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden px-3 pb-5 pt-3"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      >
        <AnimatePresence initial={false}>{shown}</AnimatePresence>
      </div>
    </div>
  );
}

function StepList({ copy, active, onlyActive = false }: { copy: ParentsCopy; active: number; onlyActive?: boolean }) {
  return (
    <ol className="grid gap-1">
      {copy.how.steps.map((step, i) => {
        const isActive = i === active;
        if (onlyActive && !isActive) return null;
        return (
          <li key={step.title} className="relative ps-14">
            <span
              className={`absolute start-0 top-1 grid size-10 place-items-center rounded-full font-heading text-base font-semibold transition-colors duration-300 ${
                isActive ? "bg-[#F4C660] text-[#14101F]" : "bg-white/[0.06] text-[#F5EEE6]/50"
              }`}
            >
              {i + 1}
            </span>
            <h3
              className={`font-heading text-2xl font-semibold leading-snug transition-colors duration-300 sm:text-[1.7rem] ${
                isActive ? "text-[#F5EEE6]" : "text-[#F5EEE6]/30"
              }`}
            >
              {step.title}
            </h3>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <p className="overflow-hidden pb-6 pt-2 text-[15.5px] leading-relaxed text-[#F5EEE6]/70">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ChatStory({ copy }: { copy: ParentsCopy }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const count = copy.how.steps.length;
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(p * count)));
    setActive((cur) => (cur === next ? cur : next));
  });

  const heading = (
    <div>
      <p className="text-[15px] font-semibold text-[#C8B6F0]">{copy.questions.how}</p>
      <h2 id="parents-how-title" className="mt-2 font-heading text-4xl font-semibold tracking-[-0.02em] text-[#F5EEE6] sm:text-5xl">
        {copy.how.headline}
      </h2>
    </div>
  );

  if (reduce) {
    return (
      <section id="parents-how" aria-labelledby="parents-how-title" className="bg-[#08051A] py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid gap-10">
            {heading}
            <StepList copy={copy} active={-1} />
          </div>
          <div className="mx-auto h-[640px] w-[320px]">
            <PhoneThread upTo={count - 1} />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="parents-how" aria-labelledby="parents-how-title" className="bg-[#08051A]">
      <div ref={track} className="relative" style={{ height: `${count * 90}svh` }}>
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-40 start-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,198,96,0.16),rgba(109,91,168,0.14)_45%,transparent_70%)]"
          />
          <Container className="relative grid w-full items-center gap-6 lg:grid-cols-[1fr_auto] lg:gap-20">
            <div className="order-2 grid gap-8 lg:order-1 lg:gap-10">
              <div className="hidden lg:block">{heading}</div>
              <div className="hidden lg:block">
                <StepList copy={copy} active={active} />
              </div>
              <div className="lg:hidden">
                <StepList copy={copy} active={active} onlyActive />
              </div>
            </div>
            <div className="order-1 mx-auto h-[min(52svh,440px)] w-[min(54vw,220px)] lg:order-2 lg:h-[min(78svh,660px)] lg:w-[330px]">
              <PhoneThread upTo={active} />
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
