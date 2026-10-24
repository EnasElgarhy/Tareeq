"use client";

import { ChevronDown } from "lucide-react";
import { Fragment } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import type { FamilyView, JobView, MeetCard } from "@/lib/core-v2/section4";
import type { AxisCode, AxisSide, CuriosityCode } from "@/lib/core-v2/types";
import { Block, KaiPrompt, useWording } from "../parts";
import { SectionHero } from "./chrome";
import {
  ChangingWorkGlyph,
  CheckGlyph,
  CURIOSITY_GLYPH,
  StarGlyph,
  StudyGlyph,
} from "./icons";
import styles from "./report.module.css";

const PHRASE_FOR_SIDE: Record<AxisSide, string> = {
  S: "S4-PH-SET",
  F: "S4-PH-OPEN",
  D: "S4-PH-DEEP",
  B: "S4-PH-BROAD",
  T: "S4-PH-TOGETHER",
  O: "S4-PH-OWN",
  ST: "S4-PH-STEADY",
  CH: "S4-PH-CHANGING",
};

/** From four leading curiosities, each shows compact: name and pull, opening on tap (spec §6.3). */
const COMPACT_FROM = 4;

/* ---------------------------------------------------------- S3 curiosity */

function CuriosityHead({ code, as: Heading = "h3" }: { code: CuriosityCode; as?: "h3" | "span" }) {
  const Glyph = CURIOSITY_GLYPH[code];
  return (
    <div className={styles.storyHead}>
      <span aria-hidden="true" className={styles.storyGlyph}>
        <Glyph size={30} />
      </span>
      <span className="grid gap-0.5 text-start">
        <Heading className="daybreak-heading text-[17px] leading-tight">
          <Block id={`CUR-${code}-NAME`} />
        </Heading>
        <span className="text-[13.5px] font-semibold text-[color:var(--r-gold)]">
          <Block id={`CUR-${code}-PULL`} />
        </span>
      </span>
    </div>
  );
}

/** Dusk scenes in the same light as the section headers (made with Gemini, no people). */
const duskScene = (code: CuriosityCode) => `/report/curiosity-${code}-dusk-v1.webp`;

/** The scene as the top of the card, the curiosity's name set over its lower edge. */
function CuriosityCover({ code }: { code: CuriosityCode }) {
  const Glyph = CURIOSITY_GLYPH[code];
  return (
    <div className={styles.storyCover}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={duskScene(code)} alt="" width={960} height={536} loading="lazy" className={styles.storyCoverArt} />
      <div className={styles.storyCoverText}>
        <span aria-hidden="true" className={styles.storyGlyph}>
          <Glyph size={24} />
        </span>
        <span className="grid gap-0.5">
          <h3 className="daybreak-heading text-[18px] leading-tight">
            <Block id={`CUR-${code}-NAME`} />
          </h3>
          <span className="text-[13px] font-semibold text-[color:var(--r-gold)]">
            <Block id={`CUR-${code}-PULL`} />
          </span>
        </span>
      </div>
    </div>
  );
}

