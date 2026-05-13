"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  TareeqArrowRight,
  TareeqCheck,
  TareeqCompass,
  TareeqSparkle,
  TareeqUsers,
} from "@/components/brand/icons";
import { Button } from "@/components/primitives/Button";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { getQuestionPath } from "@/lib/assessment/questions";

/**
 * ContractScreen — "The CORE Contract of Honesty".
 *
 * Editorial list: six color-coded icon tiles, bold title, short body.
 * The colors rotate through the brand palette so the list reads with
 * rhythm. Single primary "I'm ready" CTA hands off to /q/0.
 */

interface ContractItem {
  icon: ReactNode;
  /** Tile background color class */
  tileClass: string;
  /** Color used for the optional cyan dot signature on the tile */
  showAccent: boolean;
  title: string;
  body: string;
}

const ITEMS: ReadonlyArray<ContractItem> = [
  {
    icon: <TareeqSparkle size={18} showAccent={false} />,
    tileClass: "bg-coral text-cream",
    showAccent: true,
    title: "The “Vibe” Check",
    body: "This isn’t about what you’re “good” at in school. It’s about what makes time fly by for you.",
  },
  {
    icon: <TareeqCompass size={18} showAccent={false} />,
    tileClass: "bg-cyan-brand text-plum-deep",
    showAccent: false,
    title: "Non-entertainment focus",
    body: "Answer for what ignites your curiosity — not what just grabs your attention for doom-scrolling.",
  },
  {
    icon: <TareeqCheck size={18} showAccent={false} />,
    tileClass: "bg-lavender text-plum-deep",
    showAccent: true,
    title: "The “No-Wrong-Answer” rule",
    body: "Picking “Gaming” over “Studying” doesn’t make you lazy — it tells us how your brain solves problems.",
  },
  {
    icon: <TareeqCompass size={18} showAccent={false} />,
    tileClass: "bg-[color:var(--coral-glow)] text-plum-deep",
    showAccent: true,
    title: "Intent over output",
    body: "These questions focus on intent — the why and how behind your daily and digital habits.",
  },
  {
    icon: <TareeqUsers size={18} showAccent={false} />,
    tileClass: "bg-[color:var(--mauve)] text-cream",
    showAccent: true,
    title: "A Cluster, not a job title",
    body: "You won’t get “Accountant.” You’ll get a Career Cluster — a world where people like you thrive.",
  },
  {
    icon: <TareeqArrowRight size={18} showAccent={false} />,
    tileClass: "bg-[color:var(--lavender-mist)] text-plum-deep",
    showAccent: true,
    title: "A Compass, not a GPS",
    body: "We point the direction. You still get to choose the destination.",
  },
];

export function ContractScreen() {
  const router = useRouter();

  function start() {
    uiSounds.advance();
    router.push(getQuestionPath(0));
  }

  return (
    <section
      aria-labelledby="contract-heading"
      className="anim-screen-enter flex flex-1 flex-col gap-6 pb-4 pt-2"
    >
      <header className="flex flex-col gap-2">
        <p className="text-caption text-cream/55">Before we start</p>
        <h1
          id="contract-heading"
          className="max-w-[18ch] text-[clamp(1.75rem,1.1rem+2.6vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.018em] text-cream"
        >
          The CORE{" "}
          <span
            className="text-grad-warm"
            style={{
              fontFamily: "var(--font-display-italic), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Contract of Honesty
          </span>
        </h1>
      </header>

      <ol className="flex flex-col gap-3.5">
        {ITEMS.map((item, i) => (
          <li
            key={item.title}
            className="anim-option-in relative grid grid-cols-[44px_1fr] items-start gap-3.5"
            style={{ animationDelay: `${120 + i * 70}ms` }}
          >
            <div
              aria-hidden="true"
              className={[
                "relative grid size-11 shrink-0 place-items-center rounded-xl shadow-[0_6px_14px_rgba(15,8,36,0.45)] ring-1 ring-white/15",
                item.tileClass,
              ].join(" ")}
            >
              {item.icon}
              {item.showAccent ? (
                <span
                  aria-hidden="true"
                  className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-cyan-brand shadow-[0_0_8px_rgba(91,214,232,0.7)]"
                />
              ) : null}
            </div>
            <div className="pt-0.5">
              <h3 className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-cream">
                {item.title}
              </h3>
              <p className="mt-1 text-[13.5px] leading-snug text-cream/68">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex-1" />

      <Button
        variant="primary"
        size="xl"
        fullWidth
        onClick={start}
        iconRight={<TareeqArrowRight size={20} />}
      >
        I&rsquo;m ready
      </Button>
    </section>
  );
}
