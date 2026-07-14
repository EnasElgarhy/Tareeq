import type { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  /** Optional id for aria-live wiring or labelled-by */
  id?: string;
  className?: string;
  /** Compact variant — smaller padding + tighter type */
  tight?: boolean;
  /** Horizontal position of the tail. `start` (default) sits 28px from
   *  the start edge; `center` puts it dead-center. */
  tailPosition?: "start" | "center";
  /** Vertical edge the tail attaches to. `top` (default) points UP at
   *  something above; `bottom` points DOWN at a character below. */
  tailEdge?: "top" | "bottom";
  /** Surface tone — `dark` (default) uses the cream bubble for plum
   *  surfaces; `light` uses a white bubble with subtle shadow for cream
   *  pages so it still reads against the warm radial backdrop. */
  surface?: "dark" | "light";
}

/**
 * The voice of the assessment.
 *
 * DM Serif Display Italic — used ONLY for the question. The little
 * triangular tail makes Kai "speak" the question. The bubble can sit
 * above or below the avatar; the tail edge flips accordingly.
 */
export function SpeechBubble({
  children,
  id,
  className,
  tight,
  tailPosition = "start",
  tailEdge = "top",
  surface = "dark",
}: SpeechBubbleProps) {
  return (
    <div
      className={`tareeq-bubble ${className ?? ""}`}
      data-tight={tight || undefined}
      data-tail={tailPosition}
      data-tail-edge={tailEdge}
      data-surface={surface}
      role="note"
    >
      <p
        id={id}
        className={
          tight
            ? `text-question-tight m-0 ${surface === "light" ? "text-plum-deep" : "text-plum-deep"}`
            : "tareeq-bubble__q"
        }
      >
        {children}
      </p>
    </div>
  );
}
