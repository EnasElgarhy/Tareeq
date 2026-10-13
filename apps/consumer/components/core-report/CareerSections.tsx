"use client";

import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Eye,
  GraduationCap as LearningIcon,
  HandHeart,
  MessageCircleQuestion,
  Puzzle,
  Search,
  Sparkles,
} from "lucide-react";
import { GraduationCap, MagnifyingGlass } from "@phosphor-icons/react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportModel } from "@/lib/core-v2/report-model";
import type { FamilyView, JobView, MeetCard } from "@/lib/core-v2/section4";
import type { AxisCode, CuriosityCode } from "@/lib/core-v2/types";
import {
  CuriosityRing,
  DeckHeader,
  LetterTile,
  sideIcon,
  strandFor,
} from "./glance/deck";
import { CURIOSITY_ICON, MOTIVATOR_ICON } from "./glance/icons";
import { CURIOSITY_TILE_BG, LETTER_FILL } from "./glance/palette";
import { Block, KaiPrompt } from "./parts";
import styles from "./ReportDesign.module.css";

const PHRASE_FOR_SIDE: Record<string, string> = {
  S: "S4-PH-SET",
  F: "S4-PH-OPEN",
  D: "S4-PH-DEEP",
  B: "S4-PH-BROAD",
  T: "S4-PH-TOGETHER",
  O: "S4-PH-OWN",
  ST: "S4-PH-STEADY",
  CH: "S4-PH-CHANGING",
};

/** Curiosity name and its "pull" line, beside the ring from the C tile. */
function CuriosityTitle({
  code,
  model,
  headingId,
  as: Heading = "h3",
}: {
  code: CuriosityCode;
  model: ReportModel;
  headingId?: string;
  as?: "h3" | "h4";
}) {
  return (
    <div className="flex items-center gap-3">
      <CuriosityRing code={code} model={model} />
      <div className="min-w-0">
        <Heading
          id={headingId}
          className="daybreak-heading text-[20px] leading-tight text-[color:var(--day-ink)]"
        >
          <Block id={`CUR-${code}-NAME`} />
        </Heading>
        <p className="mt-0.5 text-[13px] font-semibold text-[color:var(--daybreak-gold-ink)]">
          <Block id={`CUR-${code}-PULL`} />
        </p>
      </div>
    </div>
  );
}

const CURIOSITY_SCENES: Partial<Record<CuriosityCode, string>> = {
  RD: "/report/curiosity-research-v1.webp",
  PW: "/report/curiosity-wellbeing-v1.webp",
};
const OBSERVATION_ICONS = {
  RD: [MessageCircleQuestion, Search, Puzzle],
  PW: [HandHeart, Eye, LearningIcon],
} as const;
const DEFAULT_OBSERVATION_ICONS = [CircleHelp, BookOpen, Sparkles];

