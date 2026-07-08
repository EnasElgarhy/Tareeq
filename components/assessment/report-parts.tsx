"use client";

import { ChevronDown, PlayCircle, Sparkles } from "lucide-react";
import { CSSProperties, ReactNode } from "react";
import {
  AcademicIcon,
  ArchetypeIcon,
  CareerIcon,
  CompassResultIcon,
  ConstellationIcon,
  DriverIcon,
  EcosystemIcon,
  NextStepsIcon,
  PathForwardIcon,
  RealityIcon,
  UniversityIcon,
} from "@/components/brand/ResultIcons";
import { ResultCompass } from "@/components/assessment/CompassSignalPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CLUSTER_VISUALS, getClusterLabel } from "@/lib/results/cluster-visuals";
import { getSubjectReason, youtubeSearchUrl } from "@/lib/results/report-helpers";
import {
  getArchetypeKey,
  getConfidenceLabelKey,
  getEcosystemFitKey,
} from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import type { StringKey } from "@/lib/i18n/strings";

type Translate = (key: StringKey) => string;

/**
 * The full Career Compass report — hero through the five essay sections.
 * Shared verbatim between the owner's own /results screen and the public
 * /share/[token] page, so the two never visually drift apart. Each caller
 * wraps this with its own tail: ResultsScreen adds the action buttons
 * (Share/Save/Start over), SharedResultScreen adds a context banner + a
 * "take your own" CTA instead.
 */
