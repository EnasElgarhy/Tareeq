"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Kai } from "@/components/brand/Kai";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import { Typewriter } from "@/components/primitives/Typewriter";
import { uiSounds } from "@/lib/audio/ui-sounds";

const INTRO_BODY =
  "Think of me as a filter for all the noise. We’re looking for your Energy Flows — the stuff that makes you lose track of time. Pick what you’d actually do.";

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
      className="anim-screen-enter flex flex-1 flex-col items-center justify-center gap-5 pb-4 text-center"
    >
      {/* Character first — Kai with aurora */}
      <div className="relative flex h-[220px] w-[220px] items-center justify-center">
        <div className="anim-aura-bloom absolute inset-0">
          <KaiAuraV2 size="100%" />
        </div>
        <div
          aria-label="Kai, your guide"
          role="img"
          className="anim-kai-pop relative"
          style={{ animationDelay: "180ms" }}
        >
          <div className="anim-avatar-bob" style={{ animationDelay: "900ms" }}>
            <Kai mood="warm" gesture="wave" size={150} />
          </div>
        </div>
      </div>

      {/* "Meet Kai." fades up below the character */}
      <h1
        id="intro-heading"
        className="text-hero text-sand anim-fade-up"
        style={{ animationDelay: "700ms" }}
      >
        Meet{" "}
        <span
          className="text-grad-warm"
          style={{
            fontStyle: "italic",
            fontVariationSettings: '"SOFT" 100, "opsz" 144',
          }}
        >
          Kai
        </span>
        .
      </h1>

      {/* Body — typewriter, slow + deliberate so it feels handwritten */}
      <Typewriter
        as="p"
        text={INTRO_BODY}
        speed={48}
        startDelay={1300}
        onComplete={() => setTypingDone(true)}
        className="max-w-[34ch] text-sand/85 text-center"
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "clamp(17px, 0.95rem + 1vw, 21px)",
          lineHeight: 1.4,
          letterSpacing: "-0.005em",
          fontVariationSettings: '"SOFT" 60, "opsz" 96',
          minHeight: "5.6em",
        }}
      />

      <div className="flex-1" />

      {typingDone ? (
        <div className="anim-cta-spring w-full">
          <button
            type="button"
            onClick={next}
            className="btn-v2 btn-v2--primary w-full"
            data-size="lg"
          >
            Continue
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
        </div>
      ) : (
        <div className="h-[60px] w-full" aria-hidden="true" />
      )}
    </section>
  );
}
