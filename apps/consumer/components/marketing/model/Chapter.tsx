import type { ReactNode } from "react";
import { FadeIn } from "../Shared";
import type { Pillar } from "./modelContent";

interface ChapterProps {
  pillar: Pillar;
  /** Puts the visual first on large screens so chapters alternate sides. */
  isFlipped?: boolean;
  children: ReactNode;
}

/** One CORE pillar: a short text column beside its visual. */
export function Chapter({ pillar, isFlipped = false, children }: ChapterProps) {
  const PillarIcon = pillar.icon;
  const headingId = `${pillar.id}-heading`;

  return (
    <section
      id={pillar.id}
      aria-labelledby={headingId}
      className="scroll-mt-24 py-16 lg:py-24"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <FadeIn className={`lg:col-span-5 ${isFlipped ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-4">
            <span
              className="flex size-14 items-center justify-center rounded-2xl"
              style={{
                background: `${pillar.dayAccent}18`,
                color: pillar.dayAccent,
              }}
            >
              <PillarIcon size={30} weight="duotone" aria-hidden="true" />
            </span>
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: pillar.dayAccent }}
            >
              {pillar.letter} · {pillar.name}
            </p>
          </div>
          <h2
            id={headingId}
            className="font-heading mt-6 text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--day-ink)]"
          >
            {pillar.question}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--day-ink-2)]">
            {pillar.intro}
          </p>
          <ul className="mt-8 space-y-4">
            {pillar.points.map(({ icon: PointIcon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--day-card)] shadow-[var(--day-shadow-card)]"
                  style={{ color: pillar.dayAccent }}
                >
                  <PointIcon size={19} weight="duotone" aria-hidden="true" />
                </span>
                <span className="text-[0.9375rem] font-medium text-[var(--day-ink)]">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn
          delay={0.1}
          className={`lg:col-span-7 ${isFlipped ? "lg:order-1" : ""}`}
        >
          {children}
        </FadeIn>
      </div>
    </section>
  );
}
