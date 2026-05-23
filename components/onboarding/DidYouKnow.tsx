"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Kai } from "@/components/brand/Kai";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import type { Interstitial } from "@/lib/assessment/interstitials";
import { uiSounds } from "@/lib/audio/ui-sounds";

interface DidYouKnowProps {
  interstitial: Interstitial;
  audioState?:
    | "idle"
    | "loading"
    | "playing"
    | "muted"
    | "locked"
    | "unavailable";
  mouthOpen?: number;
  soundOn?: boolean;
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
  audioState = "idle",
  mouthOpen = 0,
  soundOn = true,
  onReplay,
  onToggleSound,
  onDismiss,
}: DidYouKnowProps) {
  const Illustration = interstitial.illustration;
  const titleId = useId();
  const bodyId = useId();
  const [mounted, setMounted] = useState(false);

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
  const titleParts = splitTitle(interstitial.title);

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      aria-hidden={false}
    >
      {/* Dim + blur backdrop over the question screen */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="anim-backdrop-fade absolute inset-0 cursor-default"
        style={{
          background: "rgba(8, 5, 26, 0.68)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        }}
      />

      {/* Sheet — slides up from the bottom, capped at mobile width */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="anim-sheet-up relative mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] px-5 pb-7 pt-3 text-sand"
        style={{
          maxHeight: "calc(100dvh - 56px)",
          background:
            "linear-gradient(180deg, #221248 0%, #100A24 60%, #08051A 100%)",
          boxShadow:
            "0 -24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,238,230,0.10)",
        }}
      >
        {/* Soft violet bloom + warm hint at the top of the sheet */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 0%, rgba(157,127,240,0.30), transparent 70%)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-1/2 size-48 -translate-x-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,61,0.18), transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Drag indicator */}
        <span
          aria-hidden="true"
          className="relative mx-auto mb-3 block h-1.5 w-10 rounded-full bg-sand/20"
        />

        {/* Kai-narrated eyebrow — small animated Kai + "Did you know?" chip.
         *  Signals that the fact is voiced by Kai rather than the brand. */}
        <div className="anim-bubble-in relative flex items-center justify-center gap-3">
          <div className="relative flex size-12 items-center justify-center">
            <div className="absolute inset-0">
              <KaiAuraV2 size="100%" />
            </div>
            <div className="relative">
              <Kai mood="encouraging" mouthOpen={mouthOpen} size={44} />
            </div>
          </div>
          <span className="chip chip--violet-on-dark">
            <span className="size-1.5 rounded-full bg-gold" />
            Kai · did you know?
          </span>
          {onToggleSound ? (
            <button
              type="button"
              onClick={onToggleSound}
              className="glass-tile inline-flex size-8 items-center justify-center rounded-full text-sand/80 transition hover:text-sand"
              aria-label={soundOn ? "Mute narration" : "Unmute narration"}
            >
              <svg
                width="14"
                height="14"
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
          ) : null}
          {onReplay ? (
            <button
              type="button"
              onClick={onReplay}
              disabled={!soundOn}
              className={[
                "inline-flex h-8 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40",
                audioState === "locked"
                  ? "bg-gold-gradient px-3 text-[11px] font-semibold text-carbon shadow-gold-glow"
                  : "glass-tile size-8 text-sand/75 hover:text-sand",
              ].join(" ")}
              aria-label={
                audioState === "locked" ? "Start Kai voice" : "Replay narration"
              }
            >
              {audioState === "locked" ? (
                "Start voice"
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M17.5 7.1 C15.9 5.8 13.9 5 11.8 5 C7.5 5 4 8.5 4 12.8 C4 17.1 7.5 20.6 11.8 20.6 C15.5 20.6 18.6 18 19.4 14.6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.2 3.8 V7.8 H14.2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ) : null}
        </div>

        {/* Illustration on a glass plate */}
        <div className="relative mt-4 flex items-center justify-center">
          <div
            className="anim-avatar-in relative grid size-[200px] place-items-center rounded-[32px]"
            style={{
              animationDelay: "120ms",
              background:
                "linear-gradient(180deg, rgba(245,238,230,0.06) 0%, rgba(245,238,230,0.02) 100%)",
              border: "1px solid rgba(245,238,230,0.10)",
              boxShadow:
                "inset 0 1px 0 rgba(245,238,230,0.12), 0 12px 40px rgba(0,0,0,0.35)",
            }}
          >
            <div className="anim-avatar-bob">
              <Illustration size={170} />
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
            {interstitial.body}
          </p>
          {interstitial.source ? (
            <p
              className="anim-option-in text-[11px] font-semibold uppercase tracking-[0.14em] text-sand/38"
              style={{ animationDelay: "360ms" }}
            >
              Source: {interstitial.source}
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
            className="btn-v2 btn-v2--primary w-full"
            data-size="lg"
            autoFocus
          >
            {interstitial.ctaLabel}
            <svg
              width="20"
              height="20"
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
