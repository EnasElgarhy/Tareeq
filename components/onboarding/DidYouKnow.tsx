"use client";

import { useEffect, useId } from "react";
import { TareeqArrowRight } from "@/components/brand/icons";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import type { Interstitial } from "@/lib/assessment/interstitials";
import { uiSounds } from "@/lib/audio/ui-sounds";

interface DidYouKnowProps {
  interstitial: Interstitial;
  onDismiss(): void;
}

const GLOW_STYLE: Record<Interstitial["glow"], string> = {
  coral:
    "radial-gradient(60% 50% at 50% 35%, rgba(255,107,71,0.22), transparent 70%)",
  cyan: "radial-gradient(60% 50% at 50% 35%, rgba(91,214,232,0.22), transparent 70%)",
  lavender:
    "radial-gradient(60% 50% at 50% 35%, rgba(184,165,217,0.30), transparent 70%)",
};

/**
 * DidYouKnow — full-bleed pause-beat between assessment question stacks.
 *
 * Editorial composition: big illustration, Fraunces italic title, short
 * supporting paragraph, single coral CTA. Lives on a cream surface with
 * a soft accent glow behind the illustration. Sits above the question
 * screen so the user can't see the next question behind it.
 *
 * Plays the "complete" chord on enter so the moment feels celebratory,
 * not just an interruption.
 */
export function DidYouKnow({ interstitial, onDismiss }: DidYouKnowProps) {
  const Illustration = interstitial.illustration;
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    // Whoosh in, then the celebratory chord lands a beat later.
    uiSounds.transition();
    const id = window.setTimeout(() => uiSounds.complete(), 220);
    // Lock the body scroll while the interstitial is up
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
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
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 50% at 80% 0%, rgba(255,107,71,0.12), transparent 60%), " +
          "radial-gradient(50% 40% at 15% 100%, rgba(184,165,217,0.22), transparent 65%), " +
          "var(--cream)",
      }}
    >
      <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
        {/* Eyebrow chip — sets the moment */}
        <div className="anim-bubble-in flex justify-center pt-2">
          <Badge tone="accent" withDot>
            Did you know?
          </Badge>
        </div>

        {/* Illustration — the big visual moment */}
        <div className="relative flex flex-1 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: GLOW_STYLE[interstitial.glow] }}
          />
          <div
            className="anim-avatar-in anim-avatar-bob relative"
            style={{ animationDelay: "120ms" }}
          >
            <Illustration size={240} tone="ink" />
          </div>
        </div>

        {/* Title + body — Fraunces italic for the title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h2
            id={titleId}
            className="anim-bubble-in max-w-[18ch] text-[clamp(1.75rem,1.2rem+2.4vw,2.25rem)] font-normal italic leading-[1.05] tracking-[-0.015em] text-ink"
            style={{
              fontFamily: "var(--font-display-italic), Georgia, serif",
              animationDelay: "200ms",
            }}
          >
            {interstitial.title}
          </h2>
          <p
            id={bodyId}
            className="anim-option-in max-w-[34ch] text-[15px] leading-relaxed text-ink/68"
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
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={dismiss}
            iconRight={<TareeqArrowRight size={20} />}
            autoFocus
          >
            {interstitial.ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
