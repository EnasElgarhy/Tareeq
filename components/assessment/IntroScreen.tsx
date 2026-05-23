"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Kai } from "@/components/brand/Kai";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import { Typewriter } from "@/components/primitives/Typewriter";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { useKaiNarration } from "@/lib/audio/use-kai-narration";

const INTRO_BODY =
  "Think of me as a filter for all the noise. We’re looking for your Energy Flows — the stuff that makes you lose track of time. Pick what you’d actually do.";

export function IntroScreen() {
  const router = useRouter();
  const [typingDone, setTypingDone] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [soundPrefReady, setSoundPrefReady] = useState(false);

  // Hydrate sound preference from localStorage so muting persists
  // across screens, matching what /q/* already does.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSoundOn(window.localStorage.getItem("tareeq:sound") !== "off");
    setSoundPrefReady(true);
    uiSounds.transition();
  }, []);

  // Shared Kai narration pipeline — auto-plays the kai_intro clip on
  // desktop, waits for a tap on touch devices (sets state to "locked").
  const { audioRef, mouthOpen, audioState, play, pause } = useKaiNarration({
    audioId: "kai_intro",
    autoPlay: soundPrefReady && soundOn,
    soundOn,
  });

  function next() {
    pause();
    uiSounds.advance();
    router.push("/contract");
  }

  function toggleSound() {
    const nextValue = !soundOn;
    setSoundOn(nextValue);
    window.localStorage.setItem("tareeq:sound", nextValue ? "on" : "off");
    if (!nextValue) pause();
    else void play(true);
  }

  function replayOrUnlock() {
    void play(true);
  }

  const isLocked = audioState === "locked";
  const isPlaying = audioState === "playing";

  return (
    <section
      aria-labelledby="intro-heading"
      className="anim-screen-enter flex flex-1 flex-col items-center justify-center gap-5 pb-4 text-center"
    >
      {/* Hidden audio element — driven entirely by useKaiNarration */}
      <audio ref={audioRef} preload="auto" playsInline className="hidden" />

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
            {/* mouthOpen drives lip-sync from the narration RMS analyser */}
            <Kai mood="warm" gesture="wave" mouthOpen={mouthOpen} size={150} />
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

      {/* Audio controls — mute toggle + replay / unlock-voice button.
       *  On touch devices that block autoplay, the "Start voice" gold
       *  pill prompts the first user gesture so Kai can speak. */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleSound}
          className="glass-tile inline-flex size-9 items-center justify-center rounded-full text-sand/80 transition hover:text-sand"
          aria-label={soundOn ? "Mute Kai's voice" : "Unmute Kai's voice"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 9.5 H7.5 L12 6 V18 L7.5 14.5 H4 Z"
              fill="currentColor"
              fillOpacity="0.12"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            {soundOn ? (
              <path
                d="M15 9.5 a3.8 3.8 0 0 1 0 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M15.5 9.5 L20.5 14.5 M20.5 9.5 L15.5 14.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
        <button
          type="button"
          onClick={replayOrUnlock}
          disabled={!soundOn || isPlaying}
          className={
            isLocked
              ? "inline-flex h-9 items-center gap-1.5 rounded-full bg-gold-gradient px-3.5 text-[12px] font-semibold text-carbon shadow-gold-glow transition active:scale-95"
              : "glass-tile inline-flex size-9 items-center justify-center rounded-full text-sand/75 transition hover:text-sand active:scale-95 disabled:opacity-40"
          }
          aria-label={
            isLocked
              ? "Start Kai's voice"
              : isPlaying
                ? "Kai is speaking"
                : "Replay Kai's voice"
          }
        >
          {isLocked ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 5.5 L18.5 12 L7 18.5 Z" />
              </svg>
              Start voice
            </>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 12 A 9 9 0 0 1 21 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M17 6 L 21 12 L 17 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>

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
