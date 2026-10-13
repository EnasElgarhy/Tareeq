"use client";

import {
  ChatsCircle,
  Check,
  Flask,
  GraduationCap,
  PlayCircle,
  X,
  type Icon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ParentsIcon } from "@/components/brand/DomainIcons";
import type { ReportModel } from "@/lib/core-v2/report-model";
import { DeckCard, DeckHeader } from "./glance/deck";
import { LETTER_FILL } from "./glance/palette";
import { Block, KaiPrompt } from "./parts";

const bodyText = "text-[14px] leading-relaxed text-[color:var(--day-ink-2)]";

/**
 * One stop on the Watch, Try, Talk, Ask track. The icon tiles sit on a line
 * that runs between them, so the order reads without numbers.
 */
function Step({
  icon: StepIcon,
  labelId,
  isLast = false,
  children,
}: {
  icon: Icon;
  labelId: string;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-3.5 pb-6 last:pb-0">
      {isLast ? null : (
        <span
          aria-hidden="true"
          className="absolute bottom-0 start-[21px] top-12 w-0.5 rounded-full bg-[color:var(--day-inset)]"
        />
      )}
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[color:var(--day-ink)] text-white"
      >
        <StepIcon size={24} weight="duotone" />
      </span>
      <div className="grid min-w-0 flex-1 gap-2 pt-2">
        <h3 className="daybreak-heading text-[18px] leading-tight text-[color:var(--day-ink)]">
          <Block id={labelId} />
        </h3>
        {children}
      </div>
    </li>
  );
}

/** Questions to ask someone, as speech bubbles. */
function Questions({ ids }: { ids: string[] }) {
  return (
    <ul className="grid gap-2">
      {ids.map((id) => (
        <li
          key={id}
          className="w-fit max-w-full rounded-[18px] rounded-ss-[6px] bg-[color:var(--day-inset)] px-3.5 py-2.5 text-[13.5px] leading-snug text-[color:var(--day-ink)]"
        >
          <Block id={id} />
        </li>
      ))}
    </ul>
  );
}

/** Section 5 · Your next steps (spec §6.5). Watch, Try, Talk, Ask is a real sequence. */
export function NextStepsSection({ model }: { model: ReportModel }) {
  const { nextSteps } = model;
  const hasAsk = nextSteps.askBlocks.length > 0;
  return (
    <div className="grid gap-4">
      <DeckHeader titleId="S5-TITLE" introId="S5-INTRO" />
      <DeckCard className="lg:p-6">
        <ol className="grid max-w-[640px]">
          <Step icon={PlayCircle} labelId="S5-WATCH-LABEL">
            <p className={bodyText}>
              <Block id="S5-WATCH" fills={{ job: model.watchFill }} />
            </p>
          </Step>
          <Step icon={Flask} labelId="S5-TRY-LABEL">
            <ul className="grid gap-1">
              {nextSteps.tryBlocks.map((id) => (
                <li key={id} className={bodyText}>
                  <Block id={id} />
                </li>
              ))}
            </ul>
          </Step>
          <Step icon={ChatsCircle} labelId="S5-TALK-LABEL" isLast={!hasAsk}>
            <p className={bodyText}>
              <Block id="S5-TALK" fills={{ family: model.talkFill }} />
            </p>
            <Questions ids={nextSteps.talkBlocks} />
          </Step>
          {hasAsk ? (
            <Step icon={GraduationCap} labelId="S5-ASK-LABEL" isLast>
              <p className={bodyText}>
                <Block id="S5-ASK" />
              </p>
              <Questions ids={nextSteps.askBlocks} />
            </Step>
          ) : null}
        </ol>
      </DeckCard>
      <KaiPrompt questionId="S5-KAI-Q" />
    </div>
  );
}

/**
 * Section 6 · For parents (spec §6.6): the same for every student. Written
 * for a different reader, so it gets its own filled tile.
 */
export function ParentsSection() {
  return (
    <section
      aria-labelledby="core-s6-title"
      className="relative overflow-hidden rounded-[28px] px-5 pb-6 pt-5 text-white lg:px-7 lg:pb-7 lg:pt-6"
      style={{ background: LETTER_FILL.E }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#fffcf6]">
          <ParentsIcon size={26} />
        </span>
        <h2
          id="core-s6-title"
          className="daybreak-heading text-[24px] leading-tight lg:text-[30px]"
        >
          <Block id="S6-TITLE" />
        </h2>
      </div>
      <ul className="mt-5 grid max-w-[68ch] gap-3.5">
        {["S6-B1", "S6-B2", "S6-B3", "S6-B4", "S6-B5"].map((id) => (
          <li key={id} className="flex gap-3 text-[14.5px] leading-relaxed text-white/90">
            <span
              aria-hidden="true"
              className="mt-[9px] size-2 shrink-0 rounded-full bg-[#e3dcf5]"
            />
            <span>
              <Block id={id} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function IsList({
  labelId,
  ids,
  icon: ItemIcon,
  color,
}: {
  labelId: string;
  ids: string[];
  icon: Icon;
  color: string;
}) {
  return (
    <DeckCard className="grid content-start gap-3">
      <h3 className="daybreak-heading text-[19px] leading-tight text-[color:var(--day-ink)]">
        <Block id={labelId} />
      </h3>
      <ul className="grid gap-2.5">
        {ids.map((id) => (
          <li key={id} className={`flex gap-2.5 ${bodyText}`}>
            <span
              aria-hidden="true"
              className="mt-[3px] grid size-5 shrink-0 place-items-center rounded-full text-white"
              style={{ background: color }}
            >
              <ItemIcon size={12} weight="bold" />
            </span>
            <span>
              <Block id={id} />
            </span>
          </li>
        ))}
      </ul>
    </DeckCard>
  );
}

/** Section 7 · About this report. S7-CREDIT is required by the O*NET licence. */
export function AboutSection() {
  return (
    <div className="grid gap-4">
      <DeckHeader titleId="S7-TITLE" />
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <IsList
          labelId="S7-IS-LABEL"
          ids={["S7-IS-1", "S7-IS-2"]}
          icon={Check}
          color={LETTER_FILL.O}
        />
        <IsList
          labelId="S7-ISNT-LABEL"
          ids={["S7-ISNT-1", "S7-ISNT-2", "S7-ISNT-3", "S7-ISNT-4"]}
          icon={X}
          color={LETTER_FILL.R}
        />
      </div>
      <p className="text-[12px] leading-relaxed text-[color:var(--day-ink-3)]">
        <Block id="S7-CREDIT" />
      </p>
    </div>
  );
}

/** Shown first only when the attempt is flagged and flags are live (spec §5). */
export function FlagNote() {
  return (
    <DeckCard className="border-s-4 border-[color:var(--daybreak-gold-ink)]">
      <p className={bodyText}>
        <Block id="FLAG-NOTE" />
      </p>
    </DeckCard>
  );
}
