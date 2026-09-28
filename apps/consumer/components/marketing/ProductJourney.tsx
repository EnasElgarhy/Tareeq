"use client";

import { Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KAI_AVATAR } from "./KaiGuide";
import { getJourneyCopy, type JourneyCopy } from "./productJourneyCopy";

/**
 * The hero's product story, told as glass cards that drift around the
 * gateway artwork rather than stacking into one panel. The Career Compass
 * is the product's own artifact (see CompassCard and the share-card route),
 * so its dial and axis colours carry the story.
 *
 * On wide screens each card takes an absolute slot around the artwork; below
 * the split they fall back into normal flow so nothing overlaps on a phone.
 */

const AXES = [
  { key: "C", tone: "#F4C660", angle: -90 },
  { key: "O", tone: "#6FE0C0", angle: 0 },
  { key: "R", tone: "#F2A8B3", angle: 90 },
  { key: "E", tone: "#9D7FF0", angle: 180 },
] as const;

const JourneyCopyContext = createContext<JourneyCopy>(getJourneyCopy("en"));
const useJourney = () => useContext(JourneyCopyContext);

const STAGES = [
  "intro",
  "assessment",
  "compass",
  "paths",
  "kai",
  "summary",
] as const;
type Stage = (typeof STAGES)[number];

const HOLD: Record<Stage, number> = {
  intro: 4600,
  assessment: 3600,
  compass: 3200,
  paths: 3800,
  kai: 4200,
  summary: 2600,
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Dark polished glass with a masked gradient rim (see .glass-rim in
 *  globals.css). `tone` leans the edge light warm or cool depending on how
 *  close the card sits to the lit doorway. */
const GLASS = "rounded-[20px] glass-rim";

interface CardProps {
  children: React.ReactNode;
  /** Absolute slot on wide screens. Ignored below the split. */
  at: string;
  delay?: number;
  width?: string;
  drift?: number;
  /** "warm" for cards nearest the doorway, "cool" for those farther left. */
  tone?: "warm" | "cool";
  /** Kai speaks in a bubble; "pill" is her wide introduction card. */
  shape?: "card" | "bubble" | "pill";
}

const Card = ({
  children,
  at,
  delay = 0,
  width = "w-[17rem]",
  drift = 0,
  tone = "cool",
  shape = "card",
}: CardProps) => (
  // Enter/exit lives on the outer element and the endless idle drift on the
  // inner one. Sharing a `y` between them would leave `repeat: Infinity` on
  // the exit transition, so exit would never finish and AnimatePresence
  // `mode="wait"` would stall on the first stage forever.
  <motion.div
    initial={{ opacity: 0, y: 18, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -14, scale: 0.96 }}
    transition={{ duration: 0.5, delay, ease: EASE }}
    className={`glass-rim glass-rim--${tone} ${
      shape === "bubble"
        ? "rounded-[22px] rounded-bl-[7px]"
        : shape === "pill"
          ? "rounded-[28px]"
          : "rounded-[20px]"
    } p-4 ${width} shrink-0 lg:absolute ${at}`}
  >
    <motion.div
      animate={drift ? { y: [0, -drift, 0] } : undefined}
      transition={
        drift
          ? { duration: 6, repeat: Infinity, ease: "easeInOut", delay }
          : undefined
      }
    >
      {children}
    </motion.div>
  </motion.div>
);

// The artwork is already a lit circle, so it is not clipped again. A soft
// radial fade blends its own dark surround into the card instead.
const KaiAvatar = ({ size = 30 }: { size?: number }) => (
  <Image
    src={KAI_AVATAR}
    alt=""
    width={size * 2}
    height={size * 2}
    className="shrink-0 object-contain"
    style={{
      width: size,
      height: size,
      maskImage:
        "radial-gradient(circle at 50% 50%, #000 68%, rgba(0,0,0,0.6) 84%, transparent 97%)",
      WebkitMaskImage:
        "radial-gradient(circle at 50% 50%, #000 68%, rgba(0,0,0,0.6) 84%, transparent 97%)",
    }}
  />
);

/** Kai’s name in the active locale. */
const KaiLabel = () => <>{useJourney().kaiName}</>;

const KaiName = ({ size = 34 }: { size?: number }) => (
  <span className="flex items-center gap-2.5">
    <KaiAvatar size={size} />
    <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#F4C660]">
      <Sparkle size={13} weight="fill" aria-hidden="true" />
      <KaiLabel />
    </span>
  </span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold text-[#C8B6F0]/75">{children}</p>
);

type PhosphorIcon = React.ComponentType<{ size?: number; weight?: "bold" }>;

const Chip = ({
  label,
  icon: Icon,
  tone,
}: {
  label: string;
  icon?: PhosphorIcon;
  tone?: string;
}) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
    style={{
      borderColor: tone ? `${tone}55` : "rgba(255,255,255,0.18)",
      color: tone ?? "#C8B6F0",
      background: tone ? `${tone}18` : "rgba(255,255,255,0.05)",
    }}
  >
    {Icon ? <Icon size={12} weight="bold" /> : null}
    {label}
  </span>
);

/** Item glyph in a pale disc, so list rows read visually not just as text. */
const ItemIcon = ({
  icon: Icon,
  tone,
}: {
  icon: PhosphorIcon;
  tone?: string;
}) => (
  <span
    className="flex size-6 shrink-0 items-center justify-center rounded-full"
    style={{
      background: tone ? `${tone}26` : "rgba(255,255,255,0.09)",
      color: tone ?? "#C8B6F0",
    }}
    aria-hidden="true"
  >
    <Icon size={13} weight="bold" />
  </span>
);

const CompassDial = ({
  size = 96,
  tone = "#FF6F91",
  code = "PPL",
}: {
  size?: number;
  tone?: string;
  code?: string;
}) => (
  // Geometry mirrors components/results/CompassCard.tsx at its native 300
  // viewBox so the rose, rings and ticks match the shipped compass exactly.
  <svg width={size} height={size} viewBox="0 0 300 300" aria-hidden="true">
    <circle
      cx="150"
      cy="150"
      r="126"
      fill="none"
      stroke="rgba(255,255,255,.14)"
      strokeWidth="2"
    />
    <motion.circle
      cx="150"
      cy="150"
      r="117"
      fill="none"
      stroke={tone}
      strokeWidth="3"
      strokeDasharray="10 9"
      strokeLinecap="round"
      initial={{ opacity: 0, rotate: -24 }}
      animate={{ opacity: 0.85, rotate: 0 }}
      transition={{ duration: 1.1, ease: EASE }}
      style={{ transformBox: "view-box", transformOrigin: "150px 150px" }}
    />
    <circle
      cx="150"
      cy="150"
      r="108"
      fill="none"
      stroke="rgba(255,255,255,.07)"
      strokeWidth="2"
    />

    <g stroke="rgba(255,255,255,.28)" strokeWidth="2">
      <line x1="150" y1="18" x2="150" y2="30" />
      <line x1="150" y1="270" x2="150" y2="282" />
      <line x1="18" y1="150" x2="30" y2="150" />
      <line x1="270" y1="150" x2="282" y2="150" />
    </g>
    <g stroke="rgba(255,255,255,.12)" strokeWidth="2">
      <line x1="243" y1="57" x2="235" y2="65" />
      <line x1="57" y1="57" x2="65" y2="65" />
      <line x1="243" y1="243" x2="235" y2="235" />
      <line x1="57" y1="243" x2="65" y2="235" />
    </g>

    <motion.g
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
      style={{ transformBox: "view-box", transformOrigin: "150px 150px" }}
    >
      <path
        d="M150 62 L162 138 L150 150 L138 138 Z"
        fill="rgba(245,238,230,.82)"
      />
      <path
        d="M150 238 L162 162 L150 150 L138 162 Z"
        fill="rgba(245,238,230,.3)"
      />
      <path
        d="M62 150 L138 138 L150 150 L138 162 Z"
        fill="rgba(245,238,230,.3)"
      />
      <path
        d="M238 150 L162 162 L150 150 L162 138 Z"
        fill="rgba(245,238,230,.3)"
      />
    </motion.g>

    <circle
      cx="150"
      cy="150"
      r="46"
      fill="rgba(14,10,40,.55)"
      stroke="rgba(255,255,255,.3)"
      strokeWidth="2"
    />
    <text
      x="150"
      y="150"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="30"
      letterSpacing="4"
      fill="rgba(245,238,230,.66)"
    >
      {code}
    </text>
  </svg>
);

/** Kai says hello before the product story starts: the greeting arrives word
 *  by word as if she is speaking, then the four CORE dimensions she will
 *  explore with you settle in beside her. */
const IntroStage = () => {
  const journey = useJourney();
  const { role, greeting, exploreLabel, dimensions } = journey.intro;
  const words = greeting.split(" ");
  const wordStep = 0.045;
  const spokenBy = 0.45 + words.length * wordStep;

  return (
    <>
      <Card
        at="start-0 top-[12%]"
        width="w-[18rem]"
        drift={5}
        shape="pill"
        tone="warm"
      >
        <div className="flex items-center gap-3.5">
          <span className="relative shrink-0">
            <motion.span
              aria-hidden="true"
              className="absolute -inset-1.5 rounded-full"
              style={{
                background:
                  "conic-gradient(from 200deg, #F4C660, #F2A8B3, #9D7FF0, #F4C660)",
                filter: "blur(10px)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.55, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE }}
            />
            <span className="relative block size-[60px] overflow-hidden rounded-full bg-[#1B1433] ring-1 ring-[#F4C660]/50">
              <KaiAvatar size={60} />
            </span>
          </span>
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#F4C660]">
              <Sparkle size={13} weight="fill" aria-hidden="true" />
              <KaiLabel />
            </span>
            <p className="mt-0.5 text-[11.5px] text-[#C8B6F0]/80">{role}</p>
          </div>
        </div>

        <p className="mt-3.5 text-[15px] font-medium leading-[1.45] text-[#F5EEE6]">
          {words.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              className="inline-block"
              initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.35,
                delay: 0.45 + i * wordStep,
                ease: EASE,
              }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          ))}
        </p>
      </Card>

      <Card
        at="bottom-[10%] start-[8%]"
        width="w-[16rem]"
        delay={spokenBy}
        drift={4}
      >
        <Label>{exploreLabel}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {dimensions.map((dimension, i) => (
            <Chip key={dimension} label={dimension} tone={AXES[i]?.tone} />
          ))}
        </div>
      </Card>
    </>
  );
};

