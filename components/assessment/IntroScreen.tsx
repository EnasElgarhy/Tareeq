"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Kai } from "@/components/brand/Kai";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import { Typewriter } from "@/components/primitives/Typewriter";
import { uiSounds } from "@/lib/audio/ui-sounds";

const INTRO_SCRIPT =
  "Hey! I’m Kai. Think of me as a filter for all the noise. We’re looking for your Energy Flows — the stuff that actually makes you lose track of time.\n\nThis isn’t a school test. There are no wrong answers. Pick what you would actually do.";

/**
 * IntroScreen — v2 mystical-editorial redesign.
 *
 * Composition (top → bottom):
 *   ✦ Tiny eyebrow chip "MEET YOUR GUIDE"
 *   ✦ Chunky display headline "Meet Kai."  (Fraunces 800, soft axis)
 *   ✦ Painterly aurora + Kai
 *   ✦ Typewriter body
 *   ✦ Gold CTA at the bottom (replaces the v1 coral)
 *
 * Surface: night-gradient with star-field overlay.
 */
export function IntroScreen() {
  const router = useRouter();
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    uiSounds.transition();
  }, []);

  function next() {
    uiSounds.advance();
    router.push("/contract");
  }

  return (
    <section
      aria-labelledby="intro-heading"
      className="anim-screen-enter relative flex flex-1 flex-col gap-7 pb-4 pt-2"
    >
      {/* Header — eyebrow + display headline */}
      <header className="flex flex-col items-start gap-3">
        <span className="anim-eyebrow-fade-up inline-flex items-center gap-2 rounded-full bg-violet/15 px-3 py-1.5 text-eyebrow text-violet-soft">
          <span className="size-1.5 rounded-full bg-gold" />
          Meet your guide
        </span>
        <h1
          id="intro-heading"
          className="text-hero text-sand"
          style={{ animationDelay: "120ms" }}
        >
          Meet{" "}
          <span className="italic text-gold" style={{ fontStyle: "italic" }}>
            Kai
          </span>
          <span className="text-gold">.</span>
        </h1>
      </header>

      {/* Aurora + Kai — painterly, breathing */}
      <div className="relative mx-auto flex h-[280px] w-[280px] items-center justify-center">
        <div className="anim-aura-bloom absolute inset-0">
          <KaiAuraV2 size="100%" />
        </div>
        <div
          aria-label="Kai, your guide"
          role="img"
          className="anim-kai-pop relative"
          style={{ animationDelay: "320ms" }}
        >
          <div className="anim-avatar-bob" style={{ animationDelay: "1100ms" }}>
            <Kai mood="warm" size={176} />
          </div>
        </div>
      </div>

      {/* Typewriter body */}
      <div className="flex flex-col items-start">
        <Typewriter
          as="p"
          text={INTRO_SCRIPT}
          speed={20}
          startDelay={900}
          onComplete={() => setTypingDone(true)}
          className="min-h-[160px] max-w-[36ch] whitespace-pre-line text-lead text-sand/82"
        />
        <span
          aria-hidden="true"
          className="anim-accent-line-grow mt-3 block h-px w-full max-w-[260px] bg-gradient-to-r from-violet-soft/0 via-violet-soft/70 to-gold/0"
          style={{ animationDelay: "900ms" }}
        />
      </div>

      <div className="flex-1" />

      {typingDone ? (
        <div className="anim-cta-spring">
          <button
            type="button"
            onClick={next}
            className="btn-v2 btn-v2--primary w-full"
          >
            Continue
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="h-[60px]" aria-hidden="true" />
      )}
    </section>
  );
}
