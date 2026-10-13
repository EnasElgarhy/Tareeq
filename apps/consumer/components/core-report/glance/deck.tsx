"use client";

import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { ReportModel } from "@/lib/core-v2/report-model";
import {
  AXES,
  AXIS_CODES,
  type AxisSide,
  type CuriosityCode,
} from "@/lib/core-v2/types";
import { Block } from "../parts";
import { AXIS_SIDE_ICON, CURIOSITY_ICON } from "./icons";
import { LETTER_FILL, STRANDS } from "./palette";
import styles from "../ReportDesign.module.css";

/**
 * Shared pieces of the CORE deck look (first built for At a glance), so
 * every report section speaks the same visual language.
 */

export type DeckLetter = keyof typeof LETTER_FILL;

/** The filled CORE letter square used beside card titles. */
export function LetterTile({
  letter,
  size = "md",
}: {
  letter: DeckLetter;
  size?: "md" | "sm";
}) {
  const box =
    size === "md"
      ? "size-[34px] rounded-[11px] text-[17px]"
      : "size-[22px] rounded-[7px] text-[12px]";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center font-heading font-black text-white ${box}`}
      style={{ background: LETTER_FILL[letter] }}
    >
      {letter}
    </span>
  );
}

/** Section title in the deck style, with an optional letter or icon tile. */
export function DeckHeader({
  titleId,
  introId,
  letter,
  icon,
}: {
  titleId: string;
  introId?: string;
  letter?: DeckLetter;
  icon?: ReactNode;
}) {
  return (
    <header className={`grid ${styles.sectionHeader}`}>
      <div className="flex items-start gap-3">
        {letter ? (
          <span className="mt-1">
            <LetterTile letter={letter} />
          </span>
        ) : null}
        {icon}
        <h2 className="daybreak-heading text-[26px] leading-[1.08] text-[color:var(--day-ink)] lg:text-[32px]">
          <Block id={titleId} />
        </h2>
      </div>
      {introId ? (
        <p className="max-w-[62ch] text-[14px] leading-relaxed text-[color:var(--day-ink-2)]">
          <Block id={introId} />
        </p>
      ) : null}
    </header>
  );
}

/** The deck's quiet surface: no border, soft lift, generous radius. */
export function DeckCard({
  children,
  className = "",
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${styles.card} ${className}`}
    >
      {children}
    </section>
  );
}

/** Strand colours follow a curiosity's place among the leaders, as in the C tile. */
export function strandFor(model: ReportModel, code: CuriosityCode) {
  const index = model.result.leadingCuriosities.indexOf(code);
  return STRANDS[(index < 0 ? 0 : index) % STRANDS.length];
}

/** A curiosity's icon in its strand-coloured ring (the C tile's badge). */
export function CuriosityRing({
  code,
  model,
  size = "md",
}: {
  code: CuriosityCode;
  model: ReportModel;
  size?: "md" | "sm";
}) {
  const Icon = CURIOSITY_ICON[code];
  const strand = strandFor(model, code);
  const isMd = size === "md";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[#fffcf6] ${
        isMd ? "size-12 border-[3px]" : "size-8 border-2"
      }`}
      style={{ borderColor: strand.stroke, color: strand.icon }}
    >
      <Icon size={isMd ? 22 : 15} weight="duotone" />
    </span>
  );
}

/** The icon for one side of an axis (the same icons At a glance shows). */
export function sideIcon(side: AxisSide): Icon | null {
  for (const axis of AXIS_CODES) {
    const { sideA, sideB } = AXES[axis];
    if (side === sideA) return AXIS_SIDE_ICON[axis][0];
    if (side === sideB) return AXIS_SIDE_ICON[axis][1];
  }
  return null;
}