export function ReportBody({
  report,
  t,
}: {
  report: PersonalizedCompassReport;
  t: Translate;
}) {
  const rankedClusters = report.score.clusterRanked;
  const maxClusterScore = Math.max(1, rankedClusters[0]?.[1] ?? 1);
  const clusterVisual = CLUSTER_VISUALS[report.clusterCode];
  const videoSuggestions = buildVideoSuggestions(report, t);

  return (
    <div
      className="grid gap-4"
      style={{ "--result-accent": clusterVisual.color } as CSSProperties}
    >
      <header className="result-hero relative overflow-hidden rounded-[30px] border border-sand/12 bg-sand/[0.055] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="result-hero-grid absolute inset-0 opacity-70" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <span className="chip chip--violet-on-dark">
            <Sparkles size={13} />
            {t("results.hero.chip")}
          </span>
          <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
            {t("results.hero.badge")}
          </span>
        </div>

        <div className="relative z-10 mt-4 grid gap-4">
          <div className="relative mx-auto grid h-[178px] w-full max-w-[260px] place-items-center">
            <ResultCompass color={clusterVisual.color} />
            <div className="grid size-[92px] place-items-center rounded-full border border-white/12 bg-night/80 text-center shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
                {report.clusterCode}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              {t("results.hero.eyebrow")}
            </p>
            <h2 className="text-[42px] font-black uppercase leading-[0.9] text-white">
              {getClusterLabel(report.clusterCode, t)}
            </h2>
            <p className="max-w-[30ch] text-[14px] font-semibold leading-snug text-white/74">
              {t("results.hero.subtitle")}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
          <StatPill
            label={t("results.stat.signal_label")}
            value={t("results.stat.signal_value")}
            meta={getClusterLabel(report.clusterCode, t)}
          />
          <StatPill
            label={t("results.stat.confidence_label")}
            value={`${report.score.confidencePercentage}%`}
            meta={t(getConfidenceLabelKey(report.score.confidenceLabel))}
          />
          <StatPill
            label={t("results.stat.style_label")}
            value={t(getArchetypeKey(report.archetype))}
            meta={t("results.stat.style_meta")}
          />
        </div>
      </header>

      <section className="rounded-[24px] border border-sand/10 bg-sand/[0.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
          {t("results.kai_read.eyebrow")}
        </p>
        <h3 className="mt-2 text-[22px] font-black leading-[1.05] text-sand">
          {t("results.kai_read.title")}
        </h3>
        <p className="mt-3 max-w-[70ch] text-[14px] leading-relaxed text-sand/72">
          {report.summary}
        </p>
      </section>

      <section className="grid gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
            {t("results.core.eyebrow")}
          </p>
          <h3 className="mt-1 text-[20px] font-black text-sand">{t("results.core.title")}</h3>
        </div>
        <CoreSignalCard
          letter="C"
          icon={<CompassResultIcon size={20} />}
          label={t("results.core.curiosities_label")}
          value={getClusterLabel(report.clusterCode, t)}
          accent="warm"
        >
          {t("results.core.curiosities_body").replace(
            "{cluster}",
            getClusterLabel(report.clusterCode, t),
          )}
        </CoreSignalCard>
        <CoreSignalCard
          letter="O"
          icon={<ArchetypeIcon size={20} />}
          label={t("results.core.operations_label")}
          value={t(getArchetypeKey(report.archetype))}
          accent="violet"
        >
          {t("results.core.operations_body")}
        </CoreSignalCard>
        <CoreSignalCard
          letter="R"
          icon={<DriverIcon size={20} />}
          label={t("results.core.rewards_label")}
          value={report.primaryDriver}
          accent="warm"
        >
          {t("results.core.rewards_body")}
        </CoreSignalCard>
        <CoreSignalCard
          letter="E"
          icon={<EcosystemIcon size={20} />}
          label={t("results.core.ecosystems_label")}
          value={t(getEcosystemFitKey(report.ecosystemFit))}
          accent="mint"
        >
          {t("results.core.ecosystems_body")}
        </CoreSignalCard>
      </section>

      <section className="rounded-[24px] border border-sand/10 bg-night/35 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand/[0.08]">
              <ConstellationIcon size={22} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
                {t("results.scores.eyebrow")}
              </p>
              <h3 className="mt-1 text-[18px] font-black text-sand">
                {t("results.scores.title")}
              </h3>
            </div>
          </div>
          <span className="rounded-full border border-sand/10 px-3 py-1 text-[11px] font-bold text-sand/58">
            {t("results.scores.badge")}
          </span>
        </div>

        <div className="grid gap-3">
          {rankedClusters.map(([code, score], index) => (
            <div key={code} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[12px] font-bold text-sand">
                  <span
                    className="grid size-6 place-items-center rounded-full text-[10px] text-white"
                    style={{
                      background:
                        index === 0 ? clusterVisual.color : "rgba(245, 238, 230, 0.1)",
                    }}
                  >
                    {index + 1}
                  </span>
                  {getClusterLabel(code, t)}
                </span>
                <span className="tabular-nums text-[12px] font-bold text-sand/62">{score}</span>
              </div>
              <span className="h-2 overflow-hidden rounded-full bg-sand/9">
                <span
                  className="block h-full rounded-full"
                  style={{
                    background:
                      index === 0 ? clusterVisual.color : "rgba(245, 238, 230, 0.32)",
                    width: `${Math.max(8, (score / maxClusterScore) * 100)}%`,
                  }}
                />
              </span>
            </div>
          ))}
        </div>

        {report.isMultiCurious ? (
          <p className="mt-4 rounded-[18px] border border-gold/25 bg-gold/10 px-3 py-2 text-[12px] leading-snug text-sand/78">
            {t("results.scores.multi_curious").replace(
              "{clusters}",
              report.multiCuriousClusters.join(", "),
            )}
          </p>
        ) : null}
      </section>

      <section className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand/[0.08]">
              <PathForwardIcon size={22} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
                {t("results.career.eyebrow")}
              </p>
              <h3 className="mt-1 text-[20px] font-black text-sand">
                {t("results.career.title")}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {report.careerExamples.slice(0, 6).map((career, index) => (
            <CareerFamilyCard key={career} career={career} index={index} accent={clusterVisual.color} />
          ))}
        </div>

        <PathPanel
          icon={<UniversityIcon size={20} />}
          title={t("results.majors.title")}
          items={report.universityMajors}
        />

        <section className="rounded-[22px] border border-sand/10 bg-sand/[0.055] p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-gold/12 text-gold">
              <AcademicIcon size={20} />
            </span>
            <h4 className="text-[14px] font-black text-sand">{t("results.subjects.title")}</h4>
          </div>
          <div className="grid gap-2">
            {report.highSchoolSubjects.slice(0, 6).map((subject, index) => (
              <SubjectReasonCard
                key={subject}
                subject={subject}
                index={index}
                clusterName={getClusterLabel(report.clusterCode, t)}
              />
            ))}
          </div>
        </section>
      </section>

      <ReportSection
        accent={clusterVisual.color}
        icon={<CareerIcon size={20} />}
        title={t("results.section.landscape_title")}
      >
        <p>{report.careerLandscape}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<UniversityIcon size={20} />}
        title={t("results.section.academic_title")}
      >
        <p>{report.academicPath}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<Sparkles size={20} />}
        title={t("results.section.non_obvious_title")}
      >
        <TagList
          title={t("results.section.non_obvious_taglist_title")}
          items={report.nonObviousPaths}
        />
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<RealityIcon size={20} />}
        title={t("results.section.reality_title")}
      >
        <p>{report.realityCheck}</p>
        <VideoSuggestionList suggestions={videoSuggestions} />
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<CompassResultIcon size={20} />}
        title={t("results.section.integration_title")}
      >
        <p>{report.integration}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<NextStepsIcon size={20} />}
        title={t("results.section.next_steps_title")}
      >
        <p>{report.nextSteps}</p>
      </ReportSection>
    </div>
  );
}

