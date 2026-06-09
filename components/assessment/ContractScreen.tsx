"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  ClusterIcon,
  HeartIcon,
  LensIcon,
  PathIcon,
  PulseIcon,
  VibeIcon,
} from "@/components/brand/ContractIcons";
import {
  defaultVoiceOnForAssessmentStart,
  uiSounds,
} from "@/lib/audio/ui-sounds";
import { getQuestionPath } from "@/lib/assessment/questions";

interface ContractIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

interface ContractItem {
  Icon: ComponentType<ContractIconProps>;
  title: string;
  body: string;
}

/**
 * Six promises. Read like a quiet vow, not a checklist.
 * Each entry pairs one of the warm-gradient ContractIcons with a
 * single intention — what this assessment is, and what it isn't.
 */
const ITEMS: ReadonlyArray<ContractItem> = [
  {
    Icon: VibeIcon,
    title: "Energy over achievement",
    body: "Not what you’re good at in school — what makes time disappear.",
  },
  {
    Icon: LensIcon,
    title: "Curiosity, not distraction",
    body: "Pick what ignites a question, not what steals an hour of scrolling.",
  },
  {
    Icon: HeartIcon,
    title: "No wrong answers",
    body: "Choosing “gaming” over “studying” tells us how your mind solves.",
  },
  {
    Icon: PulseIcon,
    title: "Intent beneath the habit",
    body: "We listen to the why behind your scroll, not the scroll itself.",
  },
  {
    Icon: ClusterIcon,
    title: "A cluster, not a job title",
    body: "You won’t get “Accountant.” You’ll get a world where people like you thrive.",
  },
  {
    Icon: PathIcon,
    title: "A compass, not a GPS",
    body: "We point the direction. The destination stays yours.",
  },
];

// Stagger choreography (ms)
const ITEM_START_DELAY = 380;
const ITEM_STEP = 180;
const ITEM_DURATION = 720;
// CTA appears the moment the last item finishes settling
const CTA_REVEAL_DELAY =
  ITEM_START_DELAY + (ITEMS.length - 1) * ITEM_STEP + ITEM_DURATION - 120;

export function ContractScreen() {
  const router = useRouter();
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCtaReady(true), CTA_REVEAL_DELAY);
    return () => window.clearTimeout(t);
  }, []);

  function start() {
    if (!ctaReady) return;
    defaultVoiceOnForAssessmentStart();
    uiSounds.advance();
    router.push(getQuestionPath(0));
  }

  return (
    <section
      aria-labelledby="contract-heading"
      className="anim-screen-enter flex flex-1 flex-col gap-3"
    >
      <span className="anim-eyebrow-fade-up chip chip--violet-on-dark w-fit">
        <span className="size-1.5 rounded-full bg-gold" />
        Before we begin
      </span>

      <h1 id="contract-heading" className="text-display-2 text-sand max-w-[14ch]">
        A quiet{" "}
        <span
          className="text-grad-warm"
          style={{
            fontStyle: "italic",
            fontVariationSettings: '"SOFT" 100, "opsz" 144',
          }}
        >
          contract
        </span>
        .
      </h1>

      <p className="text-body-sm text-sand/65 leading-snug max-w-[34ch]">
        Six small promises between us before the first question.
      </p>

      <ol className="mt-1 flex flex-col gap-2.5">
        {ITEMS.map((item, i) => {
          const Icon = item.Icon;
          return (
            <li
              key={item.title}
              className="anim-contract-item glass-card relative flex items-center gap-3.5 !p-3 !pe-4 !rounded-2xl"
              style={{ animationDelay: `${ITEM_START_DELAY + i * ITEM_STEP}ms` }}
            >
              <span
                aria-hidden="true"
                className="glass-tile relative grid size-11 shrink-0 place-items-center rounded-xl"
              >
                <Icon size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className="text-[12px] tabular-nums text-sand/35 leading-none"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontVariationSettings: '"SOFT" 60, "opsz" 96',
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[15px] font-semibold text-sand leading-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-1 text-[13.5px] leading-snug text-sand/65">
                  {item.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex-1" />

      <button
        type="button"
        onClick={start}
        disabled={!ctaReady}
        aria-hidden={!ctaReady}
        className="btn-v2 btn-v2--primary w-full transition-[opacity,transform] duration-500 ease-out"
        data-size="lg"
        style={{
          opacity: ctaReady ? 1 : 0,
          transform: ctaReady ? "translateY(0)" : "translateY(12px)",
          pointerEvents: ctaReady ? "auto" : "none",
        }}
      >
        I agree, begin
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}
