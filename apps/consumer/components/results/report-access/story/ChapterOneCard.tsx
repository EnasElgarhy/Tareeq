"use client";

import {
  Activity,
  ChevronDown,
  Compass,
  Diamond,
  Orbit,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import {
  getArchetypeKey,
  getDriverKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import { fill } from "./story-data";

type RowTone = "gold" | "violet" | "green";

const TONE_CLASS: Record<RowTone, string> = {
  gold: "bg-[rgba(242,201,76,0.2)] text-[#7a5a00]",
  violet: "bg-[rgba(109,91,168,0.14)] text-[#6d5ba8]",
  green: "bg-[rgba(61,138,115,0.14)] text-[#3d8a73]",
};

function CoreRow({
  letter,
  icon: Icon,
  tone,
  label,
  value,
  children,
}: {
  letter: string;
  icon: LucideIcon;
  tone: RowTone;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-inset)] p-3 open:bg-[color:var(--day-card)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span
          className={`relative grid size-11 shrink-0 place-items-center rounded-full ${TONE_CLASS[tone]}`}
        >
          <span className="absolute start-1.5 top-1 text-[9px] font-black leading-[11.5px] opacity-70">
            {letter}
          </span>
          <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase leading-[12.5px] tracking-[0.13em] text-[color:var(--day-ink-3)]">
            {label}
          </span>
          <span className="mt-0.5 block text-[15px] font-extrabold leading-[19px] text-[color:var(--day-ink)]">
            {value}
          </span>
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 text-[color:var(--day-ink-3)] transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-3 border-t border-[color:var(--day-line)] pt-3 text-[12.5px] leading-relaxed text-[color:var(--day-ink-2)]">
        {children}
      </p>
    </details>
  );
}

/**
 * Chapter 01, open: the four CORE rows from the Figma frame — one stacked
 * row per signal with its letter medallion and the user's value, exactly as
 * the report's own chapter opens them.
 */
export function ChapterOneCard({
  report,
}: {
  report: PersonalizedCompassReport;
}) {
  const { t } = useLocale();
  const cluster = getClusterLabel(report.clusterCode, t);

  const rows: Array<{
    letter: string;
    icon: LucideIcon;
    tone: RowTone;
    labelKey: StringKey;
    value: string;
    bodyKey: StringKey;
  }> = [
    {
      letter: "C",
      icon: Compass,
      tone: "gold",
      labelKey: "results.core.curiosities_label",
      value: cluster,
      bodyKey: "results.core.curiosities_body",
    },
    {
      letter: "O",
      icon: Diamond,
      tone: "violet",
      labelKey: "results.core.operations_label",
      value: t(getArchetypeKey(report.archetype)),
      bodyKey: "results.core.operations_body",
    },
    {
      letter: "R",
      icon: Activity,
      tone: "gold",
      labelKey: "results.core.rewards_label",
      value: t(getDriverKey(report.score.primaryDriver)),
      bodyKey: "results.core.rewards_body",
    },
    {
      letter: "E",
      icon: Orbit,
      tone: "green",
      labelKey: "results.core.ecosystems_label",
      value: t(getEcosystemFitKey(report.ecosystemFit)),
      bodyKey: "results.core.ecosystems_body",
    },
  ];

  return (
    <section
      aria-labelledby="chapter-one-heading"
      className="daybreak-story-card rounded-story-alt mt-6 p-4 sm:p-5"
    >
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="daybreak-eyebrow">{t("paywall.chapter1.eyebrow")}</p>
          <h2
            id="chapter-one-heading"
            className="daybreak-heading mt-1 text-[20px] font-extrabold leading-[25px] text-[color:var(--day-ink)]"
          >
            {t("results.core.title")}
          </h2>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {rows.map(({ letter, icon, tone, labelKey, value, bodyKey }) => (
          <CoreRow
            key={letter}
            letter={letter}
            icon={icon}
            tone={tone}
            label={t(labelKey)}
            value={value}
          >
            {fill(t(bodyKey), { cluster })}
          </CoreRow>
        ))}
      </div>
    </section>
  );
}
