"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import type { AxisCode, AxisZone, MotivatorCode } from "@/lib/core-v2/types";
import { Block } from "../parts";
import { glanceCardId } from "./GlanceHeader";
import { AXIS_SIDE_ICON, MOTIVATOR_ICON } from "./icons";
import { LETTER_FILL } from "./palette";
import styles from "../ReportDesign.module.css";

type CardLetter = "O" | "R" | "E";

interface Axis {
  axis: AxisCode;
  headId: string;
  sideAId: string;
  sideBId: string;
}

const O_AXES: Axis[] = [
  {
    axis: "structure",
    headId: "S2-O-BAR1-HEAD",
    sideAId: "S2-O-BAR1-A",
    sideBId: "S2-O-BAR1-B",
  },
  {
    axis: "focus",
    headId: "S2-O-BAR2-HEAD",
    sideAId: "S2-O-BAR2-A",
    sideBId: "S2-O-BAR2-B",
  },
];
const E_AXES: Axis[] = [
  {
    axis: "team",
    headId: "S2-E-BAR1-HEAD",
    sideAId: "S2-E-BAR1-A",
    sideBId: "S2-E-BAR1-B",
  },
  {
    axis: "setting",
    headId: "S2-E-BAR2-HEAD",
    sideAId: "S2-E-BAR2-A",
    sideBId: "S2-E-BAR2-B",
  },
];
const MID_BLOCK = "BAR-MID";

