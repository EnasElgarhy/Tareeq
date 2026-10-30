"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container } from "../Shared";
import { PhoneScreen } from "./PhoneScreen";
import { Popouts } from "./Popouts";
import { STEP_COUNT, STORY_STEPS } from "./story-data";

const stepOf = (p: number) => Math.min(STEP_COUNT - 1, Math.max(0, Math.floor(p * STEP_COUNT)));

/**
 * The report, told on one phone. The section pins while the reader scrolls
 * through four steps: the phone's screen scrolls the real example report
 * (then fills in a Kai chat), pieces of the report pop out around it, and
 * the step copy changes beside it. Reduced motion gets a plain list.
 */
export function ReportStory() {
  const reduce = useReducedMotion();
  return reduce ? <StaticStory /> : <PinnedStory />;
}

function PinnedStory() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = stepOf(p);
    setActive((cur) => (cur === next ? cur : next));
  });
  const local = useTransform(scrollYProgress, (p) => Math.min(1, Math.max(0, p * STEP_COUNT - stepOf(p))));

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (span * (i + 0.05)) / STEP_COUNT, behavior: "smooth" });
  };

  return (
    <div ref={track} className="relative" style={{ height: `${STEP_COUNT * 110}svh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <Container className="w-full">
          <div className="grid h-[100svh] grid-rows-[1fr_auto] items-center gap-3 pb-28 pt-6 lg:h-auto lg:grid-cols-[0.85fr_1.15fr] lg:grid-rows-1 lg:gap-12 lg:pb-24 lg:pt-6">
            <div className="order-2 lg:order-1">
              <StepList active={active} onGo={goTo} />
              <MobileCaption active={active} />
            </div>
            <div className="order-1 flex justify-center lg:order-2">
              <Stage active={active}>
                <PhoneScreen active={active} local={local} />
              </Stage>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

/** The phone, its "Example report" label, a glow, and the pop-outs around it. */
function Stage({ active, children }: { active: number; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11.5px] font-semibold text-[#F5EEE6]/80">
        {t("marketing.results.example")}
      </span>
      <div className="relative aspect-[300/620] h-[min(46svh,420px)] lg:h-[min(66svh,580px)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-16 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(244,198,96,0.22), rgba(157,127,240,0.18), transparent)" }}
        />
        <div className="relative h-full w-full rounded-[44px] bg-[#1C1436] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_40px_80px_-30px_rgba(0,0,0,0.8)]">
          {children}
        </div>
        <Popouts active={active} />
      </div>
    </div>
  );
}

/** Desktop: the four steps, the active one open. Clicking a step scrolls to it. */
function StepList({ active, onGo }: { active: number; onGo: (i: number) => void }) {
  const { t } = useLocale();
  return (
    <ol className="hidden gap-2 lg:grid">
      {STORY_STEPS.map((step, i) => {
        const isActive = i === active;
        return (
          <li key={step.title} className="relative">
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 -start-5 w-[2px] rounded-full bg-[#F4C660] transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
            />
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-current={isActive ? "step" : undefined}
              className="group block w-full rounded-lg py-3 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
            >
              <span className="block font-mono text-[11px] tabular-nums text-[#C8B6F0]/70">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={`mt-1 block font-heading text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.015em] transition-colors duration-300 ${
                  isActive ? "text-[#F5EEE6]" : "text-[#F5EEE6]/35 group-hover:text-[#F5EEE6]/60"
                }`}
              >
                {t(step.title)}
              </span>
              <span
                className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <span className="overflow-hidden">
                  <span className="block max-w-[38ch] pt-3 text-[15px] leading-relaxed text-[#F5EEE6]/70">{t(step.body)}</span>
                  {step.note ? <span className="block max-w-[38ch] pt-2 text-[13px] text-[#C8B6F0]/80">{t(step.note)}</span> : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Phones and tablets: the active step's copy under the phone, with progress dots. */
function MobileCaption({ active }: { active: number }) {
  const { t } = useLocale();
  const step = STORY_STEPS[active];
  return (
    <div className="lg:hidden">
      <div className="mb-3 flex justify-center gap-1.5" aria-hidden="true">
        {STORY_STEPS.map((s, i) => (
          <span key={s.title} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-[#F4C660]" : "w-1.5 bg-white/25"}`} />
        ))}
      </div>
      <div className="relative min-h-[120px]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h3 className="font-heading text-[1.35rem] font-semibold leading-tight">{t(step.title)}</h3>
            <p className="mx-auto mt-2 max-w-[40ch] text-[14px] leading-relaxed text-[#F5EEE6]/70">{t(step.body)}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Reduced motion: each step's copy beside a still phone at the top of its screen. */
function StaticStory() {
  const { t } = useLocale();
  const still = useMotionValue(0);
  return (
    <Container>
      <ol className="mx-auto grid max-w-[1000px] gap-16 py-8">
        {STORY_STEPS.map((step, i) => (
          <li key={step.title} className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="block font-mono text-[11px] tabular-nums text-[#C8B6F0]/70">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-1 font-heading text-[1.6rem] font-semibold leading-tight">{t(step.title)}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#F5EEE6]/70">{t(step.body)}</p>
              {step.note ? <p className="mt-2 text-[13px] text-[#C8B6F0]/80">{t(step.note)}</p> : null}
            </div>
            <div className="flex justify-center">
              <div className="aspect-[300/620] h-[460px] rounded-[44px] bg-[#1C1436] p-2">
                <PhoneScreen active={i} local={still} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Container>
  );
}
