"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Block, kaiHref, useWording } from "@/components/core-report/parts";
import {
  CURIOSITY_GLYPH,
  StudyGlyph,
  TryGlyph,
  WatchGlyph,
} from "@/components/core-report/v3/icons";
import { FeedCarousel } from "@/components/home/FeedCarousel";
import { OverviewHeader } from "@/components/home/OverviewHeader";
import { StreakCard } from "@/components/home/StreakCard";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KaiAvatar } from "@/components/kai/KaiAvatar";
import { coreBank } from "@/lib/core-v2/content/core-content";
import { buildReportModel, type ReportModel } from "@/lib/core-v2/report-model";
import type { StoredCoreReport } from "@/lib/core-v2/storage";
import type { CuriosityCode } from "@/lib/core-v2/types";
import { computeStreak, recordVisitToday } from "@/lib/profile/streak";
import { readResultRegistration } from "@/lib/results/storage";

/** Family cards on the Overview; the report itself shows every family. */
const FAMILY_LIMIT = 6;
const JOBS_PER_FAMILY = 3;
const STUDY_FIELDS_PER_FAMILY = 2;
const STUDY_FIELD_LIMIT = 8;
const KAI_QUESTION_ID = "S4-KAI-Q";

/** Kai on the night path holding her report; the mirrored copy keeps her facing the text in Arabic. */
const HERO_ART = {
  ltr: "/assessment/kai-path-night.webp",
  rtl: "/assessment/kai-path-night-rtl.webp",
  width: 1536,
  height: 1024,
  /** Where Kai stands in the left-to-right art, as a share of its width. */
  focusX: 26,
} as const;

/** Strong ease-out: movement starts at once, so a press feels heard. */
const PRESS = "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]";
const NIGHT = "#100A24";

