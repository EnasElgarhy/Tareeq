"use client";

import { useEffect, useId } from "react";
import type { Interstitial } from "@/lib/assessment/interstitials";
import { uiSounds } from "@/lib/audio/ui-sounds";

interface DidYouKnowProps {
  interstitial: Interstitial;
  onDismiss(): void;
}

/**
 * DidYouKnow v2 — sand-surface celebratory beat between question stacks.
 *
 * The bright moment in an otherwise night-surface journey. Editorial
 * composition: tracked uppercase eyebrow → big illustration with violet
 * + gold ambient halo → display headline (Fraunces) → body → violet CTA.
 */
export function DidYouKnow({ interstitial, onDismiss }: DidYouKnowProps) {
  const Illustration = interstitial.illustration;
  const titleId = useId();
  const bodyId = useId();

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="surface-sand fixed inset-0 z-50 overflow-hidden"
    >
      <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
        {/* Eyebrow chip */}
        <div className="anim-bubble-in flex justify-center pt-2">
          <span className="chip chip--violet-on-light">
            <span className="size-1.5 rounded-full bg-violet" />
            Did you know?
          </span>
        </div>

        {/* Illustration with ambient halo */}
        <div className="relative flex flex-1 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 40%, rgba(110,72,228,0.18), transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(40% 40% at 70% 70%, rgba(244,198,96,0.20), transparent 75%)",
            }}
          />
          <div
            className="anim-avatar-in anim-avatar-bob relative"
            style={{ animationDelay: "120ms" }}
          >
            <Illustration size={260} tone="ink" />
          </div>
        </div>

        {/* Title + body */}
        <div className="flex flex-col items-start gap-3">
          <h2
            id={titleId}
            className="anim-bubble-in text-display-2 text-carbon max-w-[20ch]"
            style={{ animationDelay: "200ms" }}
          >
            {interstitial.title}
          </h2>
          <p
            id={bodyId}
            className="anim-option-in text-body text-carbon/68 max-w-[36ch]"
            style={{ animationDelay: "320ms" }}
          >
            {interstitial.body}
          </p>
        </div>

        {/* CTA */}
        <div
          className="anim-option-in mt-7 grid gap-2"
          style={{ animationDelay: "420ms" }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="btn-v2 btn-v2--violet w-full"
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
}
