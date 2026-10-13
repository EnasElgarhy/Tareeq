"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
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
import { DeckCard } from "./glance/deck";
import { LETTER_FILL } from "./glance/palette";
import { Block } from "./parts";
import styles from "./ReportDesign.module.css";

const KEY_LETTERS = ["C", "O", "R", "E"] as const;
const BULLETS = ["S1-B1", "S1-B2", "S1-B3", "S1-B4", "S1-B5", "S1-B6"];

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
                    <Block id={`S1-KEY-${letter}`} />
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
  return (
    <div className={`grid lg:grid-cols-2 lg:items-start ${styles.overview}`}>
      <div className="grid gap-4 lg:col-span-2">
        <GlanceHeader generatedAt={generatedAt} />
        <CuriosityTile model={model} />
      </div>
      <WorkStyleCard model={model} />
      <MotivatorsCard model={model} />
      <div className="lg:col-span-2">
        <SettingCard model={model} />
      </div>
    </div>
  );
}
