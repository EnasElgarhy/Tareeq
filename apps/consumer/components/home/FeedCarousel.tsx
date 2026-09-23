"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface FeedCarouselProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  /**
   * Guided-navigation chrome for the scroll row: edge arrows that glide
   * per press plus edge fades that appear only while there is more to
   * reveal. Opt-in per surface.
   */
  hasControls?: boolean;
  /**
   * Where the arrows ride on phones. `"center"` (default) keeps them on
   * the row middle; `"media"` pins them to the card illustration band so
   * they never sit on the title or action — for image-topped tiles like
   * the career cards. Full-bleed tiles (curiosity map) keep `"center"`.
   */
  arrowAnchor?: "center" | "media";
}

/** Cards travelled per arrow press on wide layouts. */
const SCROLL_CARDS = 2.5;
/**
 * Narrow viewports use the one-card rhythm (a single press advances exactly
 * one card, so snap always lands aligned). Matches the md: breakpoint where
 * the tiles switch to their compact multi-card widths.
 */
const NARROW_VIEWPORT_PX = 768;
/** px of slack before an edge counts as reached (subpixel/zoom safety). */
const EDGE_SLACK_PX = 4;
/** Fallback snap restore if the `scrollend` event never fires. */
const SNAP_RESTORE_MS = 700;

/**
 * Shared arrow chrome: small white circle, violet chevron, quiet shadow.
 * The illustration-band pin (`max-md:top`) is appended per carousel via
 * `arrowAnchor` (see the prop comment).
 */
const ARROW_BUTTON =
  "absolute top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[rgba(43,36,28,0.12)] bg-white/90 text-[color:var(--daybreak-violet)] shadow-[0_2px_10px_rgba(34,18,72,0.15)] backdrop-blur-[2px] transition-all duration-200 hover:bg-white hover:shadow-[0_4px_14px_rgba(34,18,72,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--daybreak-violet)] active:scale-90 disabled:pointer-events-none disabled:opacity-0 md:size-9";

/** Phones: ride the 126px illustration band instead of the row middle. */
const ARROW_MEDIA_ANCHOR = "max-md:top-[76px]";

/** One card step: first card width plus the row gap. */
function cardStep(track: HTMLElement): number {
  const first = track.querySelector(":scope > *");
  const cardWidth = first instanceof HTMLElement ? first.offsetWidth : 0;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap);
  return (cardWidth || 190) + (Number.isFinite(gap) ? gap : 12);
}

/**
 * A horizontally-scrolling section: a title row plus a card row that snaps
 * as you swipe. The track stays within the content well because that well
 * owns vertical scrolling and clips horizontal overflow.
 */
export function FeedCarousel({
  title,
  subtitle,
  badge,
  children,
  hasControls = false,
  arrowAnchor = "center",
}: FeedCarouselProps) {
  const arrowClass =
    arrowAnchor === "media"
      ? `${ARROW_BUTTON} ${ARROW_MEDIA_ANCHOR}`
      : ARROW_BUTTON;
  const { dir, t } = useLocale();
  const isRTL = dir === "rtl";
  const trackRef = useRef<HTMLDivElement>(null);
  const snapTimer = useRef<number | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    if (max <= EDGE_SLACK_PX) {
      setCanGoBack(false);
      setCanGoNext(false);
      return;
    }
    // scrollLeft runs 0..max in LTR and 0..-max in RTL, so the magnitude
    // from the start edge works for both.
    const travelled = Math.abs(track.scrollLeft);
    setCanGoBack(travelled > EDGE_SLACK_PX);
    setCanGoNext(travelled < max - EDGE_SLACK_PX);
  }, []);

  // Re-check after every render (identical values bail out of setState) so
  // asynchronously-resolved cards are picked up without keying observers
  // on children identity.
  useEffect(() => {
    if (hasControls) updateEdges();
  });

  useEffect(() => {
    if (!hasControls) return;
    const track = trackRef.current;
    if (!track) return;
    updateEdges();
    const handleScroll = () => updateEdges();
    track.addEventListener("scroll", handleScroll, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    const frame = requestAnimationFrame(updateEdges);
    const settle = window.setTimeout(updateEdges, 600);
    return () => {
      track.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [hasControls, updateEdges]);

  useEffect(
    () => () => {
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    },
    [],
  );

  function handleScrollToward(forward: boolean) {
    const track = trackRef.current;
    if (!track) return;
    // Forward follows reading order, i.e. toward inline-end: negative
    // scrollLeft in RTL, positive in LTR.
    const direction = (forward ? 1 : -1) * (isRTL ? -1 : 1);
    // Mandatory snap would fight the smooth glide (a multi-card step is not
    // a snap point), so suspend it until the scroll settles; restoring it
    // lets the row land aligned on a card boundary.
    const restoreSnap = () => {
      if (snapTimer.current !== null) {
        window.clearTimeout(snapTimer.current);
        snapTimer.current = null;
      }
      track.style.scrollSnapType = "";
      updateEdges();
    };
    track.style.scrollSnapType = "none";
    track.addEventListener("scrollend", restoreSnap, { once: true });
    snapTimer.current = window.setTimeout(restoreSnap, SNAP_RESTORE_MS);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cards = window.innerWidth < NARROW_VIEWPORT_PX ? 1 : SCROLL_CARDS;
    track.scrollBy({
      left: cardStep(track) * cards * direction,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  // Arrows sit on the inline edges and point along reading order, so the
  // forward chevron is on the left in Arabic and on the right in English.
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <section className="daybreak-reveal grid gap-3">
      <div className="flex items-center gap-2">
        <h2 className="daybreak-heading text-[22px] leading-tight text-[color:var(--day-ink)]">
          {title}
        </h2>
        {badge}
      </div>
      {subtitle ? (
        <p className="-mt-1 text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {subtitle}
        </p>
      ) : null}
      {/* min-w-0: as a grid item the wrapper must be allowed to shrink
          below its content (the scroll row handles the overflow itself,
          like the bare row did before this wrapper existed). */}
      <div className="relative min-w-0">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        {hasControls ? (
          <>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 start-0 z-10 w-8 transition-opacity duration-300 ${canGoBack ? "opacity-100" : "opacity-0"}`}
              style={{
                background: `linear-gradient(to ${isRTL ? "left" : "right"}, var(--day-bg, #f4eee3) 0%, transparent 100%)`,
              }}
            />
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 end-0 z-10 w-8 transition-opacity duration-300 ${canGoNext ? "opacity-100" : "opacity-0"}`}
              style={{
                background: `linear-gradient(to ${isRTL ? "right" : "left"}, var(--day-bg, #f4eee3) 0%, transparent 100%)`,
              }}
            />
            <button
              type="button"
              aria-label={t("home.carousel.previous")}
              disabled={!canGoBack}
              onClick={() => handleScrollToward(false)}
              className={`${arrowClass} start-1.5`}
            >
              <BackIcon size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t("home.carousel.next")}
              disabled={!canGoNext}
              onClick={() => handleScrollToward(true)}
              className={`${arrowClass} end-1.5`}
            >
              <NextIcon size={16} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