/** Sections arrive in reading order, a beat apart; never long enough to wait for. */
function revealAfter(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

interface FamilyCardData {
  id: string;
  name: string;
  jobs: string[];
  studyFields: string[];
  /** One curiosity, or the two a "where your curiosities meet" family joins. */
  curiosities: readonly CuriosityCode[];
  isClosest: boolean;
}

/** The families the report shows first, in the report's own order. */
function familyCards(model: ReportModel): FamilyCardData[] {
  const { meetCards, directions } = model.section4;
  const shown = [
    ...meetCards.map((card) => ({ card, isClosest: false })),
    ...directions.flatMap((direction) =>
      direction.full.map((card) => ({ card, isClosest: card.isClosest })),
    ),
  ];
  return shown.slice(0, FAMILY_LIMIT).map(({ card, isClosest }) => {
    const family = model.family(card.familyId);
    return {
      id: card.familyId,
      name: family.name,
      jobs: card.jobs.slice(0, JOBS_PER_FAMILY).map((job) => model.job(job.jobId).name),
      studyFields: family.studyFields.slice(0, STUDY_FIELDS_PER_FAMILY),
      curiosities: family.curiosities,
      isClosest,
    };
  });
}

/** The bank writes fields as they read mid-list; a chip stands alone, so it takes a capital. */
function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function uniqueStudyFields(model: ReportModel, cards: readonly FamilyCardData[]): string[] {
  const all = cards.flatMap((card) => model.family(card.id).studyFields.map(capitalized));
  return [...new Set(all)].slice(0, STUDY_FIELD_LIMIT);
}

/**
 * The night card that opens the report: Kai on the path with the report in
 * her hands, and what sparks the student's curiosity in the report's words.
 * On phones the art sits above the text; from `sm` it fills the start side
 * and the text takes the open sky.
 */
function CuriosityHero({ codes }: { codes: readonly CuriosityCode[] }) {
  const { dir, t } = useLocale();
  const isRtl = dir === "rtl";
  const focusX = isRtl ? 100 - HERO_ART.focusX : HERO_ART.focusX;
  const toText = isRtl ? "270deg" : "90deg";
  return (
    <Link
      href="/compass"
      className={`rounded-story daybreak-reveal group relative isolate block overflow-hidden shadow-[0_24px_56px_rgba(8,5,26,0.22)] active:scale-[0.99] ${PRESS}`}
      style={{ background: NIGHT }}
    >
      <Image
        src={isRtl ? HERO_ART.rtl : HERO_ART.ltr}
        alt=""
        width={HERO_ART.width}
        height={HERO_ART.height}
        priority
        sizes="(min-width: 640px) 60vw, 100vw"
        className="absolute inset-x-0 top-0 -z-10 h-[58%] w-full object-cover sm:inset-y-0 sm:start-0 sm:end-auto sm:h-full sm:w-[64%]"
        style={{ objectPosition: `${focusX}% 58%` }}
      />
      {/* The art melts into the night where the text sits. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 sm:hidden"
        style={{ background: `linear-gradient(to bottom, transparent 26%, ${NIGHT} 60%)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden sm:block"
        style={{ background: `linear-gradient(${toText}, transparent 30%, ${NIGHT} 66%)` }}
      />

      <div className="flex min-h-[404px] flex-col justify-end p-5 sm:ms-auto sm:min-h-[340px] sm:w-[50%] sm:justify-center sm:p-8 sm:ps-0">
        <p className="text-[12px] font-bold text-[#F4C660]">
          <Block id="S2-C-TITLE" />
        </p>
        <ul className="mt-3 grid gap-4">
          {codes.map((code) => {
            const Glyph = CURIOSITY_GLYPH[code];
            return (
              <li key={code} className="flex items-start gap-3.5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#F5EEE6] ring-1 ring-inset ring-white/15">
                  <Glyph size={28} />
                </span>
                <div className="min-w-0">
                  <h2
                    className={`daybreak-heading text-[#F5EEE6] ${codes.length > 1 ? "text-[23px] leading-[1.1] sm:text-[27px]" : "text-[30px] leading-[1.04] sm:text-[38px]"}`}
                  >
                    <Block id={`CUR-${code}-NAME`} />
                  </h2>
                  <p className="mt-1 text-[13.5px] leading-snug text-[#C8B6F0]">
                    <Block id={`CUR-${code}-PULL`} />
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <span className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F5EEE6] px-4 py-2.5 text-[12.5px] font-bold text-[#100A24]">
          {t("home.report.open_cta")}
          <ArrowRight
            size={14}
            className={`flip-rtl ${PRESS} [@media(hover:hover)]:group-hover:translate-x-0.5 rtl:[@media(hover:hover)]:group-hover:-translate-x-0.5`}
          />
        </span>
      </div>
    </Link>
  );
}

const BAND_LILAC = "linear-gradient(150deg, rgba(109,91,168,0.24), rgba(109,91,168,0.07))";
const BAND_GOLD = "linear-gradient(150deg, rgba(244,198,96,0.5), rgba(244,198,96,0.14))";

/**
 * A job family: a tinted band carrying the curiosity it grows from (two for
 * a family where curiosities meet), then the jobs and study fields. Gold
 * marks the families closest to the student's answers.
 */
function FamilyCard({ card }: { card: FamilyCardData }) {
  const { locale } = useLocale();
  const listSeparator = locale === "ar" ? "، " : ", ";
  const [lead] = card.curiosities;
  const Watermark = lead ? CURIOSITY_GLYPH[lead] : null;
  return (
    <Link
      href="/compass"
      className="daybreak-story-card rounded-story-alt flex w-[270px] shrink-0 snap-start flex-col overflow-hidden active:scale-[0.98] min-[390px]:w-[300px] md:w-[252px]"
    >
      <div
        className="relative flex h-[92px] items-end justify-between gap-2 overflow-hidden px-4 pb-3"
        style={{ background: card.isClosest ? BAND_GOLD : BAND_LILAC }}
      >
        {Watermark ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -end-5 -top-6 rotate-[-10deg] text-[color:var(--daybreak-violet-deep)] opacity-[0.11]"
          >
            <Watermark size={128} />
          </span>
        ) : null}
        <span className="relative flex">
          {card.curiosities.map((code, index) => {
            const Glyph = CURIOSITY_GLYPH[code];
            return (
              <span
                key={code}
                className={`grid size-11 place-items-center rounded-2xl bg-[color:var(--day-card)] text-[color:var(--daybreak-violet-deep)] shadow-[0_4px_12px_rgba(42,31,79,0.12)] ${index > 0 ? "-ms-2.5" : ""}`}
              >
                <Glyph size={26} />
              </span>
            );
          })}
        </span>
        {card.isClosest ? (
          <span className="relative rounded-full bg-[color:var(--day-card)] px-2.5 py-1 text-[10.5px] font-bold text-[#6B4D00] shadow-[0_2px_8px_rgba(107,77,0,0.12)]">
            <Block id="S4-CLOSEST" />
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="daybreak-heading text-[19px] leading-tight text-[color:var(--day-ink)]">
          {card.name}
        </h3>
        <ul className="mb-3.5 mt-3 grid gap-1.5">
          {card.jobs.map((job) => (
            <li
              key={job}
              className="flex items-baseline gap-2 text-[13px] leading-snug text-[color:var(--day-ink-2)]"
            >
              <span
                aria-hidden
                className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-[color:var(--daybreak-violet)] opacity-60"
              />
              {job}
            </li>
          ))}
        </ul>
        {card.studyFields.length > 0 ? (
          <p className="mt-auto flex items-start gap-1.5 border-t border-[color:var(--day-line)] pt-3 text-[11.5px] leading-snug text-[color:var(--day-ink-3)]">
            <StudyGlyph size={16} className="mt-px shrink-0" />
            <span>{card.studyFields.join(listSeparator)}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="daybreak-heading text-[22px] leading-tight text-[color:var(--day-ink)]">
      {children}
    </h2>
  );
}

/** Study fields sit on the inset paper, not another card: a quieter beat between two card rows. */
function StudyFields({ fields }: { fields: readonly string[] }) {
  const { t } = useLocale();
  return (
    <section
      className="rounded-story-alt daybreak-reveal grid gap-3.5 bg-[color:var(--day-inset)] p-5"
      style={revealAfter(110)}
    >
      <div className="flex items-center gap-3">
        <span className="daybreak-icon-tile size-10">
          <StudyGlyph size={24} />
        </span>
        <SectionHeading>{t("home.overview.core.study_title")}</SectionHeading>
      </div>
      <ul className="flex flex-wrap gap-2">
        {fields.map((field) => (
          <li
            key={field}
            className="rounded-full bg-[color:var(--day-card)] px-3.5 py-2 text-[12.5px] font-semibold text-[color:var(--day-ink-2)] shadow-[0_1px_2px_rgba(43,36,28,0.06)]"
          >
            {field}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Step({
  glyph: Glyph,
  label,
  children,
}: {
  glyph: typeof WatchGlyph;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="daybreak-icon-tile size-11">
        <Glyph size={26} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[12px] font-bold text-[#6B4D00]">{label}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {children}
        </p>
      </div>
    </li>
  );
}

function NextSteps({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  const [firstTry] = model.nextSteps.tryBlocks;
  return (
    <section className="daybreak-reveal grid gap-3" style={revealAfter(150)}>
      <SectionHeading>{t("home.overview.core.steps_title")}</SectionHeading>
      <div className="daybreak-story-card rounded-story grid gap-5 p-5">
        <ol className="grid gap-5">
          <Step glyph={WatchGlyph} label={<Block id="S5-WATCH" part="lead" />}>
            <Block id="S5-WATCH" fills={model.watchFills} part="rest" />
          </Step>
          {firstTry ? (
            <Step glyph={TryGlyph} label={<Block id="S5-TRY-LABEL" part="lead" />}>
              <Block id={firstTry} />
            </Step>
          ) : null}
        </ol>
        <div className="border-t border-[color:var(--day-line)] pt-4">
          <Link
            href="/compass"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[color:var(--daybreak-violet-deep)] underline-offset-4 [@media(hover:hover)]:hover:underline"
          >
            {t("home.overview.core.steps_more")}
            <ArrowRight size={14} className="flip-rtl" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Kai's question about where the curiosities lead, as she would say it, with one-tap answers. */
function KaiCard() {
  const { t } = useLocale();
  const answers = [t("core.kai.s4_day"), t("core.kai.s4_fit")];
  return (
    <aside
      className="rounded-story daybreak-reveal grid gap-4 border border-[rgba(109,91,168,0.18)] p-5 shadow-[0_10px_36px_rgba(42,31,79,0.07)]"
      style={{
        ...revealAfter(90),
        background: "linear-gradient(165deg, #EDE6FA 0%, #FFFCF6 62%)",
      }}
    >
      <div className="flex items-center gap-3">
        <KaiAvatar size={52} isTalking={false} />
        <div className="min-w-0">
          <p className="daybreak-heading text-[18px] leading-tight text-[color:var(--day-ink)]">
            {t("home.tab.kai")}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-[color:var(--day-ink-3)]">
            {t("kai.chat.subtitle")}
          </p>
        </div>
      </div>
      <p className="rounded-[1.4rem] rounded-ss-md bg-[color:var(--day-card)] px-4 py-3.5 text-[13.5px] leading-relaxed text-[color:var(--day-ink)] shadow-[0_2px_10px_rgba(42,31,79,0.07)]">
        <Block id={KAI_QUESTION_ID} />
      </p>
      <div className="flex flex-wrap gap-2">
        {answers.map((answer) => (
          <Link
            key={answer}
            href={kaiHref(KAI_QUESTION_ID, answer)}
            className={`rounded-full border border-[rgba(109,91,168,0.28)] bg-white/75 px-3.5 py-2 text-[12.5px] font-semibold text-[color:var(--daybreak-violet-deep)] active:scale-[0.97] [@media(hover:hover)]:hover:bg-white ${PRESS}`}
          >
            {answer}
          </Link>
        ))}
      </div>
      <Link
        href={kaiHref(KAI_QUESTION_ID, null)}
        className="daybreak-primary-action w-fit"
      >
        {t("home.overview.core.kai_open")}
        <ArrowRight size={15} className="flip-rtl" />
      </Link>
    </aside>
  );
}

/**
 * The Overview for a CORE 2.0 report: the leading curiosities, the job
 * families and study fields they point to, the first next steps and Kai.
 * Every report sentence comes from the approved wording; `fallback` shows
 * if the report cannot be assembled on this device.
 */
export function CoreOverview({
  report,
  fallback,
}: {
  report: StoredCoreReport;
  fallback: ReactNode;
}) {
  const { locale, t } = useLocale();
  const wording = useWording();
  const [name, setName] = useState<string | null>(null);
  const [visitDates, setVisitDates] = useState<string[]>([]);

  useEffect(() => {
    setName(readResultRegistration()?.name ?? null);
    setVisitDates(recordVisitToday());
  }, []);

  const model = useMemo(() => {
    try {
      return buildReportModel(
        report.result,
        coreBank(locale),
        { isFlagged: report.isFlagged, isFlagsLive: false },
        locale,
      );
    } catch {
      // A result the career bank cannot place: the report screen explains it.
      return null;
    }
  }, [report, locale]);

  if (!model) return <>{fallback}</>;

  const cards = familyCards(model);
  const studyFields = uniqueStudyFields(model, cards);
  // Curiosities whose wording is still pending are left to the report itself.
  const curiosities = model.result.leadingCuriosities.filter(
    (code) => wording(`CUR-${code}-NAME`) !== null,
  );

  return (
    <section className="flex flex-1 flex-col gap-6 pb-5 lg:gap-7">
      <OverviewHeader name={name} />
      <CuriosityHero codes={curiosities} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.72fr)] xl:gap-7">
        <div className="grid min-w-0 gap-6">
          {cards.length > 0 ? (
            <FeedCarousel
              title={t("home.overview.core.families_title")}
              subtitle={t("home.overview.core.families_subtitle")}
              hasControls
            >
              {cards.map((card) => (
                <FamilyCard key={card.id} card={card} />
              ))}
            </FeedCarousel>
          ) : null}

          {studyFields.length > 0 ? <StudyFields fields={studyFields} /> : null}

          <NextSteps model={model} />
        </div>

        <div className="grid min-w-0 gap-6">
          <KaiCard />
          <StreakCard streak={computeStreak(visitDates, new Date())} />
        </div>
      </div>
    </section>
  );
}
