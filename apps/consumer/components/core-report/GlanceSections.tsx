"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { DiscoveryCover } from "./DiscoveryCover";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { CuriosityTile } from "./glance/CuriosityTile";
import {
  MotivatorsCard,
  SettingCard,
  WorkStyleCard,
} from "./glance/GlanceCards";
import { GlanceHeader } from "./glance/GlanceHeader";
import { GlanceStack, type StackCard } from "./glance/GlanceStack";
import { DeckCard } from "./glance/deck";
import { LETTER_FILL } from "./glance/palette";
import { Block, Pending, useWording } from "./parts";
import styles from "./ReportDesign.module.css";

const KEY_LETTERS = ["C", "O", "R", "E"] as const;
/** Matches the report's desktop breakpoint (the chapter bar, two columns). */
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktop(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** False on the server and on phones/tablets, so the stack renders first. */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
const BULLETS = ["S1-B1", "S1-B2", "S1-B3", "S1-B4", "S1-B5", "S1-B6"];

/**
 * The question word in each CORE key line, set in bold (spec §6.1). File 04
 * carries no bold markup for it, so the words are named here per language.
 */
const KEY_QUESTION_WORDS: Record<"en" | "ar", Record<(typeof KEY_LETTERS)[number], string>> = {
  en: { C: "what", O: "how", R: "why", E: "where" },
  ar: { C: "ما", O: "كيف", R: "لماذا", E: "أين" },
};

/** S1-KEY-x with its question word (the first one after the colon) in bold. */
function KeyLine({ letter }: { letter: (typeof KEY_LETTERS)[number] }) {
  const { locale } = useLocale();
  const id = `S1-KEY-${letter}`;
  const text = useWording()(id);
  if (text === null) return <Pending id={id} />;
  const word = KEY_QUESTION_WORDS[locale === "ar" ? "ar" : "en"][letter];
  const at = text.indexOf(` ${word}`, text.indexOf(":"));
  if (at < 0) return <>{text}</>;
  const start = at + 1;
  return (
    <>
      {text.slice(0, start)}
      <strong className="font-black text-[color:var(--day-ink)]">
        {text.slice(start, start + word.length)}
      </strong>
      {text.slice(start + word.length)}
    </>
  );
}

/** A personal opening with the original reading notes and CORE key available on demand. */
export function BeforeYouRead({
  model,
  onExplore,
}: {
  model: ReportModel;
  onExplore(): void;
}) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4">
      <DiscoveryCover model={model} />
      <button type="button" onClick={onExplore} className={styles.coverButton}>
        {t("core.cover.open")}
        <ArrowRight size={18} aria-hidden="true" className="rtl:-scale-x-100" />
      </button>
      <details className={styles.readingGuide}>
        <summary>
          <span>{t("core.cover.guide")}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className="grid gap-5 pt-5">
          <h3 className="daybreak-heading text-xl">
            <Block id="S1-TITLE" />
          </h3>
          <DeckCard>
            <ul className={`grid ${styles.introNotes}`}>
              {BULLETS.map((id) => (
                <li
                  key={id}
                  className="flex gap-3 text-[14px] leading-relaxed text-[color:var(--day-ink-2)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[9px] size-2 shrink-0 rounded-full bg-[color:var(--day-ink)]"
                  />
                  <span>
                    <Block id={id} />
                  </span>
                </li>
              ))}
            </ul>
          </DeckCard>
          <section aria-labelledby="core-s1-key" className="grid gap-3">
            <h3
              id="core-s1-key"
              className="daybreak-heading text-[20px] leading-tight text-[color:var(--day-ink)]"
            >
              <Block id="S1-KEY-TITLE" />
            </h3>
            <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {KEY_LETTERS.map((letter) => (
                <li
                  key={letter}
                  className={`flex flex-col gap-3 ${styles.introKey}`}
                >
                  <span
                    aria-hidden="true"
                    style={{ background: LETTER_FILL[letter] }}
                  >
                    {letter}
                  </span>
                  <span>
                    <KeyLine letter={letter} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </details>
    </div>
  );
}

/**
 * Section 2 · At a glance (spec §6.2), the "CORE deck" design: a letter
 * key, the curiosity strands on the one saturated tile, then O, R and E.
 * Zones, never numbers.
 */
export function AtAGlance({
  model,
  generatedAt,
}: {
  model: ReportModel;
  generatedAt?: string;
}) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) {
    return <AtAGlanceStack model={model} generatedAt={generatedAt} />;
  }
  return (
    <div className={`grid ${styles.overview}`}>
      <GlanceHeader generatedAt={generatedAt} />
      <CuriosityTile model={model} />
      <WorkStyleCard model={model} />
      <MotivatorsCard model={model} />
      <SettingCard model={model} />
    </div>
  );
}

/**
 * Phones and tablets: the same four cards as a swipeable deck, one at a
 * time, the next ones peeking underneath. Desktop shows one card per row.
 */
function AtAGlanceStack({
  model,
  generatedAt,
}: {
  model: ReportModel;
  generatedAt?: string;
}) {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const content = {
    C: <CuriosityTile model={model} />,
    O: <WorkStyleCard model={model} />,
    R: <MotivatorsCard model={model} />,
    E: <SettingCard model={model} />,
  };
  const cards: StackCard[] = KEY_LETTERS.map((letter) => ({
    id: letter,
    letter,
    label: t(`core.glance.key.${letter}`),
    color: LETTER_FILL[letter],
    content: content[letter],
  }));

  return (
    <div className={`grid ${styles.overview}`}>
      <GlanceHeader generatedAt={generatedAt} hideKey />
      <GlanceStack cards={cards} active={active} onActiveChange={setActive} />
    </div>
  );
}
