"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Interstitial } from "@/lib/assessment/interstitials";
import { getLocalizedText } from "@/lib/assessment/questions";
import { uiSounds } from "@/lib/audio/ui-sounds";

interface DidYouKnowProps {
  interstitial: Interstitial;
  soundOn?: boolean;
  /** Narration element that keeps the popup gesture aligned to Kai's voice. */
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  onReplay?(): void;
  onToggleSound?(): void;
  onDismiss(): void;
}

/**
 * DidYouKnow v3 — night-surface bottom sheet between question stacks.
 *
 * Slides up from the bottom of the viewport over a dim+blur of the
 * question screen. Matches the redesigned flow: night gradient surface,
 * violet bloom halo, hairline cream illustrations with warm-gradient
 * accents, glass panels, and the warm-gradient primary CTA.
 *
 * Composition: drag indicator → violet glass eyebrow → illustration on
 * a violet-glow plate → display headline with warm-gradient italic →
 * body → warm-gradient CTA.
 *
 * Portalled into `document.body` so the sheet escapes the assessment
 * chrome's stacking context (`isolation: isolate` + `overflow: hidden`).
 * Tapping the backdrop dismisses, same as the CTA.
 */
export function DidYouKnow({
  interstitial,
  soundOn = true,
  audioRef,
  onReplay,
  onToggleSound,
  onDismiss,
}: DidYouKnowProps) {
  const { t, locale } = useLocale();
  const Illustration = interstitial.illustration;
  const titleId = useId();
  const bodyId = useId();
  const [mounted, setMounted] = useState(false);
  const title = getLocalizedText(interstitial.title, locale);
  const body = getLocalizedText(interstitial.body, locale);
  const source = interstitial.source
    ? getLocalizedText(interstitial.source, locale)
    : null;
  const ctaLabel = getLocalizedText(interstitial.ctaLabel, locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    uiSounds.transition();
    const t = window.setTimeout(() => uiSounds.complete(), 220);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, []);

  function dismiss() {
    uiSounds.advance();
    onDismiss();
  }

  if (!mounted) return null;

  // First two words of the title get the warm-gradient italic accent.
  // Falls back gracefully if the title is one word.
  const titleParts = splitTitle(title);

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center md:items-center"
      aria-hidden={false}
    >
      {/* Dim + blur backdrop over the question screen */}
      <button
        type="button"
        aria-label={t("interstitial.dismiss_aria")}
        onClick={dismiss}
        className="anim-backdrop-fade absolute inset-0 cursor-default"
        style={{
          background: "rgba(8, 5, 26, 0.68)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        }}
      />

      {/* Sheet — bottom sheet on phone/tablet; a centered, fully-rounded
       *  modal card from md: up, since anchoring a phone-width sheet to the
       *  bottom edge of a desktop viewport just reads as a mobile popup
       *  stranded in a lot of empty space. Same content, same entrance
       *  animation — only the anchor/width/corners change by breakpoint. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="assessment-modal-panel anim-sheet-up relative mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[24px] px-5 pb-7 pt-3 text-sand md:max-w-[560px] md:rounded-[24px] md:px-7 md:pb-8 md:pt-6"
        style={{
          maxHeight: "calc(100dvh - 56px)",
        }}
      >
        {/* Soft violet bloom + warm hint at the top of the sheet */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 0%, rgba(157,127,240,0.18), transparent 70%)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-1/2 size-48 -translate-x-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,61,0.10), transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Drag indicator — a bottom-sheet affordance, so it's meaningless
         *  once this becomes a centered modal card at md:. */}
        <span
          aria-hidden="true"
          className="relative mx-auto mb-3 block h-1.5 w-10 rounded-full bg-sand/20 md:hidden"
        />

        {/* Kai-narrated eyebrow — small animated Kai + "Did you know?" chip.
         *  Signals that the fact is voiced by Kai rather than the brand. */}
        <div className="anim-bubble-in relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-sand/15 bg-night/35">
              <div style={{ transform: "translateY(2px)" }}>
                <KaiChromaVideo
                  src="/kai/kai-did-you-know-v3.mp4"
                  posterSrc="/kai/kai-did-you-know-rest-v3.webp"
                  size={58}
                  audioRef={audioRef}
                  playing={false}
                  playStart={0}
                  playEnd={2.95}
                  restTime={0}
                />
              </div>
            </div>
            <span className="chip chip--violet-on-dark min-w-0 truncate">
              <span className="size-1.5 shrink-0 rounded-full bg-gold" />
              {t("interstitial.chip")}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onToggleSound ? (
              <button
                type="button"
                onClick={onToggleSound}
                className="assessment-icon-button size-10"
                data-active={soundOn}
                aria-label={soundOn ? t("audio.mute") : t("audio.unmute")}
                title={soundOn ? t("audio.mute") : t("audio.unmute")}
              >
                {soundOn ? (
                  <Volume2 size={16} strokeWidth={1.9} aria-hidden="true" />
                ) : (
                  <VolumeX size={16} strokeWidth={1.9} aria-hidden="true" />
                )}
              </button>
            ) : null}
            {onReplay ? (
              <button
                type="button"
                onClick={onReplay}
                disabled={!soundOn}
                className="assessment-icon-button size-10 disabled:opacity-40"
                aria-label={t("audio.replay")}
                title={t("audio.replay")}
              >
                <RotateCcw size={16} strokeWidth={1.9} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Illustration on a glass plate */}
        <div className="relative mt-4 flex items-center justify-center">
          <div
            className="assessment-interstitial-illustration anim-avatar-in relative grid size-[184px] place-items-center md:size-[196px]"
            style={{
              animationDelay: "120ms",
            }}
          >
            <div className="anim-avatar-bob">
              <Illustration size={160} />
            </div>
          </div>
        </div>

        {/* Title + body */}
        <div className="relative mt-5 flex flex-col items-start gap-2">
          <h2
            id={titleId}
            className="anim-bubble-in text-display-2 text-sand max-w-[20ch]"
            style={{ animationDelay: "200ms" }}
          >
            {titleParts.lead}
            {titleParts.accent ? (
              <>
                {titleParts.lead ? " " : ""}
                <span
                  className="text-grad-warm"
                  style={{
                    fontStyle: "italic",
                    fontVariationSettings: '"SOFT" 100, "opsz" 144',
                  }}
                >
                  {titleParts.accent}
                </span>
              </>
            ) : null}
          </h2>
          <p
            id={bodyId}
            className="anim-option-in text-body text-sand/70 max-w-[36ch]"
            style={{ animationDelay: "320ms" }}
          >
            {body}
          </p>
          {source ? (
            <p
              className="anim-option-in text-[11px] font-bold uppercase text-sand/45"
              style={{ animationDelay: "360ms" }}
            >
              {t("interstitial.source_prefix").replace("{source}", source)}
            </p>
          ) : null}
        </div>

        {/* CTA */}
        <div
          className="anim-option-in relative mt-6 grid gap-2"
          style={{ animationDelay: "420ms" }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="btn-v2 btn-v2--primary assessment-primary-action w-full"
            data-size="lg"
            autoFocus
          >
            {ctaLabel}
            <ArrowRight size={19} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/**
 * Split a short interstitial title so the LAST two words get the
 * warm-gradient italic accent. Editorial pacing — the eye lands on the
 * accented phrase last. Falls back to "lead only" for short titles.
 */
function splitTitle(title: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return { lead: "", accent: title };
  const accent = words.slice(-2).join(" ");
  const lead = words.slice(0, -2).join(" ");
  return { lead, accent };
}
