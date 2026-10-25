"use client";

import { ArrowRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import type { AxisCode, AxisSide, AxisZone } from "@/lib/core-v2/types";
import { AXES } from "@/lib/core-v2/types";
import { Block } from "../parts";
import {
  CORE_LETTERS,
  LetterLabel,
  LetterName,
  LetterQuestion,
  SectionHero,
  type CoreLetter,
} from "./chrome";
import {
  CURIOSITY_GLYPH,
  GrowthGlyph,
  MOTIVATOR_GLYPH,
  MixGlyph,
  NoScoreGlyph,
  SIDE_GLYPH,
  type GlyphProps,
} from "./icons";
import styles from "./report.module.css";

/** S1-B2 to B5, the practical notes; B1 opens the panel and B6 signs it off with Kai. */
const NOTES: { id: string; Glyph: (p: GlyphProps) => ReactNode }[] = [
  { id: "S1-B2", Glyph: NoScoreGlyph },
  { id: "S1-B3", Glyph: SIDE_GLYPH.O },
  { id: "S1-B4", Glyph: MOTIVATOR_GLYPH.AUT },
  { id: "S1-B5", Glyph: GrowthGlyph },
];

export function formatReportDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Canvas B1: the cover, the six reading notes, the CORE key, then into the results. */
export function OpeningSection({
  generatedAt,
  onExplore,
}: {
  generatedAt?: string;
  onExplore(): void;
}) {
  const { t, locale } = useLocale();
  const date = formatReportDate(generatedAt, locale);
  return (
    <div className={styles.screen}>
      <SectionHero
        art="open"
        eyebrow={date ? t("core.glance.report_date").replace("{date}", date) : undefined}
        title={t("core.cover.title")}
      >
        <p className={styles.heroIntro}>{t("core.open.intro")}</p>
      </SectionHero>

      <section aria-labelledby="core-s1-title" className="grid gap-3">
        <h3 id="core-s1-title" className="daybreak-heading text-[17px] leading-tight">
          <Block id="S1-TITLE" />
        </h3>
        <div className={styles.notesPanel}>
          <p className={styles.notesLead}>
            <Block id="S1-B1" />
          </p>
          <ul className={styles.notesList}>
            {NOTES.map(({ id, Glyph }) => (
              <li key={id} className={styles.notesItem}>
                <span aria-hidden="true" className="shrink-0 text-[color:var(--r-violet)]">
                  <Glyph size={22} />
                </span>
                <span>
                  <Block id={id} />
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.notesSign}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kai/avatar/kai-avatar-idle.webp" alt="" width={32} height={32} className={styles.notesKai} />
            <Block id="S1-B6" />
          </p>
        </div>
      </section>

      <section aria-labelledby="core-s1-key" className="grid gap-3">
        <h3 id="core-s1-key" className="daybreak-heading text-[17px] leading-tight">
          <Block id="S1-KEY-TITLE" />
        </h3>
        <ul className="grid gap-2 lg:grid-cols-2">
          {CORE_LETTERS.map((letter) => (
            <li key={letter} className={styles.keyRow}>
              <span aria-hidden="true" className={styles.letterTile}>
                {letter}
              </span>
              <span className="grid gap-0.5">
                <span className="daybreak-heading text-[16px] leading-tight">
                  <LetterName letter={letter} />
                </span>
                <span className="text-[13px] text-[color:var(--r-ink-2)]">
                  <LetterQuestion letter={letter} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={onExplore} className={styles.cta}>
        {t("core.cover.open")}
        <ArrowRight size={18} aria-hidden="true" className="rtl:-scale-x-100" />
      </button>
    </div>
  );
}

/* ----------------------------------------------------------- At a glance */

function GlanceCard({
  letter,
  titleId,
  lineId,
  children,
}: {
  letter: CoreLetter;
  titleId: string;
  lineId?: string;
  children: ReactNode;
}) {
  const headingId = `core-glance-${letter}`;
  return (
    <section id={headingId} aria-labelledby={`${headingId}-title`} className={`scroll-mt-20 ${styles.card}`}>
      <div className="grid gap-2">
        <LetterLabel letter={letter} />
        <h3 id={`${headingId}-title`} className={`daybreak-heading ${styles.cardTitle}`}>
          <Block id={titleId} />
        </h3>
        {lineId ? (
          <p className="text-[13.5px] leading-relaxed text-[color:var(--r-ink-2)]">
            <Block id={lineId} />
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

interface AxisRow {
  axis: AxisCode;
  headId: string;
  sideAId: string;
  sideBId: string;
}

const O_AXES: AxisRow[] = [
  { axis: "structure", headId: "S2-O-BAR1-HEAD", sideAId: "S2-O-BAR1-A", sideBId: "S2-O-BAR1-B" },
  { axis: "focus", headId: "S2-O-BAR2-HEAD", sideAId: "S2-O-BAR2-A", sideBId: "S2-O-BAR2-B" },
];
const E_AXES: AxisRow[] = [
  { axis: "team", headId: "S2-E-BAR1-HEAD", sideAId: "S2-E-BAR1-A", sideBId: "S2-E-BAR1-B" },
  { axis: "setting", headId: "S2-E-BAR2-HEAD", sideAId: "S2-E-BAR2-A", sideBId: "S2-E-BAR2-B" },
];

/** O and E (spec §6.2): three zones side by side, the student's one filled. */
/** `zone: null` draws the options with no answer marked (the locked preview). */
export function Zones({ row, zone }: { row: AxisRow; zone: AxisZone | null }) {
  const { t } = useLocale();
  const { sideA, sideB } = AXES[row.axis];
  const options: { value: AxisZone; id: string; side: AxisSide | null }[] = [
    { value: 1, id: row.sideAId, side: sideA },
    { value: 2, id: "BAR-MID", side: null },
    { value: 3, id: row.sideBId, side: sideB },
  ];
  return (
    <div className="grid gap-2">
      <p className="text-[13.5px] font-bold">
        <Block id={row.headId} />
      </p>
      <ol className={styles.zones}>
        {options.map(({ value, id, side }) => {
          const isChosen = value === zone;
          const Glyph = side ? SIDE_GLYPH[side] : MixGlyph;
          return (
            <li
              key={id}
              aria-current={isChosen ? "true" : undefined}
              className={`${styles.zone} ${isChosen ? styles.zoneChosen : ""}`}
            >
              <Glyph size={26} />
              <Block id={id} />
            </li>
          );
        })}
      </ol>
      {/* The three options read as one scale: a track with an arrowhead at
          each end, and a marker under the student's own position. */}
      <div aria-hidden="true" className={styles.scale}>
        <span className={styles.scaleTrack} />
        {[1, 2, 3].map((value) => (
          <span key={value} className={styles.scaleTick} data-at={value} />
        ))}
        {zone === null ? null : (
          <span className={styles.scaleMarker} data-at={zone}>
            <span className={styles.scaleTriangle} />
            <span className={styles.scaleYou}>{t("core.glance.you")}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function CuriositiesCard({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  const leaders = model.result.leadingCuriosities;
  return (
    <GlanceCard letter="C" titleId="S2-C-TITLE">
      <ul className="grid gap-2">
        {leaders.map((code, i) => {
          const Glyph = CURIOSITY_GLYPH[code];
          return (
            <Fragment key={code}>
              {i > 0 ? (
                <li aria-hidden="true" className={styles.connector}>
                  + {t("core.glance.connects")} +
                </li>
              ) : null}
              <li className={`flex items-center gap-3 ${styles.pillBox}`}>
                <span className="text-[color:var(--r-violet)]">
                  <Glyph size={30} />
                </span>
                <span className="grid gap-0.5">
                  <span className="daybreak-heading text-[17px] leading-tight">
                    <Block id={`CUR-${code}-NAME`} />
                  </span>
                  <span className="text-[13px] text-[color:var(--r-ink-2)]">
                    <Block id={`CUR-${code}-PULL`} />
                  </span>
                </span>
              </li>
            </Fragment>
          );
        })}
      </ul>
      <p className="text-[14px] font-semibold leading-relaxed">
        {model.clarity.map((id, i) => (
          <Fragment key={id}>
            {i > 0 ? " " : null}
            <Block id={id} />
          </Fragment>
        ))}
      </p>
    </GlanceCard>
  );
}

function MotivatorsCard({ model }: { model: ReportModel }) {
  const { result, otherMotivators } = model;
  return (
    <GlanceCard letter="R" titleId="S2-R-TITLE">
      {result.noSmallSet ? (
        <p className="text-[14px] leading-relaxed text-[color:var(--r-ink-2)]">
          <Block id="S2-R-NOSET" />
        </p>
      ) : (
        <ul className="grid gap-2">
          {result.leadingMotivators.map((code) => {
            const Glyph = MOTIVATOR_GLYPH[code];
            return (
              <li key={code} className={styles.motivator}>
                <span className={styles.motivatorGlyph}>
                  <Glyph size={28} />
                </span>
                <Block id={`DRV-${code}-NAME`} />
              </li>
            );
          })}
        </ul>
      )}
      {result.noSmallSet ? null : (
        <p className={styles.subLabel}>
          <Block id="S2-R-OTHERS" />
        </p>
      )}
      <ul className="flex flex-wrap gap-1.5">
        {otherMotivators.map((code) => (
          <li key={code} className={styles.chip}>
            <Block id={`DRV-${code}-NAME`} />
          </li>
        ))}
      </ul>
    </GlanceCard>
  );
}

/**
 * The locked Compass tab: the real At a glance opening, the C card open, and
 * the O card under frosted glass with `veil` over it. Built from the same
 * parts as GlanceSection so the preview reads as the report it unlocks.
 */
export function LockedGlancePreview({
  model,
  generatedAt,
  veil,
}: {
  model: ReportModel;
  generatedAt?: string;
  veil: ReactNode;
}) {
  const { t, locale } = useLocale();
  const date = formatReportDate(generatedAt, locale);
  return (
    <div className={styles.screen}>
      <SectionHero
        art="glance"
        eyebrow={date ? t("core.glance.report_date").replace("{date}", date) : undefined}
        titleId="S2-TITLE"
      />
      <div className={`grid gap-4 ${styles.glanceGrid} ${styles.lockedGrid}`}>
        <CuriositiesCard model={model} />
        <div className={styles.frosted}>
          {/* Inert and hidden from assistive tech: the answers under the
              glass are not part of the free preview. */}
          <div className={styles.frostedContent} aria-hidden="true" inert>
            <GlanceCard letter="O" titleId="S2-O-TITLE">
              {/* No answer is passed in: the glass hides a blank scale, not the student's result. */}
              {O_AXES.map((row) => (
                <Zones key={row.axis} row={row} zone={null} />
              ))}
            </GlanceCard>
          </div>
          <div className={styles.frostedVeil}>{veil}</div>
        </div>
      </div>
    </div>
  );
}

/** Canvas B2: the four CORE cards, one after the other, in one palette. */
export function GlanceSection({
  model,
  generatedAt,
}: {
  model: ReportModel;
  generatedAt?: string;
}) {
  const { t, locale } = useLocale();
  const date = formatReportDate(generatedAt, locale);
  const { axes } = model.result;
  return (
    <div className={styles.screen}>
      <SectionHero
        art="glance"
        eyebrow={date ? t("core.glance.report_date").replace("{date}", date) : undefined}
        titleId="S2-TITLE"
      />
      <div className={`grid gap-4 ${styles.glanceGrid}`}>
        <CuriositiesCard model={model} />
        <GlanceCard letter="O" titleId="S2-O-TITLE">
          {O_AXES.map((row) => (
            <Zones key={row.axis} row={row} zone={axes[row.axis].zone} />
          ))}
          <p className="text-[12.5px] italic text-[color:var(--r-ink-3)]">
            <Block id="P2-QUALIFIER" />
          </p>
        </GlanceCard>
        <MotivatorsCard model={model} />
        <GlanceCard letter="E" titleId="S2-E-TITLE" lineId="S2-E-LINE">
          {E_AXES.map((row) => (
            <Zones key={row.axis} row={row} zone={axes[row.axis].zone} />
          ))}
        </GlanceCard>
      </div>
    </div>
  );
}
