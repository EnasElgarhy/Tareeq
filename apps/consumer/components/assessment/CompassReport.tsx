"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  ActionPlanIcon,
  ArchetypeMarkIcon,
  ConfidenceMarkIcon,
  DeepDiveIcon,
  FutureIcon,
  GoalIcon,
  MajorIcon,
  ResearchIcon,
  SkillIcon,
} from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getClusterProfile } from "@/lib/results/framework";
import { getSubjectReason, youtubeSearchUrl } from "@/lib/results/report-helpers";
import { getConfidenceLabelKey } from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/**
 * The expanded Career Compass report, for the Compass tab. Surfaces
 * report content that previously only existed behind /results
 * (ResultsScreen.tsx) — same underlying data, same subject-reasoning
 * helper, but re-themed for this tab's light surface rather than reusing
 * ResultsScreen's sub-components verbatim: those are hardcoded to the
 * dark "night" theme (sand/cream ink on dark cards) and would look wrong
 * dropped onto a white card here.
 */
export function CompassReport({
  report,
  kaiHref = "/kai-chat?goal=explain_results",
}: {
  report: PersonalizedCompassReport;
  /** Where the closing "ask Kai" card links — defaults to the old
   * pill-tab surface's chat route; the new Explore tab passes "/kai"
   * instead so it stays inside the bottom-tab shell. */
  kaiHref?: string;
}) {
  const { t, locale } = useLocale();
  const rankedClusters = report.score.clusterRanked;
  const maxScore = Math.max(1, rankedClusters[0]?.[1] ?? 1);

  return (
    <div className="grid gap-3">
      <ExpandableSection icon={<ArchetypeMarkIcon size={18} />} title={t("profile.compass.why_title")} defaultOpen>
        <p>{report.summary}</p>
      </ExpandableSection>

      <div className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/[0.08]">
            <ConfidenceMarkIcon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--day-ink-3,#675d4e)]">
              {t("profile.compass.confidence_title")}
            </p>
            <p className="text-[13.5px] font-black text-[color:var(--day-ink,#2a2118)]">
              {report.score.confidencePercentage}% · {t(getConfidenceLabelKey(report.score.confidenceLabel))}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">
          {t("profile.compass.confidence_body")}
        </p>
      </div>

      <div className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("profile.compass.strengths_title")}
        </p>
        <div className="mt-2.5 grid gap-2.5">
          {rankedClusters.map(([code, score], index) => (
            <div key={code} className="grid gap-1">
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span
                  className="font-bold"
                  style={{ color: index === 0 ? "var(--day-ink,#2a2118)" : "var(--day-ink-3,#675d4e)" }}
                >
                  {getClusterProfile(code, locale).name}
                </span>
                <span className="tabular-nums text-[color:var(--day-ink-3,#675d4e)]">{score}</span>
              </div>
              <span className="block h-1.5 overflow-hidden rounded-full bg-[color:var(--day-inset,#efe7da)]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    background: index === 0 ? "var(--grad-warm)" : "rgba(43,36,28,0.18)",
                    width: `${Math.max(8, (score / maxScore) * 100)}%`,
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="ps-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("profile.compass.careers_title")}
        </p>
        {report.careerExamples.slice(0, 6).map((career, index) => (
          <div
            key={career}
            className="flex items-start gap-2.5 rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3 shadow-[0_6px_16px_rgba(43,36,28,0.04)]"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-violet/10 text-[11px] font-black text-violet">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-[color:var(--day-ink,#2a2118)]">{career}</p>
              <a
                href={youtubeSearchUrl(`day in the life of ${career}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[11px] font-bold text-violet underline decoration-violet/30 underline-offset-2"
              >
                {t("profile.compass.day_in_life")}
              </a>
            </div>
          </div>
        ))}
      </div>

      <TagPanel icon={<MajorIcon size={18} />} title={t("profile.compass.majors_title")} items={report.universityMajors} />

      <div className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint/12">
            <SkillIcon size={18} />
          </span>
          <p className="text-[13px] font-black text-[color:var(--day-ink,#2a2118)]">{t("profile.compass.subjects_title")}</p>
        </div>
        <div className="mt-2.5 grid gap-1.5">
          {report.highSchoolSubjects.slice(0, 6).map((subject) => (
            <details key={subject} className="group rounded-[14px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-inset,#efe7da)] px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                <span className="text-[12.5px] font-bold text-[color:var(--day-ink,#2a2118)]">{subject}</span>
                <ChevronDown size={14} className="shrink-0 text-[color:var(--day-ink-3,#675d4e)] transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 border-t border-[color:var(--day-line,rgba(43,36,28,0.1))] pt-2 text-[11.5px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">
                {getSubjectReason(subject, report.clusterName, locale)}
              </p>
            </details>
          ))}
        </div>
      </div>

      <TagPanel icon={<DeepDiveIcon size={18} />} title={t("profile.compass.non_obvious_title")} items={report.nonObviousPaths} />

      <ExpandableSection icon={<GoalIcon size={18} />} title={t("profile.compass.landscape_title")}>
        <p>{report.careerLandscape}</p>
      </ExpandableSection>
      <ExpandableSection icon={<MajorIcon size={18} />} title={t("profile.compass.academic_title")}>
        <p>{report.academicPath}</p>
      </ExpandableSection>
      <ExpandableSection icon={<ResearchIcon size={18} />} title={t("profile.compass.reality_title")}>
        <p>{report.realityCheck}</p>
      </ExpandableSection>
      <ExpandableSection icon={<ArchetypeMarkIcon size={18} />} title={t("profile.compass.integration_title")}>
        <p>{report.integration}</p>
      </ExpandableSection>
      <ExpandableSection icon={<ActionPlanIcon size={18} />} title={t("profile.compass.next_steps_title")}>
        <p>{report.nextSteps}</p>
      </ExpandableSection>

      <a
        href={kaiHref}
        className="flex items-center gap-2.5 rounded-[18px] border border-violet/20 bg-violet/[0.05] p-3.5 transition hover:bg-violet/[0.08]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/12">
          <FutureIcon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-black text-[color:var(--day-ink,#2a2118)]">{t("profile.compass.ask_kai_title")}</span>
          <span className="block text-[11px] text-[color:var(--day-ink-3,#675d4e)]">{t("profile.compass.ask_kai_subtitle")}</span>
        </span>
      </a>
    </div>
  );
}

function ExpandableSection({
  icon,
  title,
  children,
  defaultOpen,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/[0.08]">{icon}</span>
        <span className="min-w-0 flex-1 text-[13px] font-black text-[color:var(--day-ink,#2a2118)]">{title}</span>
        <ChevronDown size={16} className="shrink-0 text-[color:var(--day-ink-3,#675d4e)] transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 max-w-[70ch] border-t border-[color:var(--day-line,rgba(43,36,28,0.1))] pt-3 text-[12.5px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">
        {children}
      </div>
    </details>
  );
}

function TagPanel({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/12">{icon}</span>
        <p className="text-[13px] font-black text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {items.slice(0, 6).map((item) => (
          <span
            key={item}
            className="rounded-full border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-inset,#efe7da)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--day-ink-2,#5c5142)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