export function StatPill({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/12 bg-white/[0.075] p-2.5 text-start">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/42">{label}</p>
      <p className="mt-1 min-h-[32px] text-[13px] font-black leading-none text-white">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-white/42">{meta}</p>
    </div>
  );
}

type TileAccent = "warm" | "violet" | "mint";

function getTileTone(accent: TileAccent) {
  return {
    warm: {
      background: "linear-gradient(135deg, rgba(255,107,61,0.22), rgba(255,165,61,0.10))",
      ring: "rgba(255,107,61,0.32)",
    },
    violet: {
      background: "linear-gradient(135deg, rgba(157,127,240,0.22), rgba(110,72,228,0.10))",
      ring: "rgba(157,127,240,0.36)",
    },
    mint: {
      background: "linear-gradient(135deg, rgba(111,224,192,0.22), rgba(111,224,192,0.06))",
      ring: "rgba(111,224,192,0.34)",
    },
  }[accent];
}

export function CoreSignalCard({
  letter,
  icon,
  label,
  value,
  accent = "warm",
  children,
}: {
  letter: string;
  icon: ReactNode;
  label: string;
  value: string;
  accent?: TileAccent;
  children: ReactNode;
}) {
  const tone = getTileTone(accent);

  return (
    <details className="group rounded-[22px] border border-sand/10 bg-sand/[0.055] p-3 open:bg-sand/[0.075]">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span
          className="relative grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{
            background: tone.background,
            boxShadow: `inset 0 0 0 1px ${tone.ring}`,
          }}
        >
          <span className="absolute left-1 top-1 text-[9px] font-black text-sand/54">
            {letter}
          </span>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-sand/42">
            {label}
          </span>
          <span className="mt-0.5 block text-[15px] font-black leading-tight text-sand">
            {value}
          </span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-sand/45 transition group-open:rotate-180" />
      </summary>
      <p className="mt-3 border-t border-sand/10 pt-3 text-[12.5px] leading-relaxed text-sand/68">
        {children}
      </p>
    </details>
  );
}