const AssessmentStage = () => {
  const journey = useJourney();
  const { progress, question, options, selected, kaiHint } = journey.assessment;
  return (
    <>
      <Card at="start-0 top-[6%]" width="w-[18rem]" drift={5}>
        <Label>{progress}</Label>
        <p className="mt-2 text-[14px] font-semibold leading-snug text-[#F5EEE6]">
          {question}
        </p>
        <ul className="mt-3 space-y-1.5">
          {options.map((option, index) => (
            <motion.li
              key={option.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.2 + index * 0.1,
                ease: EASE,
              }}
            >
              <motion.div
                className="flex items-center gap-2.5 rounded-[12px] border px-3 py-2 text-[12.5px]"
                initial={false}
                animate={
                  option.label === selected
                    ? {
                        borderColor: "rgba(244,198,96,0.75)",
                        backgroundColor: "rgba(244,198,96,0.12)",
                        color: "#F5EEE6",
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.12)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        color: "rgba(200,182,240,0.8)",
                      }
                }
                transition={{
                  duration: 0.4,
                  delay: option.label === selected ? 0.9 : 0,
                  ease: EASE,
                }}
              >
                <ItemIcon
                  icon={option.icon}
                  tone={option.label === selected ? "#F4C660" : undefined}
                />
                {option.label}
              </motion.div>
            </motion.li>
          ))}
        </ul>
      </Card>

      <Card
        at="bottom-[10%] start-[6%]"
        width="w-[18rem]"
        delay={1.2}
        drift={4}
        tone="warm"
        shape="pill"
      >
        <div className="flex items-center gap-3.5">
          <KaiAvatar size={54} />
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#F4C660]">
              <Sparkle size={13} weight="fill" aria-hidden="true" />
              <KaiLabel />
            </span>
            <p className="mt-1 text-[13px] leading-snug text-[#F5EEE6]">
              {kaiHint}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
};

