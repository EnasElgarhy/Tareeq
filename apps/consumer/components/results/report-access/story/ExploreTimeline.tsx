"use client";

import { Lock } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";

interface Stop {
  number: string;
  titleKey: StringKey;
  unlocked: boolean;
}

/** Defocus of the first locked row, and how much each deeper row adds. */
const LOCKED_BLUR_PX = 1.5;
const LOCKED_BLUR_STEP_PX = 1.6;

const STOPS: Stop[] = [
  { number: "01", titleKey: "paywall.explore.stop1", unlocked: true },
  { number: "02", titleKey: "paywall.explore.stop2", unlocked: true },
  { number: "03", titleKey: "paywall.explore.stop3", unlocked: false },
  { number: "04", titleKey: "paywall.explore.stop4", unlocked: false },
  { number: "05", titleKey: "paywall.explore.stop5", unlocked: false },
  { number: "06", titleKey: "paywall.explore.stop6", unlocked: false },
  { number: "07", titleKey: "paywall.explore.stop7", unlocked: false },
  { number: "08", titleKey: "paywall.explore.stop8", unlocked: false },
  { number: "09", titleKey: "paywall.explore.stop9", unlocked: false },
];

function StopRow({
  stop,
  isFirst,
  isLast,
  blurPx = 0,
}: {
  stop: Stop;
  isFirst: boolean;
  isLast: boolean;
  /** Defocus for the locked tail; 0 keeps the row crisp. */
  blurPx?: number;
}) {
  const { t } = useLocale();
  const railLine = stop.unlocked
    ? "rgba(109,91,168,0.4)"
    : "rgba(42,33,24,0.12)";

  return (
    <div
      className="flex h-16 gap-4"
      style={blurPx > 0 ? { filter: `blur(${blurPx}px)` } : undefined}
    >
      <div className="flex w-7 shrink-0 flex-col items-center">
        {!isFirst && <span className="h-3 w-px" style={{ background: railLine }} />}
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full ${
            stop.unlocked
              ? "bg-[#6d5ba8]"
              : "border border-[rgba(43,36,28,0.12)] bg-[color:var(--day-inset)]"
          }`}
        >
          {stop.unlocked ? (
            <span className="text-[9px] font-bold leading-[13.5px] text-white">
              {stop.number}
            </span>
          ) : (
            <Lock
              size={12}
              strokeWidth={1.6}
              className="text-[color:var(--day-ink-3)] opacity-40"
              aria-hidden="true"
            />
          )}
        </span>
        {!isLast && (
          <span className="w-px flex-1" style={{ background: railLine }} />
        )}
      </div>

      <div
        className={`mb-0 flex h-14 flex-1 flex-col justify-center rounded-2xl px-4 ${
          stop.unlocked
            ? "border border-[rgba(109,91,168,0.2)] bg-[rgba(109,91,168,0.08)]"
            : "border border-[rgba(43,36,28,0.07)] bg-[color:var(--day-card)] opacity-60"
        }`}
      >
        <p
          className={`text-[9px] font-extrabold leading-[11px] tracking-[0.12em] ${
            stop.unlocked ? "text-[#6d5ba8]" : "text-[#9e8e7e]"
          }`}
        >
          {stop.number}
        </p>
        <p
          className={`mt-0.5 text-[13px] font-bold leading-[17px] ${
            stop.unlocked
              ? "text-[color:var(--day-ink)]"
              : "text-[#5c5142]"
          }`}
        >
          {t(stop.titleKey)}
          {!stop.unlocked && (
            <span className="sr-only"> — {t("paywall.explore.locked")}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * The Figma frame's "There's more to explore" rail: stops 01–02 open, the
 * remaining seven locked and defocused. The paywall sheet slides over the
 * lower half, so this list is built at a fixed row height to keep that
 * overlap exact.
 *
 * The locked tail is really blurred here, on the content itself: a
 * `backdrop-filter` on the sliding sheet cannot sample content inside the
 * app shell's scroll well, so the blur lives on the locked rows and the
 * sheet lays its cream veil over them.
 */
export function ExploreTimeline() {
  const { t } = useLocale();
  const openStops = STOPS.filter((stop) => stop.unlocked);
  const lockedStops = STOPS.filter((stop) => !stop.unlocked);

  return (
    <section aria-labelledby="explore-heading" className="pt-8">
      <div>
        <p
          className="text-[10px] font-bold uppercase leading-[13px] tracking-[0.18em]"
          style={{ color: "#7a4a21" }}
        >
          {t("paywall.explore.eyebrow")}
        </p>
        <h2
          id="explore-heading"
          className="daybreak-heading mt-1 text-[22px] font-extrabold leading-[27px] text-[color:var(--day-ink)]"
        >
          {t("paywall.explore.title")}
        </h2>
        <p
          className="mt-2 max-w-[52ch] text-[13px] font-normal leading-[18px] text-[color:var(--day-ink-3)]"
        >
          {t("paywall.explore.sub")}
        </p>
      </div>

      <div className="mt-6">
        {openStops.map((stop, index) => (
          <StopRow
            key={stop.number}
            stop={stop}
            isFirst={index === 0}
            isLast={false}
          />
        ))}

        {/* The rest of the report, under a progressive frost: each locked row
         * is a little more defocused than the one above it. */}
        {lockedStops.map((stop, index) => (
          <StopRow
            key={stop.number}
            stop={stop}
            isFirst={false}
            isLast={index === lockedStops.length - 1}
            blurPx={LOCKED_BLUR_PX + index * LOCKED_BLUR_STEP_PX}
          />
        ))}
      </div>
    </section>
  );
}
