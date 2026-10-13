"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getLocalizedText } from "@/lib/assessment/questions";
import {
  CONFIRM_ARM_MS,
  RUSH_HINTS,
  pickRushHintIndex,
} from "@/lib/assessment/reading-pace";

/** Last headline shown, so the next sheet never repeats it. */
let lastHintIndex: number | null = null;

interface RushConfirmSheetProps {
  /** How long they looked at the question before tapping. */
  elapsedMs: number;
  /** Shortest believable time to read the question and its options. */
  minReadMs: number;
  onReread(): void;
}

/**
 * Reading-pace heads-up. A rushed tap opens this sheet over the options
 * instead of asking for a second tap on the same answer (which trains
 * people to just double-tap). The one action sends them back to read;
 * it stays inert for CONFIRM_ARM_MS so the second half of a double-tap
 * lands on nothing. Backdrop / Escape also mean "read again".
 *
 * The reading-speed track is the evidence behind Kai's joke: how far
 * their tap got against the time the question actually takes to read.
 */
export function RushConfirmSheet({
  elapsedMs,
  minReadMs,
  onReread,
}: RushConfirmSheetProps) {
  const { t, locale } = useLocale();
  const titleId = useId();
  const bodyId = useId();
  const [mounted, setMounted] = useState(false);
  const [armed, setArmed] = useState(false);
  const [hintIndex] = useState(() => {
    const next = pickRushHintIndex(lastHintIndex);
    lastHintIndex = next;
    return next;
  });
  const hint = getLocalizedText(RUSH_HINTS[hintIndex]!, locale);

  useEffect(() => {
    setMounted(true);
    const timer = window.setTimeout(() => setArmed(true), CONFIRM_ARM_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onReread();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onReread]);

  function reread() {
    if (armed) onReread();
  }

  if (!mounted) return null;

  const overlay = (
    <div className="assessment-night fixed inset-0 z-[100] flex items-end justify-center md:items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("rush.reread")}
        onClick={reread}
        className="anim-backdrop-fade absolute inset-0 cursor-default"
        style={{
          background: "rgba(8, 5, 26, 0.72)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="assessment-modal-panel anim-sheet-up relative mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] px-6 pb-7 pt-3 text-sand md:max-w-[420px] md:rounded-[28px] md:px-7 md:pt-7"
      >
        {/* Warm heat at the top edge: the "too fast" signal, not violet. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "radial-gradient(70% 100% at 18% 0%, rgba(255,107,61,0.20), transparent 70%)",
          }}
        />
        <span
          aria-hidden="true"
          className="relative mx-auto mb-5 block h-1.5 w-10 rounded-full bg-sand/20 md:hidden"
        />

        <div className="relative flex items-center gap-4">
          <div className="anim-rush-kai relative size-[72px] shrink-0 overflow-hidden rounded-[22px] border border-sand/15 bg-night/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kai/kai-did-you-know-rest-v3.webp"
              alt=""
              width={72}
              height={72}
              className="size-full object-cover"
            />
          </div>
          <h2
            id={titleId}
            className="anim-rush-title text-display-2 min-w-0 text-sand"
            style={{ fontSize: "clamp(1.5rem, 1.1rem + 1.6vw, 1.875rem)" }}
          >
            {hint}
          </h2>
        </div>

        <p
          id={bodyId}
          className="anim-option-in relative mt-4 max-w-[38ch] text-[15px] leading-relaxed text-sand/75"
          style={{ animationDelay: "200ms" }}
        >
          {t("rush.body")}
        </p>

        <ReadingTrack elapsedMs={elapsedMs} minReadMs={minReadMs} />

        <button
          type="button"
          onClick={reread}
          aria-disabled={!armed}
          autoFocus
          className="btn-v2 btn-v2--primary assessment-primary-action anim-option-in relative mt-6 w-full transition-opacity aria-disabled:opacity-60"
          style={{ animationDelay: "320ms" }}
          data-size="lg"
        >
          {t("rush.reread")}
        </button>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

interface ReadingTrackProps {
  elapsedMs: number;
  minReadMs: number;
}

/** Their tap vs. the reading time: a short warm fill on a long track. */
function ReadingTrack({ elapsedMs, minReadMs }: ReadingTrackProps) {
  const { t } = useLocale();
  const progress = Math.min(Math.max(elapsedMs / minReadMs, 0.04), 1);
  const yours = formatSeconds(elapsedMs);
  const needed = formatSeconds(minReadMs);

  return (
    <div
      className="anim-option-in relative mt-5"
      style={{ animationDelay: "260ms" }}
    >
      <div
        role="img"
        aria-label={t("rush.track_aria")
          .replace("{yours}", yours)
          .replace("{needed}", needed)}
        className="relative h-2.5 overflow-hidden rounded-full bg-sand/10"
      >
        <span
          className="anim-rush-fill absolute inset-y-0 start-0 rounded-full"
          style={{
            width: `${progress * 100}%`,
            background: "var(--grad-warm)",
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="mt-2 flex items-baseline justify-between gap-3 text-[13px] text-sand/60"
      >
        <span>{t("rush.track_yours").replace("{s}", yours)}</span>
        <span>{t("rush.track_needed").replace("{s}", needed)}</span>
      </div>
    </div>
  );
}

function formatSeconds(ms: number): string {
  return (Math.max(ms, 0) / 1000).toFixed(1);
}
