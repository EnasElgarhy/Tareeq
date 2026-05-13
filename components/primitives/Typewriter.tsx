"use client";

import {
  createElement,
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import { prefersReducedMotion } from "@/lib/audio/ui-sounds";

interface TypewriterProps {
  /** The full text to type. Newlines are preserved. */
  text: string;
  /** Milliseconds between characters. Default 22. */
  speed?: number;
  /** Delay before the first character starts. Default 0. */
  startDelay?: number;
  /** Fires once when the full text has been typed out. */
  onComplete?(): void;
  /** Show a blinking caret while typing (and briefly after). */
  showCaret?: boolean;
  className?: string;
  /** Inline styles forwarded to the wrapping element. */
  style?: CSSProperties;
  /** Tag used to wrap the visible text. Default `p`. */
  as?: ElementType;
}

/**
 * Typewriter — character-by-character text reveal.
 *
 * Respects `prefers-reduced-motion: reduce` — collapses to the full
 * text instantly while still firing `onComplete`. The full text always
 * sits in `aria-label` so screen readers receive it as one phrase
 * instead of partial reads.
 */
export function Typewriter({
  text,
  speed = 22,
  startDelay = 0,
  onComplete,
  showCaret = true,
  className,
  style,
  as: Tag = "p",
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const reduced =
    typeof window !== "undefined" ? prefersReducedMotion() : false;

  // Start delay
  useEffect(() => {
    if (reduced) {
      setIndex(text.length);
      onComplete?.();
      return;
    }
    const t = window.setTimeout(() => setStarted(true), startDelay);
    return () => window.clearTimeout(t);
  }, [reduced, startDelay, text.length, onComplete]);

  // Character tick
  useEffect(() => {
    if (!started || reduced) return;
    if (index >= text.length) {
      onComplete?.();
      return;
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), speed);
    return () => window.clearTimeout(t);
  }, [started, index, text, speed, reduced, onComplete]);

  const visible = text.slice(0, index);
  const isTyping = index < text.length;

  return createElement(
    Tag,
    { "aria-label": text, className, style },
    <span aria-hidden="true">
      {visible}
      {showCaret && isTyping ? (
        <span className="anim-caret-blink ms-0.5 inline-block w-[2px] translate-y-[2px] bg-current">
          &nbsp;
        </span>
      ) : null}
    </span>,
  );
}
