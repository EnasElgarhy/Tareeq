"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { wordingFor } from "@/lib/core-v2/content/wording";
import type { AxisZone } from "@/lib/core-v2/types";
import { KaiPortrait } from "./glance/KaiPortrait";
import styles from "./ReportDesign.module.css";

/* ------------------------------------------------------------------ wording */

/** Text for a report block in the current language, or null while pending. */
export function useWording() {
  const { locale } = useLocale();
  return (blockId: string) => wordingFor(locale, blockId);
}

/** Renders **bold** spans from the wording file (the question words in the CORE key). */
function withBold(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") ? (
      <strong key={i} className="font-black text-[color:var(--day-ink)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** A block's text, with optional [fill] replacements; pending blocks stay visible as a marker. */
export function Block({
  id,
  fills,
}: {
  id: string;
  fills?: Readonly<Record<string, string>>;
}) {
  const text = useWording()(id);
  if (text === null) return <Pending id={id} />;
  const filled = Object.entries(fills ?? {}).reduce(
    (current, [key, value]) => current.replace(`[${key}]`, value),
    text,
  );
  return <>{withBold(filled)}</>;
}

export function Pending({ id }: { id: string }) {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[color:var(--day-line-strong,rgba(43,36,28,0.2))] px-1.5 py-0.5 text-[11px] font-semibold">
      {t("core.pending")}
      <code className="font-mono text-[10px] opacity-70">{id}</code>
    </span>
  );
}

/* ------------------------------------------------------------------ CORE letters */

/** One colour per CORE letter, from the daybreak palette. */
export const LETTER_COLOR = {
  C: "var(--daybreak-gold-ink)",
  O: "var(--daybreak-green)",
  R: "var(--daybreak-clay)",
  E: "var(--daybreak-violet)",
} as const;
export type CoreLetter = keyof typeof LETTER_COLOR;

/** The letter as its own badge: in Arabic it must never sit inside a text line (spec §6.1). */
export function LetterBadge({ letter }: { letter: CoreLetter }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-xl font-heading text-[17px] font-black text-white"
      style={{ background: LETTER_COLOR[letter] }}
    >
      {letter}
    </span>
  );
}

/* ------------------------------------------------------------------ surfaces */

export function ReportCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] bg-[color:var(--day-card)] p-[18px] shadow-[0_8px_20px_rgba(43,36,28,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  titleId,
  introId,
}: {
  titleId: string;
  introId?: string;
}) {
  return (
    <header className="grid gap-2">
      <h2 className="daybreak-heading text-[24px] leading-tight text-[color:var(--day-ink)] lg:text-[30px]">
        <Block id={titleId} />
      </h2>
      {introId ? (
        <p className="max-w-[62ch] text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          <Block id={introId} />
        </p>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------ three-zone bar */

/**
 * The spec's bar (§6.2): side A, "A mix of both", side B, with the student's
 * zone highlighted. No numbers and no needle.
 */
export function ZoneBar({
  headId,
  sideAId,
  sideBId,
  zone,
  color,
}: {
  headId: string;
  sideAId: string;
  sideBId: string;
  zone: AxisZone;
  color: string;
}) {
  const zones: { id: string; value: AxisZone }[] = [
    { id: sideAId, value: 1 },
    { id: "BAR-MID", value: 2 },
    { id: sideBId, value: 3 },
  ];
  return (
    <div className="grid gap-2">
      <p className="text-[12.5px] font-bold text-[color:var(--day-ink)]">
        <Block id={headId} />
      </p>
      <ol className="grid grid-cols-3 gap-1.5">
        {zones.map(({ id, value }) => {
          const isChosen = value === zone;
          return (
            <li
              key={id}
              aria-current={isChosen ? "true" : undefined}
              className={`grid min-h-[52px] place-items-center rounded-[14px] px-2 py-2 text-center text-[11.5px] leading-snug ${
                isChosen
                  ? "font-bold text-white shadow-[0_6px_14px_rgba(43,36,28,0.12)]"
                  : "border border-[color:var(--day-line)] bg-[color:var(--day-inset)] text-[color:var(--day-ink-2)]"
              }`}
              style={isChosen ? { background: color } : undefined}
            >
              <Block id={id} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ Kai */

/**
 * "Discuss this with Kai" (spec §6.7): opens Kai with the section's question
 * as the entry prompt. Kai's portrait on the lavender tile, as in the deck
 * header, so the question reads as Kai asking it.
 */
export function KaiPrompt({ questionId }: { questionId: string }) {
  const question = useWording()(questionId);
  const href = question
    ? `/kai?goal=explain_results&prompt=${encodeURIComponent(question)}`
    : "/kai?goal=explain_results";
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center ${styles.kaiPrompt}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <KaiPortrait size="sm" />
        <p className="min-w-0 font-heading text-[16px] font-bold leading-snug text-[#2a1f4f]">
          <Block id={questionId} />
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[color:var(--daybreak-violet-deep)] px-4 py-2.5 text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1f4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e3dcf5]"
      >
        <Block id="KAI-BUTTON" />
        <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
      </Link>
    </div>
  );
}