function CuriosityBody({ code }: { code: CuriosityCode }) {
  return (
    <>
      <p className="text-[14.5px] leading-relaxed">
        <Block id={`S3-${code}-DESC`} />
      </p>
      <p className={styles.subLabel}>
        <Block id="S3-NOTICE-LABEL" />
      </p>
      <ul className="flex flex-wrap gap-2">
        {["EX1", "EX2", "EX3"].map((ex) => (
          <li key={ex} className={styles.noticeChip}>
            <Block id={`S3-${code}-${ex}`} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Canvas B3: a story card per leading curiosity, joined into one direction. */
export function CuriositySection({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  const wording = useWording();
  const leaders = model.result.leadingCuriosities;
  const isCompact = leaders.length >= COMPACT_FROM;
  const answers = [
    ...leaders.flatMap((code) => {
      const name = wording(`CUR-${code}-NAME`);
      return name ? [t("core.kai.answer_most").replace("{name}", name)] : [];
    }),
    t("core.kai.answer_unsure"),
  ];
  return (
    <div className={styles.screen}>
      <SectionHero art="curiosity" titleId="S3-TITLE" introId="S3-INTRO" />
      <div className="grid gap-3">
        {leaders.map((code, i) => (
          <Fragment key={code}>
            {i > 0 && !isCompact ? <span aria-hidden="true" className={styles.dottedLink} /> : null}
            {isCompact ? (
              <details className={`${styles.card} group`}>
                <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <CuriosityHead code={code} as="span" />
                  </span>
                  <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className="shrink-0 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="grid gap-3 pt-4">
                  <CuriosityBody code={code} />
                </div>
              </details>
            ) : (
              <section className={`${styles.card} ${styles.storyCard}`}>
                <CuriosityCover code={code} />
                <CuriosityBody code={code} />
              </section>
            )}
          </Fragment>
        ))}
      </div>
      {model.clarity.includes("S2-C-COHERENT") || model.clarity.includes("S2-C-DIVERSE") ? (
        <p className="daybreak-heading text-center text-[16px]">
          <Block id={model.clarity.includes("S2-C-COHERENT") ? "S2-C-COHERENT" : "S2-C-DIVERSE"} />
        </p>
      ) : null}
      <KaiPrompt questionId="S3-KAI-Q" answers={answers} />
    </div>
  );
}

/* ------------------------------------------------------------ S4 meaning */

/** The student's own side of each axis the job matches, in axis order. */
function matchedSides(axes: readonly AxisCode[], model: ReportModel): AxisSide[] {
  return axes
    .map((axis) => model.result.axes[axis].lean)
    .filter((side): side is AxisSide => side !== null);
}

/** The bold first part of a label block: "Works the way you like to work." */
function labelLead(text: string): string {
  const stop = text.indexOf(". ");
  return (stop < 0 ? text : text.slice(0, stop)).replace(/[:.]\s*$/, "").trim();
}

/**
 * The two reasons a job can match, said once per family as a small key:
 * violet for how you like to work, gold for what motivates you. The job
 * rows below then carry only short tags in those two colours.
 */
function MatchKey({ jobs }: { jobs: readonly JobView[] }) {
  const wording = useWording();
  const hasWork = jobs.some((job) => job.isHighlighted && job.workTags.length > 0);
  const hasDrive = jobs.some((job) => job.isHighlighted && job.motivators.length > 0);
  if (!hasWork && !hasDrive) return null;
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[color:var(--r-ink-3)]">
      {hasWork ? (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-[color:var(--r-violet)]" />
          {labelLead(wording("S4-MATCH-WORK") ?? "")}
        </span>
      ) : null}
      {hasDrive ? (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-[color:var(--r-gold)]" />
          {labelLead(wording("S4-MATCH-DRV") ?? "")}
        </span>
      ) : null}
    </p>
  );
}

function JobTags({ job, model }: { job: JobView; model: ReportModel }) {
  const { locale } = useLocale();
  const wording = useWording();
  const cap = (text: string) => (locale === "ar" ? text : text.charAt(0).toUpperCase() + text.slice(1));
  const work = matchedSides(job.workTags, model).map((side) => cap(wording(PHRASE_FOR_SIDE[side]) ?? ""));
  const drive = job.motivators.map((code) => wording(`DRV-${code}-NAME`) ?? "");
  return (
    <ul className="flex flex-wrap gap-1.5">
      {work.map((tag) => (
        <li key={tag} className={styles.tagWork}>
          {tag}
        </li>
      ))}
      {drive.map((tag) => (
        <li key={tag} className={styles.tagDrive}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

function ChangingMarker({ job }: { job: JobView }) {
  const { t } = useLocale();
  if (!job.isChangingWork) return null;
  return (
    <span role="img" aria-label={t("core.jobs.changing")} title={t("core.jobs.changing")} className="inline-flex align-[-4px] text-[color:var(--r-ink-3)]">
      <ChangingWorkGlyph size={18} />
    </span>
  );
}

function ChangingNote({ isShown }: { isShown: boolean }) {
  if (!isShown) return null;
  return (
    <p className="flex gap-2 text-[12.5px] leading-relaxed text-[color:var(--r-ink-2)]">
      <span className="shrink-0 text-[color:var(--r-ink)]">
        <ChangingWorkGlyph size={22} />
      </span>
      <span>
        <Block id="S4-CHANGING" />
      </span>
    </p>
  );
}

function JobItem({ job, model }: { job: JobView; model: ReportModel }) {
  const name = model.job(job.jobId).name;
  if (!job.isHighlighted) {
    return (
      <li className={styles.jobPlain}>
        {name} <ChangingMarker job={job} />
      </li>
    );
  }
  return (
    <li className={styles.jobRow}>
      <p className="flex items-center gap-1.5 text-[14.5px] font-bold">
        <StarGlyph size={14} />
        {name} <ChangingMarker job={job} />
      </p>
      <JobTags job={job} model={model} />
    </li>
  );
}

function MeetCardView({ card, model }: { card: MeetCard; model: ReportModel }) {
  return (
    <section className={styles.meet} aria-label={model.family(card.familyId).name}>
      <p className="text-[13px] font-semibold text-[color:var(--r-gold)]">
        <Block id="S4-MEET-TITLE" />
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {card.pair.map((code, i) => {
          const Glyph = CURIOSITY_GLYPH[code];
          return (
            <Fragment key={code}>
              {i > 0 ? (
                <span aria-hidden="true" className="w-6 border-t-2 border-dotted border-[color:var(--r-lilac)]" />
              ) : null}
              <span className={styles.meetPill}>
                <span className="grid size-7 place-items-center rounded-full bg-white text-[color:var(--r-ink)]">
                  <Glyph size={20} />
                </span>
                <Block id={`CUR-${code}-NAME`} />
              </span>
            </Fragment>
          );
        })}
      </div>
      <h3 className="daybreak-heading text-[17px] leading-tight">{model.family(card.familyId).name}</h3>
      <p className="text-[14px] leading-relaxed text-[#e9e3fa]">
        <Block id={card.line} />
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {card.jobs.map((job) => (
          <li key={job.jobId} className={styles.meetJob}>
            {model.job(job.jobId).name}
            <ChangingMarker job={job} />
          </li>
        ))}
      </ul>
      {card.hasChangingNote ? (
        <div className="rounded-[14px] bg-white/10 p-3 [&_p]:text-[#e9e3fa] [&_span]:text-[#e9e3fa]">
          <ChangingNote isShown />
        </div>
      ) : null}
    </section>
  );
}

function FamilyStop({
  view,
  model,
  isOpen,
}: {
  view: FamilyView;
  model: ReportModel;
  /** The first family of a direction opens; the others fold to their name. */
  isOpen: boolean;
}) {
  const { t } = useLocale();
  const family = model.family(view.familyId);
  const heading = <h4 className="daybreak-heading text-[17px] leading-tight">{family.name}</h4>;
  return (
    <li className={styles.stop}>
      <div aria-hidden="true" className={styles.stopRail}>
        <span className={`${styles.stopDot} ${view.isClosest ? styles.stopDotClosest : ""}`} />
        <span className={styles.stopLine} />
      </div>
      <div className={styles.stopBody}>
        {view.isClosest ? (
          <span className={styles.closestBadge}>
            <Block id="S4-CLOSEST" />
          </span>
        ) : null}
        {isOpen ? (
          <>
            {heading}
            <FamilyDetails view={view} model={model} />
          </>
        ) : (
          <details className="group grid">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
              {heading}
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[color:var(--r-violet-deep)]">
                {t("core.family.explore")}
                <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="grid gap-[10px] pt-3">
              <FamilyDetails view={view} model={model} />
            </div>
          </details>
        )}
      </div>
    </li>
  );
}

function FamilyDetails({ view, model }: { view: FamilyView; model: ReportModel }) {
  const { locale } = useLocale();
  const family = model.family(view.familyId);
  return (
    <>
        <MatchKey jobs={view.jobs} />
        <ul className={styles.jobList}>
          {view.jobs.map((job) => (
            <JobItem key={job.jobId} job={job} model={model} />
          ))}
        </ul>
        <div className={styles.facts}>
          {family.studyFields.length > 0 ? (
            <div className={styles.fact}>
              <p className={styles.factLabel}>
                <span className="text-[color:var(--r-violet)]">
                  <StudyGlyph size={18} />
                </span>
                <Block id="S4-STUDY-LABEL" part="lead" />
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {family.studyFields.map((field) => (
                  <li key={field} className={styles.fieldChip}>
                    {locale === "ar" ? field : field.charAt(0).toUpperCase() + field.slice(1)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className={styles.fact}>
            <p className={styles.factLabel}>
              <span className="text-[color:var(--r-gold-ink)]">
                <CheckGlyph size={18} />
              </span>
              <Block id="S4-CHECK-LABEL" part="lead" />
            </p>
            <p className="text-[14px] font-semibold leading-snug text-[color:var(--r-ink)]">
              <Block id={view.worthChecking} />
            </p>
          </div>
        </div>
        <ChangingNote isShown={view.hasChangingNote} />
    </>
  );
}

/** "A and B" / "A, B and C"; in Arabic "أ، وب". */
function joinNames(names: string[], locale: string, and: string): string {
  if (names.length < 2) return names.join("");
  const comma = locale === "ar" ? "، " : ", ";
  return `${names.slice(0, -1).join(comma)}${and}${names[names.length - 1]}`;
}

function AlsoCuriosities({ codes }: { codes: readonly CuriosityCode[] }) {
  const { t, locale } = useLocale();
  const wording = useWording();
  if (codes.length === 0) return null;
  const names = codes.map((code) => wording(`CUR-${code}-NAME`) ?? code);
  return (
    <p className={`${styles.card} text-[14px] leading-relaxed`}>
      <Block id="S4-ALSO" fills={{ curiosities: joinNames(names, locale, t("core.list.and")) }} />
    </p>
  );
}

/** Canvas B4: meet cards, then each leading curiosity's families as a trail. */
export function MeaningSection({ model }: { model: ReportModel }) {
  const { t } = useLocale();
  const { section4 } = model;
  return (
    <div className={styles.screen}>
      <SectionHero art="meaning" titleId="S4-TITLE" introId="S4-INTRO" />
      {section4.noMatch ? (
        <p className="text-[13.5px] leading-relaxed text-[color:var(--r-ink-2)]">
          <Block id="S4-NOMATCH" />
        </p>
      ) : null}
      {section4.meetCards.map((card) => (
        <MeetCardView key={card.familyId} card={card} model={model} />
      ))}
      <AlsoCuriosities codes={section4.alsoCuriosities} />
      {section4.directions.map((direction) => {
        const Glyph = CURIOSITY_GLYPH[direction.curiosity];
        return (
          <section key={direction.curiosity} className="grid gap-3">
            <div className={styles.directionHead}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[color:var(--r-violet)]">
                <Glyph size={28} />
              </span>
              <span className="grid gap-0.5">
                <h3 className="daybreak-heading text-[16px] leading-tight">
                  <Block id={`CUR-${direction.curiosity}-NAME`} />
                </h3>
                <span className="text-[13px] font-semibold text-[color:var(--r-ink-2)]">
                  <Block id={`CUR-${direction.curiosity}-PULL`} />
                </span>
              </span>
            </div>
            <ol className={styles.timeline}>
              {direction.full.map((view, i) => (
                <FamilyStop key={view.familyId} view={view} model={model} isOpen={i === 0} />
              ))}
            </ol>
            {direction.more.length > 0 ? (
              <p className="text-[13px] leading-relaxed text-[color:var(--r-ink-2)]">
                <strong className="font-extrabold text-[color:var(--r-ink)]">
                  <Block id="S4-MORE-LABEL" />
                </strong>{" "}
                {direction.more.map((id) => model.family(id).name).join(" · ")}
              </p>
            ) : null}
          </section>
        );
      })}
      <div className="grid gap-1.5 text-[12.5px] leading-relaxed text-[color:var(--r-ink-3)]">
        <p>
          <Block id="S4-REQ-NOTE" />
        </p>
        <p className="italic">
          <Block id="P2-QUALIFIER" />
        </p>
      </div>
      <KaiPrompt questionId="S4-KAI-Q" answers={[t("core.kai.s4_day"), t("core.kai.s4_fit")]} />
    </div>
  );
}