/** A curiosity world, followed by visual cues from the original report wording. */
export function CuriositySection({ model }: { model: ReportModel }) {
  return (
    <div className={styles.curiosityStories}>
      <DeckHeader letter="C" titleId="S3-TITLE" introId="S3-INTRO" />
      {model.result.leadingCuriosities.map((code) => {
        const strand = strandFor(model, code);
        const headingId = `core-s3-${code}`;
        const scene = CURIOSITY_SCENES[code];
        const DomainIcon = CURIOSITY_ICON[code];
        const observationIcons =
          code === "RD" || code === "PW"
            ? OBSERVATION_ICONS[code]
            : DEFAULT_OBSERVATION_ICONS;
        return (
          <section
            key={code}
            aria-labelledby={headingId}
            className={styles.curiosityStory}
            style={
              {
                "--curiosity-ink": strand.icon,
                "--curiosity-tint": strand.stroke,
              } as React.CSSProperties
            }
          >
            <div className={styles.curiosityScene}>
              <div className={styles.curiosityNarrative}>
                <CuriosityTitle
                  code={code}
                  model={model}
                  headingId={headingId}
                />
                <p>
                  <Block id={`S3-${code}-DESC`} />
                </p>
              </div>
              <div className={styles.curiosityArtwork} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scene ?? "/report/direction-discovery-v1.webp"}
                  alt=""
                  width={768}
                  height={512}
                  loading="lazy"
                />
                {!scene ? (
                  <span className={styles.sceneDomain}>
                    <DomainIcon size={46} weight="duotone" />
                  </span>
                ) : null}
              </div>
            </div>
            <div className={styles.curiosityObservations}>
              <h4 className="daybreak-heading">
                <Block id="S3-NOTICE-LABEL" />
              </h4>
              <ul className={styles.observationGrid}>
                {["EX1", "EX2", "EX3"].map((ex, index) => {
                  const Icon = observationIcons[index];
                  return (
                    <li key={ex}>
                      <span
                        className={styles.observationIcon}
                        aria-hidden="true"
                      >
                        <Icon size={28} strokeWidth={1.6} />
                      </span>
                      <p>
                        <Block id={`S3-${code}-${ex}`} />
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
      <KaiPrompt questionId="S3-KAI-Q" />
    </div>
  );
}

/** One "this work offers" line: a letter tile, then phrase chips with icons. */
function MatchLine({
  letter,
  labelId,
  children,
}: {
  letter: "O" | "R";
  labelId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="flex items-center gap-2 text-[12px] leading-snug text-[color:var(--day-ink-2)]">
        <LetterTile letter={letter} size="sm" />
        <Block id={labelId} />
      </p>
      <ul className="flex flex-wrap gap-1.5">{children}</ul>
    </div>
  );
}

function MatchChip({
  letter,
  icon: Icon,
  children,
}: {
  letter: "O" | "R";
  icon: ReturnType<typeof sideIcon>;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`flex items-center gap-1.5 text-[color:var(--day-ink)] ${styles.matchChip}`}
    >
      {Icon ? (
        <Icon
          size={14}
          weight="fill"
          aria-hidden="true"
          className="shrink-0"
          style={{ color: LETTER_FILL[letter] }}
        />
      ) : null}
      {children}
    </li>
  );
}

function JobRow({ job, model }: { job: JobView; model: ReportModel }) {
  const name = model.job(job.jobId).name;
  if (!job.isHighlighted) {
    return (
      <li className="px-1 py-1 text-[13.5px] text-[color:var(--day-ink-2)]">
        {name}
      </li>
    );
  }
  const sides = job.workTags
    .map((axis: AxisCode) => model.result.axes[axis].lean)
    .filter((side) => side !== null);
  return (
    <li className={`grid ${styles.job}`}>
      <p className="text-[15px] font-bold text-[color:var(--day-ink)]">
        {name}
      </p>
      {sides.length > 0 ? (
        <MatchLine letter="O" labelId="S4-MATCH-WORK">
          {sides.map((side) => (
            <MatchChip key={side} letter="O" icon={sideIcon(side)}>
              <Block id={PHRASE_FOR_SIDE[side]} />
            </MatchChip>
          ))}
        </MatchLine>
      ) : null}
      {job.motivators.length > 0 ? (
        <MatchLine letter="R" labelId="S4-MATCH-DRV">
          {job.motivators.map((code) => (
            <MatchChip
              key={code}
              letter="R"
              icon={MOTIVATOR_ICON[code] ?? null}
            >
              <Block id={`DRV-${code}-NAME`} />
            </MatchChip>
          ))}
        </MatchLine>
      ) : null}
    </li>
  );
}

const MEET_W = 120;
const MEET_H = 40;

/** Two strands leaving their rings and braiding into one: where the curiosities meet. */
function MeetStrands({
  pair,
  model,
}: {
  pair: MeetCard["pair"];
  model: ReportModel;
}) {
  const [a, b] = pair.map((code) => strandFor(model, code));
  return (
    <svg
      viewBox={`0 0 ${MEET_W} ${MEET_H}`}
      fill="none"
      aria-hidden="true"
      className="mx-auto -my-1 block h-10 w-[120px] rtl:-scale-x-100"
    >
      <path
        d="M20 0 C20 22 56 18 56 40"
        stroke={a.stroke}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M100 0 C100 22 64 18 64 40"
        stroke={b.stroke}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MeetCardView({ card, model }: { card: MeetCard; model: ReportModel }) {
  const family = model.family(card.familyId);
  return (
    <section
      aria-label={family.name}
      className={`relative overflow-hidden text-[#fffcf6] ${styles.meetCard}`}
      style={{ background: CURIOSITY_TILE_BG }}
    >
      <p className="relative text-[14px] font-semibold text-[#f3d9b1]">
        <Block id="S4-MEET-TITLE" />
      </p>
      <div className="relative mx-auto mt-4 grid w-full max-w-[340px] grid-cols-2 gap-3 text-center">
        {card.pair.map((code) => (
          <div key={code} className="grid justify-items-center gap-2">
            <p className="font-heading text-[14.5px] font-bold leading-tight">
              <Block id={`CUR-${code}-NAME`} />
            </p>
            {CURIOSITY_SCENES[code] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={CURIOSITY_SCENES[code]}
                alt=""
                width={180}
                height={120}
                className={styles.meetSceneArt}
                loading="lazy"
              />
            ) : (
              <CuriosityRing code={code} model={model} />
            )}
          </div>
        ))}
      </div>
      <MeetStrands pair={card.pair} model={model} />
      <div
        className={`relative mx-auto grid max-w-[460px] justify-items-center gap-1 bg-[color:var(--day-card)] px-4 py-4 text-center text-[color:var(--day-ink)] ${styles.meetResult}`}
      >
        <h3 className="daybreak-heading text-[21px] leading-tight">
          {family.name}
        </h3>
        <p className="text-[13px] text-[color:var(--day-ink-2)]">
          <Block id={card.line} />
        </p>
        <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
          {card.jobs.map((job) => (
            <li
              key={job.jobId}
              className="rounded-full bg-[color:var(--day-inset)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--day-ink)]"
            >
              {model.job(job.jobId).name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FamilyCard({ view, model }: { view: FamilyView; model: ReportModel }) {
  const { t } = useLocale();
  const family = model.family(view.familyId);
  return (
    <details
      className={`${styles.card} ${styles.familyDisclosure}`}
      open={view.isClosest}
    >
      <summary>
        <div
          className={`flex flex-wrap justify-between gap-2 ${styles.familyHeading}`}
        >
          <h4 className="daybreak-heading text-[18px] leading-tight text-[color:var(--day-ink)]">
            {family.name}
          </h4>
          {view.isClosest ? (
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${styles.closestBadge}`}
            >
              <Block id="S4-CLOSEST" />
            </span>
          ) : null}
        </div>
        <span className={styles.familyExplore}>
          {t("core.family.explore")}
          <ChevronDown size={17} aria-hidden="true" />
        </span>
      </summary>
      <div className="grid gap-3.5 pt-4">
        {view.jobs.length > 0 ? (
          <ul className="grid gap-1.5">
            {view.jobs.map((job) => (
              <JobRow key={job.jobId} job={job} model={model} />
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-[color:var(--day-ink-3)]">
            {t("core.jobs.pending")}
          </p>
        )}
        {family.studyFields.length > 0 ? (
          <p
            className={`flex gap-2 text-[color:var(--day-ink-2)] ${styles.studyFields}`}
          >
            <GraduationCap
              size={18}
              weight="duotone"
              aria-hidden="true"
              className="shrink-0 text-[color:var(--day-ink)]"
            />
            <span>
              <strong className="font-bold text-[color:var(--day-ink)]">
                <Block id="S4-STUDY-LABEL" />
              </strong>{" "}
              {family.studyFields.join(", ")}
            </span>
          </p>
        ) : null}
        <p
          className={`flex gap-2 text-[color:var(--day-ink-2)] ${styles.worthChecking}`}
        >
          <MagnifyingGlass
            size={18}
            weight="duotone"
            aria-hidden="true"
            className="shrink-0 text-[color:var(--day-ink)]"
          />
          <span>
            <strong className="font-bold text-[color:var(--day-ink)]">
              <Block id="S4-CHECK-LABEL" />
            </strong>{" "}
            <Block id={view.worthChecking} />
          </span>
        </p>
      </div>
    </details>
  );
}

/** Section 4 · What this means for you (spec §6.4). */
export function MeaningSection({ model }: { model: ReportModel }) {
  const { section4 } = model;
  return (
    <div className="grid gap-4">
      <DeckHeader titleId="S4-TITLE" introId="S4-INTRO" />
      {section4.noMatch ? (
        <p className="text-[13px] text-[color:var(--day-ink-2)]">
          <Block id="S4-NOMATCH" />
        </p>
      ) : null}
      {section4.meetCards.map((card) => (
        <MeetCardView key={card.familyId} card={card} model={model} />
      ))}
      {section4.directions.map((direction) => (
        <section
          key={direction.curiosity}
          className={`grid ${styles.direction}`}
        >
          <CuriosityTitle code={direction.curiosity} model={model} />
          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
            {direction.full.map((view) => (
              <FamilyCard key={view.familyId} view={view} model={model} />
            ))}
          </div>
          {direction.more.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-[13px] font-semibold text-[color:var(--day-ink)]">
                <Block id="S4-MORE-LABEL" />
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {direction.more.map((id) => (
                  <li
                    key={id}
                    className="rounded-full bg-[color:var(--day-card)] px-3 py-1.5 text-[12.5px] font-semibold text-[color:var(--day-ink-2)] shadow-[0_4px_10px_rgba(43,36,28,0.05)]"
                  >
                    {model.family(id).name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
      <p className="text-[12.5px] leading-relaxed text-[color:var(--day-ink-3)]">
        <Block id="S4-REQ-NOTE" />
      </p>
      <p className="text-[12.5px] italic text-[color:var(--day-ink-3)]">
        <Block id="P2-QUALIFIER" />
      </p>
      <KaiPrompt questionId="S4-KAI-Q" />
    </div>
  );
}
