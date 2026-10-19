"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KaiAvatar } from "@/components/kai/KaiAvatar";
import { wordingFor } from "@/lib/core-v2/content/wording";
import type { AxisZone } from "@/lib/core-v2/types";
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

/**
 * Some file 04 blocks open with their own label ("Watch: search for…",
 * "Try:"). `part` splits at that first colon so the label can be the step
 * heading: "lead" is the label, "rest" the sentence after it.
 */
function pickPart(text: string, part: "all" | "lead" | "rest"): string {
  if (part === "all") return text;
  const colon = text.indexOf(":");
  if (colon < 0) return part === "lead" ? text : "";
  if (part === "lead") return text.slice(0, colon).trim();
  // The sentence now starts the paragraph, so it takes a capital.
  const rest = text.slice(colon + 1).trim();
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** A block's text, with optional [fill] replacements; pending blocks stay visible as a marker. */
export function Block({
  id,
  fills,
  part = "all",
}: {
  id: string;
  fills?: Readonly<Record<string, string>>;
  part?: "all" | "lead" | "rest";
}) {
  const text = useWording()(id);
  if (text === null) return <Pending id={id} />;
  const filled = Object.entries(fills ?? {}).reduce(
    (current, [key, value]) => current.split(`[${key}]`).join(value),
    text,
  );
  return <>{withBold(pickPart(filled, part))}</>;
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
/** How long Kai "types" before her message appears, then how long she talks. */
const KAI_TYPING_MS = 1100;
const KAI_TALKING_MS = 1700;

type KaiPhase = "waiting" | "typing" | "talking" | "done";

/** The section question travels as ENTRY_PROMPT (`entry`); a tapped answer as the first message. */
function kaiHref(questionId: string, answer: string | null): string {
  const base = `/kai?goal=explain_results&entry=${encodeURIComponent(questionId)}`;
  return answer ? `${base}&prompt=${encodeURIComponent(answer)}` : base;
}

/**
 * Kai asks the student a question about this chapter. When the card first
 * scrolls into view she "types", then her message appears while she talks,
 * then one-tap answers start a real conversation with that answer.
 */
export function KaiPrompt({
  questionId,
  answers = [],
}: {
  questionId: string;
  /** Ready-made replies; each opens the Kai chat with it as the first message. */
  answers?: readonly string[];
}) {
  const { t } = useLocale();
  const cardRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<KaiPhase>("waiting");

  useEffect(() => {
    const node = cardRef.current;
    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!node || isReduced || !("IntersectionObserver" in window)) {
      setPhase("done");
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setPhase("typing");
        timers.push(setTimeout(() => setPhase("talking"), KAI_TYPING_MS));
        timers.push(
          setTimeout(() => setPhase("done"), KAI_TYPING_MS + KAI_TALKING_MS),
        );
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const isMessageShown = phase === "talking" || phase === "done";

  return (
    <aside ref={cardRef} className={styles.kaiPrompt} data-phase={phase}>
      <div className={styles.kaiHeader}>
        <KaiAvatar size={44} isTalking={phase === "talking"} />
        <p className={styles.kaiName}>
          {t("home.tab.kai")}
          <span>
            {isMessageShown ? t("core.kai.asks") : t("core.kai.typing")}
          </span>
        </p>
      </div>

      <div className={styles.kaiBubbleSlot}>
        <span
          aria-hidden="true"
          className={styles.kaiTyping}
          data-visible={!isMessageShown}
        >
          <i />
          <i />
          <i />
        </span>
        <p
          className={`font-heading ${styles.kaiBubble}`}
          data-visible={isMessageShown}
        >
          <Block id={questionId} />
        </p>
      </div>

      <div className={styles.kaiAnswers} data-visible={phase === "done"}>
        {answers.map((answer) => (
          <Link
            key={answer}
            href={kaiHref(questionId, answer)}
            className={styles.kaiChip}
          >
            {answer}
          </Link>
        ))}
        <Link href={kaiHref(questionId, null)} className={styles.kaiMore}>
          <Block id="KAI-BUTTON" />
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="rtl:-scale-x-100"
          />
        </Link>
      </div>
    </aside>
  );
}
