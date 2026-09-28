import type { ReactNode } from "react";

/**
 * A borderless section inside a Kai answer surface. The redesign renders one
 * response as a single flowing "mentor note" — sections are separated by
 * whitespace and typography, NOT boxes. A small, quiet heading introduces the
 * section; the content below carries the substance. No card, no border.
 */
export function AnswerSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title ? (
        <h4 className="daybreak-heading mb-1.5 text-[15px] leading-tight text-[color:var(--day-ink,#2a2118)]">
          {title}
        </h4>
      ) : null}
      {children}
    </section>
  );
}

/** Flat bulleted list — the default for points/skills/steps-as-text. */
export function AnswerBullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">
          <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--day-accent,#6e48e4)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