function GlanceCard({
  letter,
  titleId,
  children,
}: {
  letter: CardLetter;
  titleId: string;
  children: ReactNode;
}) {
  const headingId = `core-glance-${letter.toLowerCase()}-title`;
  return (
    <section
      id={glanceCardId(letter)}
      aria-labelledby={headingId}
      className={`grid scroll-mt-20 gap-5 ${styles.card}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-[34px] shrink-0 place-items-center rounded-[11px] font-heading text-[17px] font-black text-white"
          style={{ background: LETTER_FILL[letter] }}
        >
          {letter}
        </span>
        <h3
          id={headingId}
          className="daybreak-heading text-[20px] leading-tight text-[color:var(--day-ink)]"
        >
          <Block id={titleId} />
        </h3>
      </div>
      {children}
    </section>
  );
}

/** Two dots: the "A mix of both" mark, standing in for an icon. */
function MixMark({ isChosen }: { isChosen: boolean }) {
  const dot = isChosen ? "bg-white" : "bg-[#a3998a]";
  return (
    <span aria-hidden="true" className="flex h-7 items-center gap-[3px]">
      <span className={`size-2 rounded-full ${dot}`} />
      <span className={`size-2 rounded-full ${dot}`} />
    </span>
  );
}

/** O and E (spec §6.2): the three zones side by side, the student's one filled. */
function ZoneChoices({
  axis,
  zone,
  letter,
}: {
  axis: Axis;
  zone: AxisZone;
  letter: "O" | "E";
}) {
  const [SideA, SideB] = AXIS_SIDE_ICON[axis.axis];
  const options = [
    { value: 1 as const, id: axis.sideAId, Icon: SideA },
    { value: 2 as const, id: MID_BLOCK, Icon: null },
    { value: 3 as const, id: axis.sideBId, Icon: SideB },
  ];
  return (
    <div className="grid gap-2.5">
      <p className="text-[14px] font-semibold text-[color:var(--day-ink)]">
        <Block id={axis.headId} />
      </p>
      <ol className="grid grid-cols-3 gap-2">
        {options.map(({ value, id, Icon }) => {
          const isChosen = value === zone;
          return (
            <li
              key={id}
              aria-current={isChosen ? "true" : undefined}
              className={`flex flex-col items-center gap-2 rounded-[16px] px-2 py-3 text-center text-[12px] leading-snug ${
                isChosen
                  ? "font-bold text-white"
                  : "bg-[color:var(--day-inset)] font-medium text-[color:var(--day-ink-2)]"
              }`}
              style={isChosen ? { background: LETTER_FILL[letter] } : undefined}
            >
              {Icon ? (
                <Icon
                  size={28}
                  weight="duotone"
                  aria-hidden="true"
                  className={isChosen ? undefined : "text-[#8a7f70]"}
                />
              ) : (
                <MixMark isChosen={isChosen} />
              )}
              <Block id={id} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WorkStyleCard({ model }: { model: ReportModel }) {
  return (
    <GlanceCard letter="O" titleId="S2-O-TITLE">
      {O_AXES.map((axis) => (
        <ZoneChoices
          key={axis.axis}
          axis={axis}
          zone={model.result.axes[axis.axis].zone}
          letter="O"
        />
      ))}
      <p className="text-[13px] italic text-[color:var(--day-ink-3)]">
        <Block id="P2-QUALIFIER" />
      </p>
    </GlanceCard>
  );
}

function isMotivatorCode(code: string): code is MotivatorCode {
  return code in MOTIVATOR_ICON;
}

/** The model lists other motivators as plain codes; unknown ones get no icon. */
function MotivatorChip({ code }: { code: string }) {
  const Icon = isMotivatorCode(code) ? MOTIVATOR_ICON[code] : null;
  return (
    <li className="flex items-center gap-2 rounded-[14px] border border-[color:var(--day-line)] bg-[color:var(--day-elevated)] px-2.5 py-2 text-[12px] leading-snug text-[color:var(--day-ink-2)]">
      {Icon ? (
        <Icon
          size={18}
          weight="fill"
          aria-hidden="true"
          className="shrink-0"
          style={{ color: LETTER_FILL.R }}
        />
      ) : null}
      <Block id={`DRV-${code}-NAME`} />
    </li>
  );
}

export function MotivatorsCard({ model }: { model: ReportModel }) {
  const { result, otherMotivators } = model;
  return (
    <GlanceCard letter="R" titleId="S2-R-TITLE">
      {result.noSmallSet ? (
        <p className="text-[14px] leading-relaxed text-[color:var(--day-ink-2)]">
          <Block id="S2-R-NOSET" />
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {result.leadingMotivators.map((code) => {
            const Icon = MOTIVATOR_ICON[code];
            return (
              <li
                key={code}
                className="flex flex-col gap-3 rounded-[20px] px-3.5 py-4 text-[15px] font-bold leading-snug text-white"
                style={{ background: LETTER_FILL.R }}
              >
                <Icon size={32} weight="duotone" aria-hidden="true" />
                <Block id={`DRV-${code}-NAME`} />
              </li>
            );
          })}
        </ul>
      )}
      {result.noSmallSet ? null : (
        <p className="-mb-1 text-[14px] font-semibold text-[color:var(--day-ink)]">
          <Block id="S2-R-OTHERS" />
        </p>
      )}
      <ul className="grid grid-cols-2 gap-2">
        {otherMotivators.map((code) => (
          <MotivatorChip key={code} code={code} />
        ))}
      </ul>
    </GlanceCard>
  );
}

export function SettingCard({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  return (
    <GlanceCard letter="E" titleId="S2-E-TITLE">
      {/* Desktop: photo beside the answers instead of a full-width strip. */}
      <div className={styles.settingLayout}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/report/work-setting-illustration-v1.webp"
          alt={t("core.glance.setting_photo_alt")}
          width={600}
          height={400}
          loading="lazy"
          className={styles.settingArt}
        />
        <div className="grid gap-5">
          <p className="text-[14px] leading-relaxed text-[color:var(--day-ink-2)]">
            <Block id="S2-E-LINE" />
          </p>
          {E_AXES.map((axis) => (
            <ZoneChoices
              key={axis.axis}
              axis={axis}
              zone={model.result.axes[axis.axis].zone}
              letter="E"
            />
          ))}
        </div>
      </div>
    </GlanceCard>
  );
}
