import type { ReactNode } from "react";

export interface StepDot {
  n: number;
  /** One- or two-word label only. Keep it punchy. */
  label: string;
  /** Scene illustration component — sized small */
  scene: ReactNode;
}

interface StepStripProps {
  steps: ReadonlyArray<StepDot>;
}

/**
 * Horizontal 3-step strip. Each step is a small illustrated tile + a
 * single-word label. The cyan→coral path line connects them across
 * the strip.
 *
 * Used on the onboarding screen as a visual flick — replacing a heavy
 * vertical text block. "Show, don't tell."
 */
export function StepStrip({ steps }: StepStripProps) {
  return (
    <ol
      aria-label="How Tareeq works"
      className="relative grid grid-cols-3 gap-3"
    >
      {/* Connector line behind the tiles */}
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-[34px] h-px bg-gradient-to-r from-cyan-brand/0 via-cyan-brand/55 to-coral/55"
      />
      {steps.map((step, i) => (
        <li
          key={step.n}
          className="anim-option-in flex flex-col items-center gap-2"
          style={{ animationDelay: `${160 + i * 110}ms` }}
        >
          <div className="relative grid size-[68px] place-items-center rounded-xl border border-white/12 bg-white/[0.05] p-1.5">
            {step.scene}
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-cream text-[0.65rem] font-bold leading-none text-plum-deep ring-2 ring-cyan-brand/45"
            >
              {step.n}
            </span>
          </div>
          <p className="text-center text-caption leading-tight text-cream/80">
            {step.label}
          </p>
        </li>
      ))}
    </ol>
  );
}
