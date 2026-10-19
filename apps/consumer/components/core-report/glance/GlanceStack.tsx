"use client";

import { ArrowLeft, ArrowRight, Hand, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import styles from "../ReportDesign.module.css";

/** Drag distance that sends the top card off the stack. */
const SWIPE_THRESHOLD_PX = 90;
/** How many cards peek out under the top one. */
const PEEK_DEPTH = 2;
/** Matches the .stackCard transition so the next card lands after the fling. */
const FLING_MS = 280;
/** Length of the one-time sideways nudge that shows the cards can be swiped. */
const NUDGE_MS = 1600;

export interface StackCard {
  id: string;
  letter: string;
  label: string;
  color: string;
  content: ReactNode;
}

type Fling = -1 | 1 | null;

/**
 * At a glance as a deck, like profile cards: one card on top, the next
 * ones peeking underneath. Swipe or drag the top card away, or use the
 * buttons, dots or arrow keys. `active` is controlled so the C·O·R·E key
 * in the header can jump straight to a card.
 */
export function GlanceStack({
  cards,
  active,
  onActiveChange,
}: {
  cards: readonly StackCard[];
  active: number;
  onActiveChange(index: number): void;
}) {
  const { t, dir } = useLocale();
  const [dragX, setDragX] = useState(0);
  const [fling, setFling] = useState<Fling>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number | null>(null);
  /** Latest drag distance, read on release before React re-renders. */
  const dragDistance = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topCard = useRef<HTMLDivElement | null>(null);
  const [topHeight, setTopHeight] = useState<number | null>(null);
  const deck = useRef<HTMLDivElement | null>(null);
  const [isNudging, setIsNudging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isLast = active === cards.length - 1;

  // Cards underneath take the top card's height, so only their edges peek
  // out below it however long each card's own content is.
  useEffect(() => {
    const node = topCard.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setTopHeight(entry.borderBoxSize[0]?.blockSize ?? node.offsetHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // The first time the deck comes into view, sway the top card once so it
  // reads as swipeable. Skipped for reduced motion and once the student
  // has already moved a card.
  useEffect(() => {
    const node = deck.current;
    if (
      !node ||
      hasInteracted ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setIsNudging(true);
        stopTimer = setTimeout(() => setIsNudging(false), NUDGE_MS);
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (stopTimer) clearTimeout(stopTimer);
    };
    // Runs once per mount; a later interaction only cancels a pending nudge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(cards.length - 1, index));
      setHasInteracted(true);
      setIsNudging(false);
      setDragX(0);
      setFling(null);
      onActiveChange(bounded);
    },
    [cards.length, onActiveChange],
  );

  const advance = useCallback(
    (direction: -1 | 1) => {
      if (isLast) {
        setDragX(0);
        return;
      }
      setFling(direction);
      timer.current = setTimeout(() => goTo(active + 1), FLING_MS);
    },
    [active, goTo, isLast],
  );

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (fling) return;
    setHasInteracted(true);
    setIsNudging(false);
    startX.current = event.clientX;
    setIsDragging(true);
    dragDistance.current = 0;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    dragDistance.current = event.clientX - startX.current;
    setDragX(dragDistance.current);
  }

  function onPointerUp() {
    if (startX.current === null) return;
    const distance = dragDistance.current;
    startX.current = null;
    dragDistance.current = 0;
    setIsDragging(false);
    if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) {
      advance(distance > 0 ? 1 : -1);
    } else {
      setDragX(0);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) {
      event.preventDefault();
      advance(dir === "rtl" ? -1 : 1);
    } else if (event.key === backward) {
      event.preventDefault();
      goTo(active - 1);
    }
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("core.stack.label")}
      className={styles.stack}
      onKeyDown={onKeyDown}
    >
      {/* All four cards named up front, so the deck reads as a set of four. */}
      <div className={styles.stackTabs}>
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            onClick={() => goTo(index)}
            aria-current={index === active ? "true" : undefined}
            aria-label={`${index + 1} / ${cards.length}: ${card.label}`}
            className={styles.stackTab}
            style={{ ["--tab-color" as string]: card.color }}
          >
            <span aria-hidden="true" className={styles.stackTabLetter}>
              {card.letter}
            </span>
            <span className={styles.stackTabLabel}>{card.label}</span>
          </button>
        ))}
      </div>

      <div ref={deck} className={styles.stackDeck}>
        {cards.map((card, index) => {
          const depth = index - active;
          const isTop = depth === 0;
          const isVisible = depth >= 0 && depth <= PEEK_DEPTH;
          const offsetX = isTop
            ? fling
              ? `${fling * 125}%`
              : `${dragX}px`
            : "0px";
          const rotate = isTop ? (fling ? fling * 14 : dragX / 18) : 0;
          return (
            <div
              key={card.id}
              ref={isTop ? topCard : undefined}
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${cards.length}: ${card.label}`}
              aria-hidden={!isTop}
              inert={!isTop}
              data-dragging={isTop && isDragging}
              data-nudging={isTop && isNudging}
              className={styles.stackCard}
              style={{
                zIndex: cards.length - Math.max(depth, 0),
                height: !isTop && topHeight ? topHeight : undefined,
                overflow: isTop ? undefined : "hidden",
                visibility: isVisible ? "visible" : "hidden",
                opacity: isTop && fling ? 0 : 1,
                transform: isTop
                  ? `translateX(${offsetX}) rotate(${rotate}deg)`
                  : `translateY(${depth * 16}px) scale(${1 - depth * 0.045})`,
              }}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
            >
              {card.content}
            </div>
          );
        })}
      </div>

      {/* Pinned to the bottom of the screen while a tall card scrolls, so
       * the way on is always in reach and the card visibly continues. */}
      <div className={styles.stackControls}>
        <StepButtons
          isFirst={active === 0}
          isLast={isLast}
          onPrevious={() => goTo(active - 1)}
          onNext={() => advance(dir === "rtl" ? -1 : 1)}
          onRestart={() => goTo(0)}
        >
          <p className={styles.stackHint} aria-live="polite">
            <span className={styles.stackHintCount}>
              {t("core.stack.count")
                .replace("{current}", String(active + 1))
                .replace("{total}", String(cards.length))}
            </span>
            {hasInteracted ? null : (
              <span className={styles.stackHintSwipe}>
                <Hand size={13} aria-hidden="true" />
                {t("core.stack.hint")}
              </span>
            )}
          </p>
        </StepButtons>
      </div>
    </section>
  );
}

function StepButtons({
  isFirst,
  isLast,
  onPrevious,
  onNext,
  onRestart,
  children,
}: {
  isFirst: boolean;
  isLast: boolean;
  onPrevious(): void;
  onNext(): void;
  onRestart(): void;
  /** Shown between the two buttons. */
  children?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst}
        className={styles.stackButton}
        aria-label={t("core.stack.previous")}
      >
        <ArrowLeft size={18} aria-hidden="true" className="rtl:-scale-x-100" />
      </button>
      {children}
      {isLast ? (
        <button
          type="button"
          onClick={onRestart}
          className={styles.stackButton}
          aria-label={t("core.stack.restart")}
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className={`${styles.stackButton} ${styles.stackButtonPrimary}`}
          aria-label={t("core.stack.next")}
        >
          <ArrowRight
            size={18}
            aria-hidden="true"
            className="rtl:-scale-x-100"
          />
        </button>
      )}
    </>
  );
}