const CompassStage = () => {
  const journey = useJourney();
  const { header, cluster, summary, chips, confidence, tone } = journey.result;
  return (
    <>
      <Card at="start-0 top-[10%]" width="w-[18rem]" drift={5}>
        <Label>{header}</Label>
        <div className="mt-2 flex items-center gap-3">
          <CompassDial size={84} />
          <div className="min-w-0">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
              className="font-heading text-[17px] font-bold leading-tight"
              style={{ color: tone }}
            >
              {cluster}
            </motion.p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#C8B6F0]">
              {summary}
            </p>
          </div>
        </div>
      </Card>

      <Card
        at="bottom-[16%] start-[8%]"
        width="w-[14rem]"
        delay={0.5}
        drift={4}
        tone="warm"
      >
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Chip key={chip.label} label={chip.label} icon={chip.icon} />
          ))}
        </div>
        <p className="mt-2.5 text-[11px] text-[#C8B6F0]/70">{confidence}</p>
      </Card>
    </>
  );
};

const PathsStage = () => {
  const journey = useJourney();
  return (
    <>
      <Card at="start-0 top-[4%]" width="w-[17rem]" drift={5}>
        <Label>{journey.labels.careers}</Label>
        <div className="mt-2 space-y-1">
          {journey.careers.map((career, index) => (
            <motion.div
              key={career.label}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.2 + index * 0.08,
                ease: EASE,
              }}
              className={
                index === 0
                  ? "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-[#F5EEE6]"
                  : "flex items-center gap-2.5 px-2 py-1.5 text-[12.5px] text-[#C8B6F0]"
              }
              style={
                index === 0
                  ? { background: `${journey.result.tone}26` }
                  : undefined
              }
            >
              <ItemIcon
                icon={career.icon}
                tone={index === 0 ? journey.result.tone : undefined}
              />
              {career.label}
            </motion.div>
          ))}
        </div>
      </Card>

      <Card
        at="start-[10%] top-[42%]"
        width="w-[14.5rem]"
        delay={0.35}
        drift={4}
        tone="warm"
      >
        <Label>{journey.labels.subjects}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {journey.subjects.map((subject) => (
            <Chip
              key={subject.label}
              label={subject.label}
              icon={subject.icon}
            />
          ))}
        </div>
      </Card>

      <Card
        at="bottom-[10%] start-[6%]"
        width="w-[13.5rem]"
        delay={0.6}
        drift={5}
      >
        <Label>{journey.labels.nextPaths}</Label>
        <div className="mt-1.5 space-y-0.5">
          {journey.nextPaths.map((path) => (
            <div
              key={path.label}
              className="flex items-center gap-2.5 py-0.5 text-[12px] text-[#C8B6F0]"
            >
              <ItemIcon icon={path.icon} />
              {path.label}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

const KaiStage = () => {
  const journey = useJourney();
  const [phase, setPhase] = useState<"asking" | "typing" | "answered">(
    "asking",
  );

  useEffect(() => {
    const toTyping = setTimeout(() => setPhase("typing"), 700);
    const toAnswer = setTimeout(() => setPhase("answered"), 1800);
    return () => {
      clearTimeout(toTyping);
      clearTimeout(toAnswer);
    };
  }, []);

  return (
    <>
      <Card at="start-0 top-[12%]" width="w-[18rem]" drift={5} shape="bubble">
        <KaiName />

        <p className="ms-auto mt-2.5 w-fit max-w-[90%] rounded-[14px] rounded-br-md border border-white/15 bg-white/[0.06] px-3 py-2 text-[12.5px] text-[#F5EEE6]">
          {journey.kai.question}
        </p>

        <div className="mt-2.5 min-h-[3.75rem]">
          {phase === "typing" ? (
            <span className="flex items-center gap-2" aria-hidden="true">
              <KaiAvatar size={24} />
              {[0, 150, 300].map((delay) => (
                <i
                  key={delay}
                  className="size-1.5 rounded-full bg-[#C8B6F0]/60"
                  style={{
                    animation: `kai-signal-breathe 1s ease-in-out ${delay}ms infinite`,
                  }}
                />
              ))}
            </span>
          ) : null}
          {phase === "answered" ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="flex items-end gap-2"
            >
              <KaiAvatar size={24} />
              <p className="rounded-[14px] rounded-bl-[5px] border border-[rgba(244,198,96,0.3)] bg-[rgba(244,198,96,0.09)] px-3 py-2 text-[12.5px] leading-relaxed text-[#F5EEE6]">
                {journey.kai.answer}
              </p>
            </motion.div>
          ) : null}
        </div>
      </Card>

      {phase === "answered" ? (
        <Card
          at="bottom-[14%] start-[8%]"
          width="w-[15rem]"
          drift={4}
          tone="warm"
        >
          <div className="flex flex-wrap gap-1.5">
            {journey.kai.chips.map((chip) => (
              <Chip key={chip.label} label={chip.label} icon={chip.icon} />
            ))}
          </div>
        </Card>
      ) : null}
    </>
  );
};

const JourneySummary = () => {
  const journey = useJourney();
  return (
    <Card at="start-0 top-1/2 lg:-translate-y-1/2" width="w-[18rem]" drift={4}>
      <ol className="space-y-2">
        {journey.summary.steps.map((step, index) => (
          <motion.li
            key={step.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.12, ease: EASE }}
            className="flex items-center gap-2.5"
          >
            <ItemIcon icon={step.icon} tone={AXES[index]?.tone ?? "#F4C660"} />
            <span className="text-[12.5px] font-semibold text-[#F5EEE6]">
              {step.label}
            </span>
          </motion.li>
        ))}
      </ol>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6, ease: EASE }}
        className="mt-3 border-t border-white/10 pt-2.5 text-[12px] text-[#C8B6F0]"
      >
        {journey.summary.line}
      </motion.p>
    </Card>
  );
};

const STAGE_VIEWS: Record<Stage, () => React.JSX.Element> = {
  intro: IntroStage,
  assessment: AssessmentStage,
  compass: CompassStage,
  paths: PathsStage,
  kai: KaiStage,
  summary: JourneySummary,
};

export function ProductJourney() {
  const reduce = useReducedMotion();
  const { locale } = useLocale();
  const copy = getJourneyCopy(locale);
  const [index, setIndex] = useState(0);
  const stage = STAGES[index];

  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(
      () => setIndex((current) => (current + 1) % STAGES.length),
      HOLD[stage],
    );
    return () => clearTimeout(id);
  }, [stage, reduce]);

  const Active = reduce ? JourneySummary : STAGE_VIEWS[stage];

  return (
    <div
      className="pointer-events-none relative flex w-full flex-col items-center gap-3 lg:block lg:h-full"
      role="img"
      aria-label={copy.aria}
    >
      <JourneyCopyContext.Provider value={copy}>
        <AnimatePresence mode="wait">
          <motion.div
            key={reduce ? "summary" : stage}
            className="contents lg:block lg:h-full"
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </JourneyCopyContext.Provider>
    </div>
  );
}
