"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TareeqArrowRight, TareeqSparkle } from "@/components/brand/icons";
import { Kai } from "@/components/brand/Kai";
import { KaiAura } from "@/components/brand/KaiAura";
import { Button } from "@/components/primitives/Button";
import { Typewriter } from "@/components/primitives/Typewriter";
import { uiSounds } from "@/lib/audio/ui-sounds";

const INTRO_SCRIPT =
  "Hey! I’m Kai. Think of me as a filter for all the noise. We’re looking for your Energy Flows — the stuff that actually makes you lose track of time.\n\nThis isn’t a school test. There are no wrong answers. Don’t pick what looks “good” — pick what you would actually do.";

/**
 * Choreographed timing (ms):
 *
 *   0      page enters
 *   80     aura blooms in + starts rotating
 *   320    Kai pops in with overshoot
 *   620    eyebrow "MEET YOUR GUIDE" fades up
 *   900    typewriter starts + accent line begins growing
 *   ~4900  typewriter completes → CTA springs up
 *
 * Atmospheric particles drift around the aura with their own clocks
 * once they fade in (staggered 200–800ms after mount).
 */
export function IntroScreen() {
  const router = useRouter();
  const [typingDone, setTypingDone] = useState(false);

  // Soft entrance whoosh on mount — matches the "screen change" pattern
  useEffect(() => {
    uiSounds.transition();
  }, []);

  function next() {
    uiSounds.advance();
    router.push("/contract");
  }

  return (
    <section
      aria-labelledby="intro-text"
      className="anim-screen-enter relative flex flex-1 flex-col gap-7 pb-4 pt-4"
    >
      {/* Hero — aura + particles + Kai */}
      <div className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center">
        {/* Aura — bloom in first, then rotate continuously */}
        <div className="anim-aura-bloom absolute inset-0">
          <KaiAura size="100%" />
        </div>

        {/* Atmospheric particles — drift around the aura */}
        <Particles />

        {/* Kai — pops in with overshoot */}
        <div
          aria-label="Kai, your guide"
          role="img"
          className="anim-kai-pop relative"
          style={{ animationDelay: "320ms" }}
        >
          <div className="anim-avatar-bob" style={{ animationDelay: "1100ms" }}>
            <Kai mood="warm" size={184} />
          </div>
        </div>
      </div>

      {/* Eyebrow — fades up after Kai lands */}
      <p
        className="anim-eyebrow-fade-up flex items-center justify-center gap-2 text-caption text-cream/60"
        style={{ animationDelay: "620ms" }}
      >
        <TareeqSparkle size={12} className="text-cyan-brand" />
        Meet your guide
      </p>

      {/* Typewriter caption + accent line */}
      <div className="relative flex flex-col items-center text-center">
        <Typewriter
          as="p"
          text={INTRO_SCRIPT}
          speed={20}
          startDelay={900}
          onComplete={() => setTypingDone(true)}
          className="min-h-[170px] max-w-[34ch] whitespace-pre-line text-[15.5px] leading-relaxed text-cream/85"
        />

        {/* Accent line — grows from left across the typing duration */}
        <span
          aria-hidden="true"
          className="anim-accent-line-grow mt-1 block h-px w-[60%] max-w-[220px] bg-gradient-to-r from-cyan-brand/0 via-cyan-brand/70 to-coral/0"
          style={{ animationDelay: "900ms" }}
        />
      </div>

      <div className="flex-1" />

      {typingDone ? (
        <div className="anim-cta-spring">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={next}
            iconRight={<TareeqArrowRight size={20} />}
          >
            Continue
          </Button>
        </div>
      ) : (
        // Reserve the CTA's vertical footprint so the layout doesn't reflow
        <div className="h-14" aria-hidden="true" />
      )}
    </section>
  );
}

/**
 * Atmospheric particles — 8 small dots positioned around the central aura.
 * Each fades in on a stagger, then drifts on a slow infinite loop.
 */
function Particles() {
  // [left%, top%, color, drift variant, fade-in delay (ms)]
  const dots: ReadonlyArray<
    [number, number, string, "a" | "b" | "c", number]
  > = [
    [12, 18, "var(--coral)", "a", 200],
    [82, 24, "var(--cyan)", "b", 320],
    [88, 60, "var(--lavender)", "c", 440],
    [70, 88, "var(--coral-glow)", "a", 560],
    [22, 78, "var(--cyan)", "b", 680],
    [6, 48, "var(--coral)", "c", 380],
    [50, 4, "var(--lavender)", "a", 540],
    [50, 96, "var(--cyan)", "b", 720],
  ];

  return (
    <>
      {dots.map(([l, t, color, variant, delay], i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`absolute size-1.5 rounded-full anim-particle-${variant}`}
          style={{
            left: `${l}%`,
            top: `${t}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            animationDelay: `${delay}ms`,
            opacity: 0,
            animationFillMode: "forwards",
          }}
        />
      ))}
    </>
  );
}
