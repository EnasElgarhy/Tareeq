"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";
import { ShootingStars } from "@/components/brand/ShootingStars";
import { Container, GradientText } from "./Shared";
import { ClosingJourney } from "./ClosingJourney";
import {
  CoreGlanceVisual,
  CareerOptionsVisual,
  KaiCoachVisual,
  MeaningVisual,
} from "./StoryVisuals";

interface Step {
  label: StringKey;
  title: StringKey;
  body: StringKey;
  /** A short line under the body (steps 2 and 4). */
  note?: StringKey;
  visual: ReactNode;
  /** Soft glow behind the card, one temperature per step. */
  glow: string;
}

const STEPS: readonly Step[] = [
  {
    label: "marketing.card1.eyebrow",
    title: "marketing.card1.headline",
    body: "marketing.card1.body",
    visual: <CoreGlanceVisual />,
    glow: "rgba(244,198,96,0.14)",
  },
  {
    label: "marketing.card2.eyebrow",
    title: "marketing.card2.headline",
    body: "marketing.card2.body",
    note: "marketing.card2.note",
    visual: <MeaningVisual />,
    glow: "rgba(157,127,240,0.16)",
  },
  {
    label: "marketing.card3.eyebrow",
    title: "marketing.card3.headline",
    body: "marketing.card3.body",
    visual: <CareerOptionsVisual />,
    glow: "rgba(242,168,179,0.14)",
  },
  {
    label: "marketing.card4.eyebrow",
    title: "marketing.card4.headline",
    body: "marketing.card4.body",
    note: "marketing.card4.note",
    visual: <KaiCoachVisual />,
    glow: "rgba(244,198,96,0.12)",
  },
];

const stepId = (i: number) => `results-step-${i + 1}`;

/**
 * "More than a score" in the pinned-index pattern: a numbered list of what the
 * result gives you stays beside a column of product cards, and whichever card
 * is in view marks its step active. Clicking a step scrolls to its card.
 */
export function ResultsStory() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);

  return (
    <section
      aria-labelledby="results-story-heading"
      className="relative isolate bg-[#08051A] pt-20 text-[#F5EEE6] md:pt-28"
    >
      <ShootingStars />
      <Container>
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="results-story-heading"
            className="font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl"
          >
            {t("marketing.results.heading1")}{" "}
            <GradientText tone="night">
              {t("marketing.results.heading2")}
            </GradientText>
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-relaxed text-[#F5EEE6]/70">
            {t("marketing.results.subtitle")}
          </p>
        </header>

        <div className="mx-auto mt-14 grid max-w-[1200px] gap-10 md:mt-20 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <StepIndex active={active} />
          <div className="grid gap-16 lg:gap-24">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.label}
                step={step}
                index={i}
                onActive={setActive}
              />
            ))}
          </div>
        </div>
      </Container>

      <ClosingJourney />
    </section>
  );
}

/** Desktop-only pinned index. The active step expands; the rest stay as muted titles. */
const StepIndex = ({ active }: { active: number }) => {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  const goTo = (i: number) => {
    document.getElementById(stepId(i))?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <nav
      aria-label={t("marketing.results.eyebrow")}
      className="hidden lg:block"
    >
      <ol className="sticky top-28 grid gap-2">
        {STEPS.map((step, i) => {
          const isActive = i === active;
          return (
            <li key={step.label} className="relative">
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 -start-5 w-[2px] rounded-full bg-[#F4C660] transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={isActive ? "step" : undefined}
                className="group block w-full rounded-lg py-3 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
              >
                <span className="block font-mono text-[11px] tabular-nums text-[#C8B6F0]/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`mt-1 block font-heading text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.015em] transition-colors duration-300 ${
                    isActive
                      ? "text-[#F5EEE6]"
                      : "text-[#F5EEE6]/35 group-hover:text-[#F5EEE6]/60"
                  }`}
                >
                  {t(step.title)}
                </span>
                <span
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isActive
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <span className="overflow-hidden">
                    <span className="block max-w-[38ch] pt-3 text-[15px] leading-relaxed text-[#F5EEE6]/70">
                      {t(step.body)}
                    </span>
                    {step.note ? (
                      <span className="block max-w-[38ch] pt-2 text-[13px] text-[#C8B6F0]/80">{t(step.note)}</span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

interface StepCardProps {
  step: Step;
  index: number;
  onActive: (i: number) => void;
}

/** One product card, shown as-is. Reports itself active when it crosses the middle of the viewport. */
const StepCard = ({ step, index, onActive }: StepCardProps) => {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div id={stepId(index)} ref={ref} className="scroll-mt-28">
      {/* Mobile: the step's copy sits above its card. */}
      <div className="mb-8 lg:hidden">
        <span className="font-mono text-[11px] tabular-nums text-[#C8B6F0]/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-1 font-heading text-[1.6rem] font-semibold leading-tight">
          {t(step.title)}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#F5EEE6]/70">
          {t(step.body)}
        </p>
        {step.note ? <p className="mt-2 text-[13px] text-[#C8B6F0]/80">{t(step.note)}</p> : null}
      </div>

      <div className="relative flex min-h-[420px] items-center justify-center lg:min-h-[520px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[10%] inset-y-[15%] rounded-full blur-3xl"
          style={{ background: step.glow }}
        />
        <div className="relative flex w-full flex-col items-center gap-3">
          {/* Every preview is marked as an example (28 Oct update, Part B). */}
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11.5px] font-semibold text-[#F5EEE6]/80">
            {t("marketing.results.example")}
          </span>
          {step.visual}
        </div>
      </div>
    </div>
  );
};
