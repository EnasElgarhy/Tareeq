"use client";

import { useRouter } from "next/navigation";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { getQuestionPath } from "@/lib/assessment/questions";

interface ContractItem {
  icon: string;
  tone: "violet" | "gold" | "blush" | "mint" | "lilac" | "soft";
  title: string;
  body: string;
}

const ITEMS: ReadonlyArray<ContractItem> = [
  {
    icon: "✦",
    tone: "violet",
    title: "The “Vibe” Check",
    body: "This isn’t about what you’re “good” at in school. It’s about what makes time fly by for you.",
  },
  {
    icon: "◐",
    tone: "gold",
    title: "Non-entertainment focus",
    body: "Answer for what ignites your curiosity — not what just grabs your attention for doom-scrolling.",
  },
  {
    icon: "✓",
    tone: "blush",
    title: "The “No-Wrong-Answer” rule",
    body: "Picking “Gaming” over “Studying” doesn’t make you lazy — it tells us how your brain solves problems.",
  },
  {
    icon: "↗",
    tone: "mint",
    title: "Intent over output",
    body: "These questions focus on intent — the why and how behind your daily and digital habits.",
  },
  {
    icon: "◯",
    tone: "lilac",
    title: "A Cluster, not a job title",
    body: "You won’t get “Accountant.” You’ll get a Career Cluster — a world where people like you thrive.",
  },
  {
    icon: "→",
    tone: "soft",
    title: "A Compass, not a GPS",
    body: "We point the direction. You still get to choose the destination.",
  },
];

const TONE_STYLES: Record<ContractItem["tone"], { bg: string; fg: string }> = {
  violet: { bg: "bg-violet", fg: "text-sand" },
  gold: { bg: "bg-gold", fg: "text-carbon" },
  blush: { bg: "bg-blush", fg: "text-carbon" },
  mint: { bg: "bg-mint", fg: "text-carbon" },
  lilac: { bg: "bg-lilac", fg: "text-carbon" },
  soft: { bg: "bg-gold-soft", fg: "text-carbon" },
};

export function ContractScreen() {
  const router = useRouter();

  function start() {
    uiSounds.advance();
    router.push(getQuestionPath(0));
  }

  return (
    <section
      aria-labelledby="contract-heading"
      className="anim-screen-enter flex flex-1 flex-col gap-7 pb-4"
    >
      <span className="anim-eyebrow-fade-up chip chip--violet-on-dark w-fit">
        <span className="size-1.5 rounded-full bg-gold" />
        Before we start
      </span>

      <h1 id="contract-heading" className="text-hero text-sand">
        The CORE{" "}
        <span
          className="text-gold"
          style={{
            fontStyle: "italic",
            fontVariationSettings: '"SOFT" 100, "opsz" 144',
          }}
        >
          Contract of Honesty
        </span>
        .
      </h1>

      <ol className="flex flex-col gap-3.5">
        {ITEMS.map((item, i) => {
          const tone = TONE_STYLES[item.tone];
          return (
            <li
              key={item.title}
              className="anim-option-in card-night flex items-start gap-4 !p-4"
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              <span
                aria-hidden="true"
                className={[
                  "grid size-12 shrink-0 place-items-center rounded-2xl text-[20px] font-bold",
                  tone.bg,
                  tone.fg,
                ].join(" ")}
                style={{
                  fontFamily: "var(--font-display)",
                  fontVariationSettings: '"SOFT" 100, "opsz" 96',
                }}
              >
                {item.icon}
              </span>
              <div className="pt-0.5">
                <h3 className="text-h3 text-sand">{item.title}</h3>
                <p className="mt-1 text-body-sm leading-snug text-sand/68">
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
        className="btn-v2 btn-v2--primary w-full"
        data-size="lg"
      >
        I&rsquo;m ready
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