export function CareerFamilyCard({
  career,
  index,
  accent,
}: {
  career: string;
  index: number;
  accent: string;
}) {
  const { t } = useLocale();

  return (
    <div className="rounded-[22px] border border-sand/10 bg-sand/[0.055] p-3">
      <div className="flex items-start gap-3">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-black text-white"
          style={{ background: index === 0 ? accent : "rgba(245,238,230,0.12)" }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] font-black leading-tight text-sand">{career}</h4>
          <p className="mt-1 text-[12px] leading-snug text-sand/60">
            {t("results.career.explore_body")}
          </p>
          <a
            href={youtubeSearchUrl(`day in the life of ${career}`)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold"
          >
            <PlayCircle size={13} />
            {t("results.career.day_in_life_link")}
          </a>
        </div>
      </div>
    </div>
  );
}

export function SubjectReasonCard({
  subject,
  index,
  clusterName,
}: {
  subject: string;
  index: number;
  clusterName: string;
}) {
  const { t, locale } = useLocale();
  const priority =
    index < 2
      ? t("results.subject.priority_core")
      : index < 4
        ? t("results.subject.priority_strong")
        : t("results.subject.priority_useful");

  return (
    <details className="group rounded-[18px] border border-sand/10 bg-night/35 px-3 py-2.5 open:bg-night/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span className="rounded-full bg-gold/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gold">
          {priority}
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-black text-sand">{subject}</span>
        <ChevronDown size={15} className="shrink-0 text-sand/42 transition group-open:rotate-180" />
      </summary>
      <p className="mt-2 text-[12px] leading-relaxed text-sand/64">
        {getSubjectReason(subject, clusterName, locale)}
      </p>
    </details>
  );
}

export function VideoSuggestionList({
  suggestions,
}: {
  suggestions: Array<{ label: string; query: string }>;
}) {
  const { t } = useLocale();

  return (
    <div className="grid gap-2 rounded-[18px] border border-sand/10 bg-night/35 p-3">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-sand/42">
        <PlayCircle size={13} />
        {t("results.video.watch_before_choosing")}
      </p>
      <div className="grid gap-1.5">
        {suggestions.map((suggestion) => (
          <a
            key={suggestion.query}
            href={youtubeSearchUrl(suggestion.query)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-sand/10 bg-sand/[0.055] px-3 py-2 text-[11px] font-bold leading-none text-sand/74 transition hover:border-gold/35 hover:text-gold"
          >
            {suggestion.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function PathPanel({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[22px] border border-sand/10 bg-sand/[0.055] p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-gold/12 text-gold">
          {icon}
        </span>
        <h4 className="text-[14px] font-black text-sand">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 5).map((item) => (
          <span
            key={item}
            className="rounded-full border border-sand/10 bg-night/35 px-2.5 py-1 text-[11px] font-bold leading-none text-sand/74"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReportSection({
  accent,
  icon,
  title,
  children,
}: {
  accent: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-sand/10 bg-sand/[0.052] p-4 shadow-[0_12px_34px_rgba(0,0,0,0.18)]">
      <span
        aria-hidden
        className="absolute inset-y-4 left-0 w-1 rounded-r-full"
        style={{ background: accent }}
      />
      <div className="mb-3 flex items-center gap-2 text-gold">
        <span className="grid size-8 place-items-center rounded-full bg-sand/[0.09]">{icon}</span>
        <h3 className="text-[16px] font-bold text-sand">{title}</h3>
      </div>
      <div className="grid max-w-[70ch] gap-3 text-[13.5px] leading-relaxed text-sand/73">
        {children}
      </div>
    </section>
  );
}

export function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-sand/42">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((item) => (
          <span
            key={item}
            className="rounded-full border border-sand/10 bg-night/30 px-2.5 py-1 text-[11px] font-semibold leading-none text-sand/72"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function buildVideoSuggestions(report: PersonalizedCompassReport, t: Translate) {
  const candidates = [
    ...report.careerExamples.slice(0, 2).map((career) => ({
      label: t("results.video.day_in_life_label").replace("{career}", career),
      query: `day in the life of ${career}`,
    })),
    report.universityMajors[0]
      ? {
          label: t("results.video.studying_label").replace(
            "{major}",
            report.universityMajors[0],
          ),
          query: `what is it like studying ${report.universityMajors[0]}`,
        }
      : null,
    report.nonObviousPaths[0]
      ? {
          label: t("results.video.less_obvious_label").replace(
            "{path}",
            report.nonObviousPaths[0],
          ),
          query: `${report.nonObviousPaths[0]} career explained`,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; query: string }>;

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.query.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
