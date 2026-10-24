"use client";

import { Fragment } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import type { CuriosityCode } from "@/lib/core-v2/types";
import { Block } from "../parts";
import { glanceCardId } from "./GlanceHeader";
import { CURIOSITY_ICON } from "./icons";
import { CURIOSITY_TILE_BG, STRANDS } from "./palette";
import styles from "../ReportDesign.module.css";

/** The strand diagram is drawn for up to this many leading curiosities. */
const MAX_STRANDS = STRANDS.length;
const W = 300;
const H = 84;
/** Gap between strands where they run together into one path. */
const BRAID_GAP = 8;
/** Gap between strands that stay apart (a diverse set of curiosities). */
const APART_GAP = 64;

function strandPath(index: number, count: number, isBraided: boolean): string {
  const start = (W * (2 * index + 1)) / (2 * count);
  const offset = index - (count - 1) / 2;
  const end = W / 2 + offset * (isBraided ? BRAID_GAP : APART_GAP);
  return `M${start} 0 V14 C${start} 52 ${end} 42 ${end} 72 V${H}`;
}

/**
 * C card: each leading curiosity is a strand. Strands that read as one
 * direction braid into a single path; a diverse set stays side by side.
 * When the leaders are nearly level, a dashed "Almost level" rule joins them.
 */
export function CuriosityTile({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  const { result } = model;
  const codes = result.leadingCuriosities;
  const count = codes.length;
  const hasStrands = count <= MAX_STRANDS;
  const isBraided = result.circleReading !== "diverse";
  const isLevel =
    result.directionClarity === "close" && count > 1 && hasStrands;
  // The Direction Clarity line is always the block text (spec §6.2); the
  // "Almost level" rule is only a visual tag on top of it.
  const pillBlocks = model.clarity;
  const columns = {
    gridTemplateColumns: `repeat(${hasStrands ? count : 2}, minmax(0, 1fr))`,
  };

  return (
    <section
      id={glanceCardId("C")}
      aria-labelledby="core-glance-c-title"
      className={`relative scroll-mt-20 overflow-hidden text-[#fffcf6] ${styles.curiosity}`}
      style={{ background: CURIOSITY_TILE_BG }}
    >
      <div className={styles.curiosityLayout}>
        <div className={styles.curiosityIntro}>
          <h3
            id="core-glance-c-title"
            className="daybreak-heading text-[24px] leading-tight lg:text-[28px]"
          >
            <Block id="S2-C-TITLE" />
          </h3>
          <ul className={styles.curiosityLegend}>
            {codes.map((code, i) => {
              const Icon = CURIOSITY_ICON[code];
              const strand = STRANDS[i % STRANDS.length];
              return (
                <li key={code}>
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full border-2 bg-[#fffcf6]"
                    style={{ borderColor: strand.stroke, color: strand.icon }}
                  >
                    <Icon size={20} weight="duotone" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-[16px] font-bold leading-tight">
                      <Block id={`CUR-${code}-NAME`} />
                    </p>
                    <p className="mt-1 text-[14px] leading-snug text-[#fffcf6]/70">
                      <Block id={`CUR-${code}-PULL`} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.curiosityVisual}>
          <div className="relative mx-auto mt-5 w-full max-w-[300px] lg:mt-0 lg:max-w-[400px]">
            <div className="grid gap-x-3 gap-y-2.5" style={columns}>
              {codes.map((code, i) => (
                <p
                  key={code}
                  className="flex flex-col items-center justify-end text-center font-heading text-[16px] font-bold leading-tight"
                  style={
                    hasStrands ? { gridRow: 1, gridColumn: i + 1 } : undefined
                  }
                >
                  <Block id={`CUR-${code}-NAME`} />
                </p>
              ))}
              {hasStrands ? (
                <>
                  {isLevel ? (
                    <span
                      aria-hidden="true"
                      className="self-center border-t-2 border-dashed border-[#fffcf6]/30"
                      style={{
                        gridRow: 2,
                        gridColumn: "1 / -1",
                        marginInline: `${100 / (2 * count)}%`,
                      }}
                    />
                  ) : null}
                  {codes.map((code, i) => (
                    <CuriosityBadge
                      key={`badge-${code}`}
                      code={code}
                      index={i}
                      column={i + 1}
                    />
                  ))}
                </>
              ) : null}
            </div>

            {hasStrands ? (
              <div className="relative">
                {isLevel ? (
                  <span className="absolute left-1/2 top-[14%] z-[1] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#5e3c24] px-2.5 py-1 text-[12px] font-bold">
                    {t("core.glance.almost_level")}
                  </span>
                ) : null}
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  fill="none"
                  aria-hidden="true"
                  className="-mt-1 block w-full rtl:-scale-x-100"
                >
                  {codes.map((code, i) => (
                    <path
                      key={code}
                      d={strandPath(i, count, isBraided)}
                      stroke={STRANDS[i].stroke}
                      strokeWidth={8}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
              </div>
            ) : (
              <ul className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
                {codes.map((code) => {
                  const Icon = CURIOSITY_ICON[code];
                  return (
                    <li
                      key={code}
                      className="grid aspect-square place-items-center rounded-full bg-[#fffcf6] text-[color:var(--daybreak-gold-ink)]"
                    >
                      <Icon size={22} weight="duotone" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p
            className={`relative mx-auto flex w-fit max-w-full items-center gap-2 rounded-[20px] bg-[#fffcf6] px-4 py-3 text-center text-[14.5px] font-bold leading-snug text-[color:var(--day-ink)] ${hasStrands ? "-mt-1" : "mt-5"}`}
          >
            <Sparkle />
            <span>
              {pillBlocks.map((id, i) => (
                <Fragment key={id}>
                  {i > 0 ? " " : null}
                  <Block id={id} />
                </Fragment>
              ))}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function CuriosityBadge({
  code,
  index,
  column,
}: {
  code: CuriosityCode;
  index: number;
  column: number;
}) {
  const Icon = CURIOSITY_ICON[code];
  const strand = STRANDS[index];
  return (
    <span
      aria-hidden="true"
      className="z-[2] grid size-14 place-items-center justify-self-center rounded-full border-[3px] bg-[#fffcf6]"
      style={{
        gridRow: 2,
        gridColumn: column,
        borderColor: strand.stroke,
        color: strand.icon,
      }}
    >
      <Icon size={26} weight="duotone" />
    </span>
  );
}

function Sparkle() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 256 256"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M128 16 C136 92 164 120 240 128 C164 136 136 164 128 240 C120 164 92 136 16 128 C92 120 120 92 128 16 Z"
        fill="#e9805f"
      />
    </svg>
  );
}
