import type { ReactNode } from "react";

export interface PathStep {
  /** 1-indexed step number, displayed on the station */
  n: number;
  title: string;
  body: string;
  /** Illustrated icon tile rendered to the left of the title (40px) */
  icon: ReactNode;
}

interface PathStepsProps {
  steps: ReadonlyArray<PathStep>;
}

/**
 * Vertical step timeline — Mimo-style.
 *
 *   [icon]  Step title       <- bold, 16px
 *     ║     Description      <- two-line space below
 *     ║
 *     ║
 *   [icon]  Step title
 *     ║     Description
 *     ║
 *     ║
 *   [icon]  Step title
 *           Description
 *
 * One continuous thick lavender bar sits behind the icon column, running
 * from the first icon to the last. Icons sit on top (z-10). The bar is
 * inset slightly so the first and last icons "cap" it visually.
 */
export function PathSteps({ steps }: PathStepsProps) {
  return (
    <ol
      aria-label="How Tareeq works"
      className="relative grid gap-7 ps-1"
    >
      {/* Continuous thick connector line behind all icons.
       *  Positioned at the center of the 40px icon column (~20px from start).
       *  Insets ~20px top/bottom so the first and last icons cap the bar. */}
      <span
        aria-hidden="true"
        className="absolute start-[16px] top-5 bottom-5 w-2 rounded-full bg-lavender-mist/25"
      />

      {steps.map((step, i) => (
        <li
          key={step.n}
          className="anim-option-in relative grid grid-cols-[40px_1fr] items-start gap-4"
          style={{ animationDelay: `${140 + i * 110}ms` }}
        >
          {/* Icon — sits on top of the connector bar */}
          <div className="relative z-10 shrink-0 drop-shadow-[0_6px_14px_rgba(15,8,36,0.45)]">
            {step.icon}
          </div>

          {/* Body */}
          <div className="pt-0.5 pb-1">
            <h3 className="text-[17px] font-bold leading-snug tracking-[-0.012em] text-cream">
              {step.title}
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-cream/65">
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
