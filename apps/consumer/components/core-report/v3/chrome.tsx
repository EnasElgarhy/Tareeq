"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Block, Pending, useWording } from "../parts";
import styles from "./report.module.css";

export type CoreLetter = "C" | "O" | "R" | "E";
export const CORE_LETTERS: readonly CoreLetter[] = ["C", "O", "R", "E"];

/** Kai art per screen, generated to match the website's Kai (public/report/kai). */
export type HeroArt = "open" | "glance" | "curiosity" | "meaning" | "steps" | "parents";

/**
 * The night band that opens every screen (canvas B1–B5): Kai art, an
 * eyebrow, the section's one heading and its intro, then a wave into paper.
 */
export function SectionHero({
  art,
  eyebrow,
  titleId,
  title,
  introId,
  children,
}: {
  art: HeroArt;
  eyebrow?: string;
  titleId?: string;
  title?: ReactNode;
  introId?: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.hero}>
      <picture>
        <source media="(min-width: 640px)" srcSet={`/report/kai/hero-${art}-v1.webp`} />
        <img
          src={`/report/kai/hero-${art}-v1-sm.webp`}
          alt=""
          width={1200}
          height={805}
          fetchPriority={art === "open" ? "high" : undefined}
          className={styles.heroArt}
        />
      </picture>
      <span aria-hidden="true" className={styles.heroArtFade} />
      <div className={styles.heroText}>
        {eyebrow ? <p className={styles.heroEyebrow}>{eyebrow}</p> : null}
        <h2 className={`daybreak-heading ${styles.heroTitle}`}>
          {titleId ? <Block id={titleId} /> : title}
        </h2>
        {introId ? (
          <p className={styles.heroIntro}>
            <Block id={introId} />
          </p>
        ) : null}
        {children}
      </div>
      <svg
        viewBox="0 0 390 34"
        preserveAspectRatio="none"
        aria-hidden="true"
        className={styles.heroWave}
      >
        <path d="M0 20 C 80 2, 160 34, 240 14 S 360 2, 390 12 L390 34 L0 34 Z" fill="currentColor" />
      </svg>
    </header>
  );
}

/**
 * S1-KEY-x reads "C · Curiosities: what sparks your curiosity" in English
 * and "الفضول: ما الذي يثير فضولك" in Arabic: the name sits before the
 * colon, after any "C · " prefix; the description follows it.
 */
export function splitKeyLine(text: string): { name: string; rest: string } {
  const colon = text.indexOf(":");
  const head = colon < 0 ? text : text.slice(0, colon);
  const name = head.includes("·") ? head.slice(head.indexOf("·") + 1) : head;
  return { name: name.trim(), rest: colon < 0 ? "" : text.slice(colon + 1).trim() };
}

/** The question word in each key line, set in bold (spec §6.1). */
const KEY_QUESTION_WORDS: Record<"en" | "ar", Record<CoreLetter, string>> = {
  en: { C: "what", O: "how", R: "why", E: "where" },
  ar: { C: "ما", O: "كيف", R: "لماذا", E: "أين" },
};

/** "Curiosities", "Operating style" …: the letter's name from file 04. */
export function LetterName({ letter }: { letter: CoreLetter }) {
  const text = useWording()(`S1-KEY-${letter}`);
  if (text === null) return <Pending id={`S1-KEY-${letter}`} />;
  return <>{splitKeyLine(text).name}</>;
}

/** The key line's description, its question word in bold. */
export function LetterQuestion({ letter }: { letter: CoreLetter }) {
  const { locale } = useLocale();
  const text = useWording()(`S1-KEY-${letter}`);
  if (text === null) return <Pending id={`S1-KEY-${letter}`} />;
  const { rest } = splitKeyLine(text);
  const word = KEY_QUESTION_WORDS[locale === "ar" ? "ar" : "en"][letter];
  const at = rest.indexOf(word);
  if (at < 0) return <>{rest}</>;
  return (
    <>
      {rest.slice(0, at)}
      <strong className="font-extrabold text-[color:var(--r-ink)]">{word}</strong>
      {rest.slice(at + word.length)}
    </>
  );
}

/** The pill that heads each At a glance card: one violet for every letter. */
export function LetterLabel({ letter }: { letter: CoreLetter }) {
  const { locale } = useLocale();
  return (
    <span className={styles.label}>
      {/* Arabic lines carry no Latin letters (staging corrections v4, row 15). */}
      {locale === "ar" ? null : (
        <span aria-hidden="true" className={styles.letter}>
          {letter}
        </span>
      )}
      <LetterName letter={letter} />
    </span>
  );
}
