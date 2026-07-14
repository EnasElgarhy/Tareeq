"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Kai } from "@/components/brand/Kai";
import type { Interstitial } from "@/lib/assessment/interstitials";
import { uiSounds } from "@/lib/audio/ui-sounds";

interface DidYouKnowProps {
  interstitial: Interstitial;
  /** Accepted for call-site compatibility; not shown. */
  totalQuestions?: number;
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
 * DidYouKnow v6 — full-screen LIGHT pause.
 *
 * Structure: Kai poses "Did you know?" from a small avatar at the top,
 * a large illustration anchors the screen, and the fact reads as the
 * hero text (its key figure pulled into the warm gradient). One clear
 * CTA returns to the assessment.
 *
 * On mobile the panel is the full screen; on desktop it's a centered
 * phone-width light column on a dimmed backdrop, matching the app frame.
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

  // Hero sentence + supporting takeaway, with the key figure emphasized.
  const sentences = interstitial.body.split(/(?<=\.)\s+/);
  const lead = (sentences[0] ?? interstitial.body).trim();
  const takeaway = sentences.slice(1).join(" ").trim();
  const leadParts = highlightStat(lead);

  const screen = (
    <div
      className="fixed inset-0 z-[100] flex justify-center"
      style={{
        background: "rgba(8,5,26,0.55)",
        backdropFilter: "blur(6px) saturate(120%)",
        WebkitBackdropFilter: "blur(6px) saturate(120%)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Did you know — a quick fact from Kai"
        aria-describedby={bodyId}
        className="anim-screen-enter relative flex h-full w-full max-w-[480px] flex-col overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -5%, rgba(255,165,61,0.14), transparent 55%)," +
            "radial-gradient(100% 60% at 50% 105%, rgba(157,127,240,0.08), transparent 60%)," +
            "#F5EEE6",
          color: "var(--carbon)",
        }}
      >
        {/* ── Top · Kai poses "Did you know?" + voice controls ── */}
        <header className="flex items-center gap-3 px-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <span className="dyk-kai-badge anim-bubble-in inline-flex shrink-0">
            <Kai
              size={52}
              videoVariant="assessment"
              videoPlaying={audioState === "playing"}
              mouthOpen={mouthOpen}
            />
          </span>
          <div className="anim-bubble-in grid">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "#6E48E4" }}
            >
              Kai
            </span>
            <span
              className="text-[19px] font-black leading-none"
              style={{ color: "var(--carbon)" }}
            >
              Did you know?
            </span>
          </div>

          {onToggleSound || onReplay ? (
            <div className="anim-bubble-in ml-auto flex items-center gap-1.5">
              {onToggleSound ? (
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="grid size-8 place-items-center rounded-full border border-carbon/12 bg-white/55 text-carbon/65 transition hover:text-carbon"
                  aria-label={soundOn ? "Mute narration" : "Unmute narration"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 9.5 H7.5 L12 6 V18 L7.5 14.5 H4 Z"
                      fill="currentColor"
                      fillOpacity="0.12"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                    {soundOn ? (
                      <path d="M15 9.5 a3.8 3.8 0 0 1 0 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    ) : (
                      <path d="M15.5 9.5 L20.5 14.5 M20.5 9.5 L15.5 14.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
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
                      : "size-8 border border-carbon/12 bg-white/55 text-carbon/65 hover:text-carbon",
                  ].join(" ")}
                  aria-label={audioState === "locked" ? "Start Kai voice" : "Replay narration"}
                >
                  {audioState === "locked" ? (
                    "Start voice"
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M17.5 7.1 C15.9 5.8 13.9 5 11.8 5 C7.5 5 4 8.5 4 12.8 C4 17.1 7.5 20.6 11.8 20.6 C15.5 20.6 18.6 18 19.4 14.6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path d="M18.2 3.8 V7.8 H14.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}
        </header>

        {/* ── Middle · large illustration + the fact ── */}
        <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-6 text-center">
          {/* Large ink line-art directly on the cream, with a soft glow */}
          <div
            className="anim-avatar-in relative grid place-items-center"
            style={{ animationDelay: "80ms" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-8"
              style={{
                background:
                  "radial-gradient(circle at 50% 46%, rgba(255,107,61,0.12), transparent 68%)",
              }}
            />
            <div className="anim-avatar-bob relative">
              <Illustration size={220} tone="ink" />
            </div>
          </div>

          {/* Hero fact — key figure in warm gradient */}
          <p
            id={bodyId}
            className="anim-bubble-in max-w-[22ch] font-extrabold leading-[1.16]"
            style={{
              animationDelay: "200ms",
              color: "var(--carbon)",
              fontSize: "clamp(20px, 5.4vw, 27px)",
            }}
          >
            {leadParts.before}
            {leadParts.stat ? (
              <span
                className="text-grad-warm"
                style={{ fontWeight: 900, whiteSpace: "nowrap" }}
              >
                {leadParts.stat}
              </span>
            ) : null}
            {leadParts.after}
          </p>

          {/* Takeaway — secondary */}
          {takeaway ? (
            <p
              className="anim-option-in max-w-[36ch] text-[14px] leading-relaxed"
              style={{ animationDelay: "300ms", color: "rgba(20,16,31,0.62)" }}
            >
              {takeaway}
            </p>
          ) : null}

          {/* Source — smallest */}
          {interstitial.source ? (
            <p
              className="anim-option-in text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ animationDelay: "340ms", color: "rgba(20,16,31,0.4)" }}
            >
              Source: {interstitial.source}
            </p>
          ) : null}
        </div>

        {/* ── Bottom · one clear way forward ── */}
        <div
          className="anim-option-in flex justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2"
          style={{ animationDelay: "400ms" }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="btn-v2 btn-v2--primary w-full max-w-[420px]"
            data-size="lg"
            autoFocus
          >
            {interstitial.ctaLabel}
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
        </div>

        {/* Kai's compass/aura are tuned for the dark theme; on this light
            badge we show just the circular face. */}
        <style>{`
          .dyk-kai-badge .kai-video-avatar__compass,
          .dyk-kai-badge .kai-video-avatar__halo,
          .dyk-kai-badge .kai-video-avatar__rim,
          .dyk-kai-badge .kai-video-avatar__speech { display: none !important; }
        `}</style>
      </div>
    </div>
  );

  return createPortal(screen, document.body);
}

/**
 * Pull the first meaningful figure out of a sentence so it can be
 * emphasized. A number (with optional decimal/thousands group and range)
 * followed by a unit — so we highlight the surprising statistic, never an
 * incidental year. Returns text split around the figure; `stat` null if none.
 */
function highlightStat(text: string): {
  before: string;
  stat: string | null;
  after: string;
} {
  const m = text.match(
    /\d+(?:[.,]\d+)?(?:\s?[–-]\s?\d+(?:[.,]\d+)?)?\s?(?:%|percent|million|billion|trillion|days?|hours?|times)/i,
  );
  if (!m || m.index === undefined) {
    return { before: text, stat: null, after: "" };
  }
  return {
    before: text.slice(0, m.index),
    stat: m[0].trim(),
    after: text.slice(m.index + m[0].length),
  };
}
