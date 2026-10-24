"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { Block, KaiPrompt } from "../parts";
import { SectionHero } from "./chrome";
import {
  AskGlyph,
  IsGlyph,
  IsntGlyph,
  ParentsGlyph,
  StudyGlyph,
  TalkGlyph,
  TryGlyph,
  WatchGlyph,
  type GlyphProps,
} from "./icons";
import styles from "./report.module.css";

/** The questions to ask, folded so each step reads as one sentence first. */
function Questions({ ids }: { ids: string[] }) {
  const { t } = useLocale();
  if (ids.length === 0) return null;
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-[color:var(--r-violet-deep)] [&::-webkit-details-marker]:hidden">
        {t("core.steps.questions").replace("{count}", String(ids.length))}
        <ChevronDown size={15} aria-hidden="true" className="transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-2 grid gap-1.5">
        {ids.map((id) => (
          <li key={id} className={styles.ask}>
            <Block id={id} />
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * One stop on the path. The label is the text before the block's first
 * colon ("Watch: search for…"), so the heading and the sentence both come
 * from file 04.
 */
function Step({
  glyph: Glyph,
  labelId,
  isFlipped,
  children,
}: {
  glyph: (props: GlyphProps) => ReactNode;
  labelId: string;
  isFlipped: boolean;
  children: ReactNode;
}) {
  return (
    <li className={`${styles.step} ${isFlipped ? styles.stepFlip : ""}`}>
      <span aria-hidden="true" className={styles.stepBadge}>
        <Glyph size={30} />
      </span>
      <div className={styles.stepCard}>
        <h3 className="daybreak-heading text-[16px] leading-tight">
          <Block id={labelId} part="lead" />
        </h3>
        {children}
      </div>
    </li>
  );
}

/** Canvas B5: Watch, Try, Talk, Ask as a winding path (spec §6.5). */
export function NextStepsSection({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  const { nextSteps } = model;
  const body = "text-[13.5px] leading-relaxed";
  return (
    <div className={styles.screen}>
      <SectionHero art="steps" titleId="S5-TITLE" introId="S5-INTRO" />
      <div className="relative">
        <svg
          viewBox="0 0 354 640"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={styles.pathLine}
        >
          <path
            d="M28 20 C 28 120, 326 140, 326 260 S 28 380, 28 470 S 326 560, 326 630"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M28 20 C 28 120, 326 140, 326 260 S 28 380, 28 470 S 326 560, 326 630"
            stroke="#fff"
            strokeWidth="2.5"
            strokeDasharray="6 10"
            fill="none"
          />
        </svg>
        <ol className={styles.path}>
        <Step glyph={WatchGlyph} labelId="S5-WATCH" isFlipped={false}>
          <p className={body}>
            <Block id="S5-WATCH" fills={model.watchFills} part="rest" />
          </p>
        </Step>
        <Step glyph={TryGlyph} labelId="S5-TRY-LABEL" isFlipped>
          <ul className="grid gap-1.5">
            {nextSteps.tryBlocks.map((id) => (
              <li key={id} className={body}>
                <Block id={id} />
              </li>
            ))}
          </ul>
        </Step>
        <Step glyph={TalkGlyph} labelId="S5-TALK" isFlipped={false}>
          <p className={body}>
            <Block id="S5-TALK" fills={{ family: model.talkFill }} part="rest" />
          </p>
          <Questions ids={nextSteps.talkBlocks} />
        </Step>
        {nextSteps.askBlocks.length > 0 ? (
          <Step glyph={AskGlyph} labelId="S5-ASK" isFlipped>
            <p className={body}>
              <Block id="S5-ASK" part="rest" />
            </p>
            <Questions ids={nextSteps.askBlocks} />
          </Step>
        ) : null}
        </ol>
      </div>
      <KaiPrompt
        questionId="S5-KAI-Q"
        answers={[t("core.kai.s5_prepare"), t("core.kai.s5_tell")]}
      />
    </div>
  );
}

/** S6-B2 to B5 with a mark that says what each one is about. */
const PARENT_NOTES: { id: string; Glyph: (p: GlyphProps) => ReactNode }[] = [
  { id: "S6-B2", Glyph: ParentsGlyph },
  { id: "S6-B3", Glyph: AskGlyph },
  { id: "S6-B4", Glyph: TalkGlyph },
  { id: "S6-B5", Glyph: StudyGlyph },
];

/** Section 6 · For parents: the same for every student, laid out like Before you read. */
export function ParentsSection() {
  return (
    <div className={styles.screen}>
      <SectionHero art="parents" titleId="S6-TITLE" />
      <div className={styles.notesPanel}>
        <p className={styles.notesLead}>
          <Block id="S6-B1" />
        </p>
        <ul className={styles.notesList}>
          {PARENT_NOTES.map(({ id, Glyph }) => (
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
      </div>
    </div>
  );
}

function IsList({
  glyph: Glyph,
  labelId,
  ids,
  tint,
}: {
  glyph: (props: GlyphProps) => ReactNode;
  labelId: string;
  ids: string[];
  tint: string;
}) {
  return (
    <section className={`${styles.card} !gap-2`} style={{ background: tint }}>
      <h3 className="daybreak-heading flex items-center gap-2 text-[17px]">
        <Glyph size={24} />
        <Block id={labelId} part="lead" />
      </h3>
      <ul className="grid list-disc gap-1.5 ps-5 text-[13px] leading-snug">
        {ids.map((id) => (
          <li key={id}>
            <Block id={id} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Section 7 · About this report: what it is and what it isn't. */
export function AboutSection() {
  return (
    <div className={styles.screen}>
      <h2 className="daybreak-heading pt-2 text-[20px] leading-tight">
        <Block id="S7-TITLE" />
      </h2>
      <div className={styles.isGrid}>
        <IsList glyph={IsGlyph} labelId="S7-IS-LABEL" ids={["S7-IS-1", "S7-IS-2"]} tint="var(--r-violet-tint)" />
        <IsList
          glyph={IsntGlyph}
          labelId="S7-ISNT-LABEL"
          ids={["S7-ISNT-1", "S7-ISNT-2", "S7-ISNT-3", "S7-ISNT-4"]}
          tint="var(--r-gold-tint)"
        />
      </div>
      <p className="text-[11.5px] leading-relaxed text-[color:var(--r-ink-3)]">
        <Block id="S7-CREDIT" />
      </p>
    </div>
  );
}
