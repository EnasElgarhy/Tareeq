"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { useAssessmentAudio } from "@/components/assessment/AssessmentAudioProvider";
import {
  INTRO_NARRATION_AUDIO_ID,
  INTRO_NARRATION_OWNER_ID,
} from "@/components/assessment/intro-audio";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function IntroScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const introBody = t("intro.body");
  const [kaiVideoReady, setKaiVideoReady] = useState(false);
  const {
    audioRef,
    playNarration,
    preloadNarration,
    stopNarration,
    replayNarration,
    setMuted,
    isPlaying: providerIsPlaying,
    isPreparing,
    isMuted,
    activeOwnerId,
    error,
  } = useAssessmentAudio();
  const ownsIntroAudio = activeOwnerId === INTRO_NARRATION_OWNER_ID;
  const soundOn = !isMuted;
  const audioState = isMuted
    ? "muted"
    : error && ownsIntroAudio
      ? "unavailable"
      : isPreparing && ownsIntroAudio
        ? "loading"
        : providerIsPlaying && ownsIntroAudio
          ? "playing"
          : "idle";

  useEffect(() => {
    uiSounds.transition();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void window
      .fetch("/kai/kai-question-green-v3.mp4", {
        cache: "force-cache",
        signal: controller.signal,
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    preloadNarration({ audioId: INTRO_NARRATION_AUDIO_ID, locale });
  }, [locale, preloadNarration]);

  useEffect(() => {
    if (!kaiVideoReady) return;
    playNarration({
      audioId: INTRO_NARRATION_AUDIO_ID,
      locale,
      ownerId: INTRO_NARRATION_OWNER_ID,
    });
    return () => stopNarration(INTRO_NARRATION_OWNER_ID);
  }, [kaiVideoReady, locale, playNarration, stopNarration]);

  useEffect(() => {
    if (kaiVideoReady) return;
    const timeout = window.setTimeout(() => setKaiVideoReady(true), 3500);
    return () => window.clearTimeout(timeout);
  }, [kaiVideoReady]);

  function next() {
    stopNarration(INTRO_NARRATION_OWNER_ID);
    uiSounds.advance();
    router.push("/contract");
  }

  function toggleSound() {
    const nextMuted = soundOn;
    setMuted(nextMuted);
    if (!nextMuted) {
      window.setTimeout(() => replayNarration(INTRO_NARRATION_OWNER_ID), 0);
    }
  }

  function replayOrUnlock() {
    replayNarration(INTRO_NARRATION_OWNER_ID);
  }

  const isPlaying = audioState === "playing";

  return (
    <section
      aria-labelledby="intro-heading"
      className="anim-screen-enter flex flex-1 flex-col items-center justify-center gap-5 pb-4 text-center lg:grid lg:grid-cols-2 lg:content-center lg:items-center lg:gap-10 lg:pb-0 lg:text-start"
    >
      {/* Character first — Kai drops in, green screen keyed out so she
          floats over the night surface. Sized by --intro-kai-size so one
          instance scales per breakpoint.
          Desktop: her own column, the bigger presence a landing-style
          split layout calls for. */}
      <div className="intro-kai relative flex items-center justify-center lg:w-full">
        <div
          aria-label={t("kai.guide_aria")}
          role="img"
          className="anim-kai-drop relative z-10"
        >
          <div className="anim-kai-drop-bob">
            {/* New Kai intro clip — plays in sync with the narration
                (same line), freezes on her closed-mouth smile when done. */}
            <KaiChromaVideo
              size="var(--intro-kai-size)"
              src="/kai/kai-intro-green-v2.mp4"
              audioRef={audioRef}
              onReadyChange={setKaiVideoReady}
              playStart={0}
              playEnd={7.9}
              restTime={0}
            />
          </div>
        </div>
      </div>

      {/* Desktop: text column — headline, body, controls, and CTA stack
       *  together so the split reads as one deliberate composition
       *  rather than two unrelated halves. */}
      <div className="flex flex-1 flex-col items-center gap-5 lg:items-start lg:gap-6">
        {/* "Meet Kai." fades up below the character */}
        <h1
          id="intro-heading"
          className="text-hero text-sand anim-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          {t("intro.meet_prefix")}
          <span className="text-grad-warm">{t("intro.kai_name")}</span>.
        </h1>

        {/* Shown straight away: Kai's voice joins when it's ready and never
         *  holds the page up (corrections of 6 Nov 2026, section 3.2). */}
        <p
          className="m-0 max-w-[34ch] text-center text-sand/85 lg:text-start"
          style={{
            fontWeight: 500,
            fontSize: "clamp(17px, 0.95rem + 1vw, 21px)",
            lineHeight: 1.45,
          }}
        >
          {introBody}
        </p>

        {/* Audio controls — mute toggle + replay button. Kai's voice
         *  auto-starts on load; on touch devices the first interaction
         *  anywhere on the page unlocks it (no dedicated button needed). */}
        <div className="flex items-center justify-center gap-2 lg:justify-start">
          <button
            type="button"
            onClick={toggleSound}
            className="glass-tile inline-flex size-9 items-center justify-center rounded-full text-sand/80 transition hover:text-sand"
            aria-label={soundOn ? t("audio.mute") : t("audio.unmute")}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
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
            className="glass-tile inline-flex size-9 items-center justify-center rounded-full text-sand/75 transition hover:text-sand active:scale-95 disabled:opacity-40"
            aria-label={isPlaying ? t("audio.speaking") : t("audio.replay")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
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
        </div>

        <div className="flex-1 lg:hidden" />

          <div className="anim-cta-spring w-full lg:max-w-[280px]">
            <button
              type="button"
              onClick={next}
              className="btn-v2 btn-v2--primary w-full"
              data-size="lg"
            >
              {t("nav.continue")}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
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

      </div>
    </section>
  );
}
