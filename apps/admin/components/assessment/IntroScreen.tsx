"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
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
  const [introCopyActive, setIntroCopyActive] = useState(false);
  const [introCopyRun, setIntroCopyRun] = useState(0);
  const [introTypeSpeed, setIntroTypeSpeed] = useState(44);

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
  const { audioRef, audioState, play, pause } = useKaiNarration({
    audioId: "kai_intro",
    autoPlay: soundPrefReady && soundOn,
    soundOn,
  });

  const syncTypeSpeedFromAudio = useCallback(() => {
    const duration = audioRef.current?.duration;
    if (!duration || !Number.isFinite(duration)) return;
    const targetMs = Math.max(2600, duration * 920);
    const nextSpeed = Math.round(targetMs / INTRO_BODY.length);
    setIntroTypeSpeed(Math.min(56, Math.max(24, nextSpeed)));
  }, [audioRef]);

  function restartIntroCopy() {
    setTypingDone(false);
    setIntroCopyActive(false);
    setIntroCopyRun((run) => run + 1);
  }

  useEffect(() => {
    if (!soundPrefReady) return;

    if (!soundOn || audioState === "muted" || audioState === "unavailable") {
      setIntroCopyActive(true);
      return;
    }

    if (audioState === "playing" || audioState === "ended") {
      syncTypeSpeedFromAudio();
      setIntroCopyActive(true);
    }

    if (audioState === "loading") {
      const timeout = window.setTimeout(() => {
        setIntroCopyActive(true);
      }, 900);
      return () => window.clearTimeout(timeout);
    }

    // Touch devices wait for the first tap before audio can play. Don't make
    // the user stare at a placeholder — type the intro out anyway; the voice
    // joins in the moment they touch the screen (auto-start, no button).
    if (audioState === "locked") {
      const timeout = window.setTimeout(() => {
        setIntroCopyActive(true);
      }, 1200);
      return () => window.clearTimeout(timeout);
    }
  }, [audioState, soundOn, soundPrefReady, syncTypeSpeedFromAudio]);

  function next() {
    pause();
    uiSounds.advance();
    router.push("/contract");
  }

  function toggleSound() {
    const nextValue = !soundOn;
    setSoundOn(nextValue);
    window.localStorage.setItem("tareeq:sound", nextValue ? "on" : "off");
    if (!nextValue) {
      pause();
      setIntroCopyActive(true);
    } else {
      restartIntroCopy();
      void play(true);
    }
  }

  function replayOrUnlock() {
    restartIntroCopy();
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
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        className="hidden"
        onLoadedMetadata={syncTypeSpeedFromAudio}
      />

      {/* Character first — new Kai, green screen keyed out on the GPU so she
          floats transparently over the app (no aurora, frame, or card). */}
      <div className="relative flex h-[240px] w-[240px] items-center justify-center">
        <div
          aria-label="Kai, your guide"
          role="img"
          className="anim-kai-pop relative"
          style={{ animationDelay: "180ms" }}
        >
          <div className="anim-avatar-bob" style={{ animationDelay: "900ms" }}>
            {/* Intro clip loops continuously so Kai is always alive/moving
                (the narration voice plays via the separate <audio>). */}
            <KaiChromaVideo
              size={232}
              src="/kai/kai-intro-green.mp4"
              loop
            />
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

      {/* Body — synced to Kai's actual voice start, with a muted fallback. */}
      <div className="min-h-[5.6em] max-w-[34ch] text-center">
        {introCopyActive ? (
          <Typewriter
            key={introCopyRun}
            as="p"
            text={INTRO_BODY}
            speed={introTypeSpeed}
            onComplete={() => setTypingDone(true)}
            className="text-sand/85"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(17px, 0.95rem + 1vw, 21px)",
              lineHeight: 1.4,
              letterSpacing: "-0.005em",
              fontVariationSettings: '"SOFT" 60, "opsz" 96',
              margin: 0,
            }}
          />
        ) : (
          <p
            aria-hidden="true"
            className="m-0 text-sand/50"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(17px, 0.95rem + 1vw, 21px)",
              lineHeight: 1.4,
            }}
          >
            Kai is getting ready.
          </p>
        )}
      </div>

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
        {/* Replay control only — Kai's voice auto-starts on the first tap
         *  anywhere (handled by useKaiNarration), so there's no explicit
         *  "Start voice" button to hunt for. */}
        {!isLocked && (
          <button
            type="button"
            onClick={replayOrUnlock}
            disabled={!soundOn || isPlaying}
            className="glass-tile inline-flex size-9 items-center justify-center rounded-full text-sand/75 transition hover:text-sand active:scale-95 disabled:opacity-40"
            aria-label={isPlaying ? "Kai is speaking" : "Replay Kai's voice"}
          >
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
          </button>
        )}
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
