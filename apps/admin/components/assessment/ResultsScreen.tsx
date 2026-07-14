"use client";

import { ArrowRight, ChevronDown, PlayCircle, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import {
  AcademicIcon,
  ArchetypeIcon,
  AxisIcon,
  CareerIcon,
  CompassResultIcon,
  ConstellationIcon,
  DriverIcon,
  EcosystemIcon,
  FingerprintIcon,
  NextStepsIcon,
  PathForwardIcon,
  RealityIcon,
  StrengthIcon,
  UniversityIcon,
} from "@/components/brand/ResultIcons";
import { resetLocalAssessment } from "@/lib/assessment/progress";
import { CLUSTER_VISUALS, rgbaFromHex } from "@/lib/results/cluster-visuals";
import {
  clearResultStorage,
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/** Semantic functional lanes — color carries meaning across sections:
 *  insight = understand yourself, action = do this, caution = be honest. */
const LANES = {
  insight: { color: "#9D7FF0", tint: "rgba(157,127,240,0.16)", ring: "rgba(157,127,240,0.32)" },
  action: { color: "#6FE0C0", tint: "rgba(111,224,192,0.16)", ring: "rgba(111,224,192,0.32)" },
  caution: { color: "#F4C660", tint: "rgba(244,198,96,0.18)", ring: "rgba(244,198,96,0.34)" },
} as const;

type Lane = keyof typeof LANES;

/** Alpha ramp for the score map — paints each bar in its own cluster hue,
 *  stepped down by rank so the ordering reads pre-attentively. */
const RANK_ALPHA = [1, 0.8, 0.64, 0.5, 0.4, 0.32, 0.26, 0.22];

export function ResultsScreen() {
  const router = useRouter();
  const [report, setReport] = useState<PersonalizedCompassReport | null>(null);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    const registration = readResultRegistration();
    const storedReport = readGeneratedReport();

    if (!registration) {
      router.replace("/register");
      return;
    }

    if (!storedReport) {
      router.replace("/analyzing");
      return;
    }

    setReport(storedReport);
  }, [router]);

  function handleStartOver() {
    resetLocalAssessment();
    clearResultStorage();
    router.push("/start");
  }

  async function handleShare() {
    if (!report) return;

    const shareText = `My Tareeq answers point to high curiosity for ${report.clusterName}. Work style: ${report.archetype}. Motivation: ${report.primaryDriver}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Tareeq Career Compass",
          text: shareText,
          url: window.location.href,
        });
        setShareStatus("Shared.");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setShareStatus("Summary copied.");
    } catch {
      setShareStatus("Share cancelled.");
    }
  }

  function handleDownloadView() {
    window.print();
  }

  if (!report) return null;

  const rankedClusters = report.score.clusterRanked;
  const maxClusterScore = Math.max(1, rankedClusters[0]?.[1] ?? 1);
  const clusterVisual = CLUSTER_VISUALS[report.clusterCode];
  const videoSuggestions = buildVideoSuggestions(report);
  const axisProfile = getAxisProfile(report.score);
  const confidence = report.score.confidencePercentage;
  const gap = (rankedClusters[0]?.[1] ?? 0) - (rankedClusters[1]?.[1] ?? 0);
  const closeRace = report.isMultiCurious || gap <= 1;

  return (
    <section
      className="anim-screen-enter flex flex-1 flex-col gap-4 pb-2"
      style={
        {
          "--result-accent": clusterVisual.color,
          "--result-accent-soft": clusterVisual.glow,
        } as CSSProperties
      }
    >
      <header className="result-hero relative overflow-hidden rounded-[30px] border border-sand/12 bg-sand/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="result-hero-grid absolute inset-0 opacity-55" />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${clusterVisual.glow}, transparent 70%)`,
          }}
        />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <span className="chip chip--violet-on-dark">
            <FingerprintIcon size={14} />
            Your CORE fingerprint
          </span>
          <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
            CORE v4
          </span>
        </div>

        <div className="relative z-10 mt-4 grid place-items-center">
          <div className="relative grid h-[190px] w-[190px] place-items-center">
            <CoreFingerprint
              axes={axisProfile}
              confidence={confidence}
              color={clusterVisual.color}
            />
            <span className="grid size-[62px] place-items-center rounded-full border border-white/14 bg-night/85 text-center shadow-[0_14px_34px_rgba(0,0,0,0.4)]">
              <span
                className="text-[12px] font-black uppercase tracking-[0.14em]"
                style={{ color: clusterVisual.color }}
              >
                {report.clusterCode}
              </span>
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-3 grid gap-1.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            Your strongest signal
          </p>
          <h1 className="text-[34px] font-black uppercase leading-[0.95] text-white">
            {clusterVisual.label}
          </h1>
          <p className="mx-auto max-w-[34ch] text-[13.5px] font-medium leading-snug text-white/72">
            {closeRace
              ? `A close race — ${clusterVisual.label} leads, but your top few are worth exploring. A direction to test, not a verdict.`
              : `A clear lead toward ${clusterVisual.label}. A direction to explore, not a box to live in.`}
          </p>
          <span className="mx-auto mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[11px] font-bold text-white/80">
            <span
              className="size-1.5 rounded-full"
              style={{ background: clusterVisual.color }}
            />
            {report.score.confidenceLabel} signal · {confidence}%
          </span>
        </div>
      </header>

      <section className="rounded-[24px] border border-sand/10 bg-sand/[0.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
          Kai’s read
        </p>
        <h2 className="mt-2 text-[22px] font-black leading-[1.05] text-sand">
          A direction to test, not a box to live inside.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-sand/72">
          {report.summary}
        </p>
      </section>

      {/* How you're wired — surfaces the four work-style axes */}
      <AxisSliders axes={axisProfile} accent={clusterVisual.color} />

      <section className="grid gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
            Tap each box
          </p>
          <h2 className="mt-1 text-[20px] font-black text-sand">
            What the four CORE signals mean
          </h2>
        </div>
        <CoreSignalCard
          letter="C"
          icon={<CompassResultIcon size={20} />}
          label="Curiosities"
          value={clusterVisual.label}
          customColor={clusterVisual.color}
        >
          This is what keeps pulling your attention. It is why the compass
          starts with {clusterVisual.label}, while the full score map below
          still shows every cluster signal.
        </CoreSignalCard>
        <CoreSignalCard
          letter="O"
          icon={<ArchetypeIcon size={20} />}
          label="Operations"
          value={report.archetype}
          accent="violet"
        >
          This describes how you tend to approach work: the pace, structure, and
          problem-solving rhythm that may make a path feel natural day to day.
        </CoreSignalCard>
        <CoreSignalCard
          letter="R"
          icon={<DriverIcon size={20} />}
          label="Rewards"
          value={report.primaryDriver}
          customColor="#F4C660"
        >
          This is what makes a path worth staying with. Use it to judge whether
          a career only looks interesting, or actually gives you the reward you
          need to keep going.
        </CoreSignalCard>
        <CoreSignalCard
          letter="E"
          icon={<EcosystemIcon size={20} />}
          label="Ecosystems"
          value={report.ecosystemFit}
          accent="mint"
        >
          This is the working environment signal: team shape, independence,
          predictability, and energy level. It helps you compare schools,
          internships, and first jobs.
        </CoreSignalCard>
      </section>

      <section className="rounded-[24px] border border-sand/10 bg-night/35 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand/[0.08]">
              <StrengthIcon size={22} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
                Cluster score map
              </p>
              <h2 className="mt-1 text-[18px] font-black text-sand">
                All 8 curiosity signals
              </h2>
            </div>
          </div>
          <span className="rounded-full border border-sand/10 px-3 py-1 text-[11px] font-bold text-sand/58">
            Scores
          </span>
        </div>

        <p className="mb-3 text-[12.5px] leading-snug text-sand/66">
          {closeRace
            ? `${clusterVisual.label} leads, but it's a close race — your top signals are worth exploring together.`
            : `${clusterVisual.label} stands clearly ahead. The rest are still part of your map.`}
        </p>

        <div className="grid gap-3">
          {rankedClusters.map(([code, score], index) => {
            const hue = CLUSTER_VISUALS[code].color;
            const alpha = RANK_ALPHA[index] ?? 0.22;
            return (
              <div key={code} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[12px] font-bold text-sand">
                    <span
                      className="grid size-6 place-items-center rounded-full text-[10px] font-black"
                      style={{
                        background: rgbaFromHex(hue, index === 0 ? 1 : 0.22),
                        color: index === 0 ? "#08051A" : "#F5EEE6",
                      }}
                    >
                      {index + 1}
                    </span>
                    {CLUSTER_VISUALS[code].label}
                  </span>
                  <span className="tabular-nums text-[12px] font-bold text-sand/62">
                    {score}
                  </span>
                </div>
                <span className="h-2 overflow-hidden rounded-full bg-sand/9">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      background: rgbaFromHex(hue, alpha),
                      width: `${Math.max(8, (score / maxClusterScore) * 100)}%`,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>

        {report.isMultiCurious ? (
          <p className="mt-4 rounded-[18px] border border-gold/25 bg-gold/10 px-3 py-2 text-[12px] leading-snug text-sand/78">
            Multi-curious signal: {report.multiCuriousClusters.join(", ")}.
            Explore intersections before narrowing too early.
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
                Career direction
              </p>
              <h2 className="mt-1 text-[20px] font-black text-sand">
                Your profile may thrive in career families like…
              </h2>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {report.careerExamples.slice(0, 6).map((career, index) => (
            <CareerFamilyCard
              key={career}
              career={career}
              index={index}
              accent={clusterVisual.color}
            />
          ))}
        </div>

        <PathPanel
          icon={<UniversityIcon size={20} />}
          title="Based on that, university majors to explore"
          items={report.universityMajors}
        />

        <section className="rounded-[22px] border border-sand/10 bg-sand/[0.055] p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-gold/12 text-gold">
              <AcademicIcon size={20} />
            </span>
            <h3 className="text-[14px] font-black text-sand">
              Then choose high-school subjects that keep those doors open
            </h3>
          </div>
          <div className="grid gap-2">
            {report.highSchoolSubjects.slice(0, 6).map((subject, index) => (
              <SubjectReasonCard
                key={subject}
                subject={subject}
                index={index}
                clusterName={clusterVisual.label}
              />
            ))}
          </div>
        </section>
      </section>

      <ReportSection
        fn="insight"
        icon={<CareerIcon size={20} />}
        title="Why these career families fit"
      >
        <p>{report.careerLandscape}</p>
      </ReportSection>

      <ReportSection
        fn="action"
        icon={<UniversityIcon size={20} />}
        title="How the study path connects"
      >
        <p>{report.academicPath}</p>
      </ReportSection>

      <ReportSection
        fn="insight"
        icon={<ConstellationIcon size={20} />}
        title="Less obvious paths"
      >
        <TagList
          title="These intersections can be surprisingly strong"
          items={report.nonObviousPaths}
        />
      </ReportSection>

      <ReportSection
        fn="insight"
        icon={<CompassResultIcon size={20} />}
        title="How your work style changes the path"
      >
        <p>{report.integration}</p>
      </ReportSection>

      <ReportSection
        fn="caution"
        icon={<RealityIcon size={20} />}
        title="Reality Check"
      >
        <p>{report.realityCheck}</p>
        <VideoSuggestionList suggestions={videoSuggestions} />
      </ReportSection>

      <ReportSection
        fn="action"
        icon={<NextStepsIcon size={20} />}
        title="Next Steps"
      >
        <p>{report.nextSteps}</p>
      </ReportSection>

      <div className="grid gap-3 pt-1">
        {/* One clear forward action → the future app home/dashboard */}
        <a
          href="/home"
          className="btn-v2 btn-v2--primary w-full"
          data-size="lg"
          style={{ boxShadow: `0 16px 44px ${clusterVisual.glow}` }}
        >
          Continue to your home
          <ArrowRight size={18} />
        </a>
        <p className="text-center text-[11.5px] text-sand/55">
          Your compass is saved. Pick up exploring any time.
        </p>

        <button
          type="button"
          onClick={handleShare}
          className="btn-v2 btn-v2--ghost-on-dark mx-auto w-full max-w-[280px]"
          data-size="md"
        >
          <Share2 size={16} />
          Share your result
        </button>
        {shareStatus ? (
          <p className="text-center text-[11px] font-semibold text-sand/55">
            {shareStatus}
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-center gap-4 text-[11px] font-semibold text-sand/40">
          <button
            type="button"
            onClick={handleDownloadView}
            className="transition hover:text-sand/70"
          >
            Save or print
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={handleStartOver}
            className="transition hover:text-sand/70"
          >
            Retake the assessment
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] leading-snug text-sand/38">
        {report.source === "claude"
          ? `Generated with ${report.model ?? "Claude"} using Tareeq’s scoring framework.`
          : `Built from Tareeq’s scoring framework. ${report.fallbackReason ?? ""}`}
      </p>
    </section>
  );
}

type AxisInfo = {
  key: string;
  left: string;
  right: string;
  /** 0..1 toward the right pole. */
  pos: number;
  read: string;
};

/** Derive the four work-style axes from the score (the engine computes
 *  these but the old UI never surfaced them). */
function getAxisProfile(score: PersonalizedCompassReport["score"]): AxisInfo[] {
  const a = score.axes;
  const socTotal = a.social.collaborative + a.social.independent || 1;
  const envTotal = a.environment.dynamic + a.environment.predictable || 1;
  const procRight = a.processing === "FLEX";
  const scopeRight = a.scope === "BROAD";
  const socialPos = a.social.independent / socTotal;
  const envPos = a.environment.predictable / envTotal;
  return [
    {
      key: "Processing",
      left: "Structured",
      right: "Flexible",
      pos: procRight ? 0.78 : 0.22,
      read: procRight
        ? "You improvise and adapt as you go."
        : "You like a clear plan and steady structure.",
    },
    {
      key: "Scope",
      left: "Deep",
      right: "Broad",
      pos: scopeRight ? 0.78 : 0.22,
      read: scopeRight
        ? "You enjoy sampling widely and connecting fields."
        : "You'd rather go far in one thing than sample many.",
    },
    {
      key: "Social",
      left: "Collaborative",
      right: "Independent",
      pos: socialPos,
      read:
        socialPos >= 0.5
          ? "You do your best work with room to run solo."
          : "You're energized working closely with other people.",
    },
    {
      key: "Environment",
      left: "Dynamic",
      right: "Predictable",
      pos: envPos,
      read:
        envPos >= 0.5
          ? "You prefer steady, predictable rhythms."
          : "You thrive when things keep moving and changing.",
    },
  ];
}

/** CORE Fingerprint — the hero crest. Four spokes (N/E/S/W) whose lengths
 *  encode the axis positions; the outer ring sweep encodes confidence. */
function CoreFingerprint({
  axes,
  confidence,
  color,
}: {
  axes: AxisInfo[];
  confidence: number;
  color: string;
}) {
  const cx = 100;
  const cy = 100;
  const innerR = 36;
  const maxR = 80;
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];
  const tips = axes.slice(0, 4).map((a, i) => {
    const r = innerR + (maxR - innerR) * a.pos;
    return { x: cx + dirs[i].dx * r, y: cy + dirs[i].dy * r };
  });
  const ringR = 90;
  const circ = 2 * Math.PI * ringR;
  const dash = Math.max(0, Math.min(1, confidence / 100)) * circ;
  const kite =
    tips.length === 4
      ? `M ${tips[0].x} ${tips[0].y} L ${tips[1].x} ${tips[1].y} L ${tips[2].x} ${tips[2].y} L ${tips[3].x} ${tips[3].y} Z`
      : "";

  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full"
    >
      {/* Decorative tick ring — slow drift (disabled under reduced-motion) */}
      <circle
        cx={cx}
        cy={cy}
        r="95"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1"
        strokeDasharray="2 9"
        className="result-compass-spin"
      />
      {/* Confidence ring — track + colored sweep */}
      <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
      <circle
        cx={cx}
        cy={cy}
        r={ringR}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Fingerprint crest — the four tips connected */}
      {kite ? (
        <path d={kite} fill={rgbaFromHex(color, 0.14)} stroke={rgbaFromHex(color, 0.5)} strokeWidth="1.4" strokeLinejoin="round" />
      ) : null}
      {/* Spokes + tips */}
      {tips.map((t, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={t.x} y2={t.y} stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <circle cx={t.x} cy={t.y} r="3.4" fill={color} />
        </g>
      ))}
    </svg>
  );
}

/** How you're wired — four work-style sliders. */
function AxisSliders({ axes, accent }: { axes: AxisInfo[]; accent: string }) {
  return (
    <section className="rounded-[24px] border border-sand/10 bg-sand/[0.052] p-4">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="grid size-8 place-items-center rounded-full"
          style={{
            background: LANES.insight.tint,
            boxShadow: `inset 0 0 0 1px ${LANES.insight.ring}`,
          }}
        >
          <AxisIcon size={20} accent={accent} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
            How you&apos;re wired
          </p>
          <h2 className="text-[16px] font-bold text-sand">
            Your work-style profile
          </h2>
        </div>
      </div>
      <div className="grid gap-4">
        {axes.map((a) => {
          const left = Math.min(94, Math.max(6, a.pos * 100));
          return (
            <div key={a.key} className="grid gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.07em]">
                <span style={{ color: a.pos < 0.5 ? "#F5EEE6" : "rgba(245,238,230,0.4)" }}>
                  {a.left}
                </span>
                <span style={{ color: a.pos >= 0.5 ? "#F5EEE6" : "rgba(245,238,230,0.4)" }}>
                  {a.right}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-sand/10">
                <span
                  className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-night"
                  style={{
                    left: `${left}%`,
                    background: accent,
                    boxShadow: `0 0 0 4px ${rgbaFromHex(accent, 0.18)}`,
                  }}
                />
              </div>
              <p className="text-[12px] leading-snug text-sand/64">{a.read}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type TileAccent = "warm" | "violet" | "mint";

function getTileTone(accent: TileAccent) {
  return {
    warm: {
      background:
        "linear-gradient(135deg, rgba(255,107,61,0.22), rgba(255,165,61,0.10))",
      ring: "rgba(255,107,61,0.32)",
    },
    violet: {
      background:
        "linear-gradient(135deg, rgba(157,127,240,0.22), rgba(110,72,228,0.10))",
      ring: "rgba(157,127,240,0.36)",
    },
    mint: {
      background:
        "linear-gradient(135deg, rgba(111,224,192,0.22), rgba(111,224,192,0.06))",
      ring: "rgba(111,224,192,0.34)",
    },
  }[accent];
}

function CoreSignalCard({
  letter,
  icon,
  label,
  value,
  accent = "warm",
  customColor,
  children,
}: {
  letter: string;
  icon: ReactNode;
  label: string;
  value: string;
  accent?: TileAccent;
  /** Overrides the preset tone — used to wear the cluster house color. */
  customColor?: string;
  children: ReactNode;
}) {
  const tone = customColor
    ? {
        background: `linear-gradient(135deg, ${rgbaFromHex(customColor, 0.26)}, ${rgbaFromHex(customColor, 0.08)})`,
        ring: rgbaFromHex(customColor, 0.42),
      }
    : getTileTone(accent);

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
        <ChevronDown
          size={16}
          className="shrink-0 text-sand/45 transition group-open:rotate-180"
        />
      </summary>
      <p className="mt-3 border-t border-sand/10 pt-3 text-[12.5px] leading-relaxed text-sand/68">
        {children}
      </p>
    </details>
  );
}

function CareerFamilyCard({
  career,
  index,
  accent,
}: {
  career: string;
  index: number;
  accent: string;
}) {
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
          <h3 className="text-[14px] font-black leading-tight text-sand">
            {career}
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-sand/60">
            Explore what the work looks like before choosing the subject path.
          </p>
          <a
            href={youtubeSearchUrl(`day in the life of ${career}`)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold"
          >
            <PlayCircle size={13} />
            Day in the life
          </a>
        </div>
      </div>
    </div>
  );
}

function SubjectReasonCard({
  subject,
  index,
  clusterName,
}: {
  subject: string;
  index: number;
  clusterName: string;
}) {
  const priority = index < 2 ? "Core" : index < 4 ? "Strong" : "Useful";

  return (
    <details className="group rounded-[18px] border border-sand/10 bg-night/35 px-3 py-2.5 open:bg-night/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span className="rounded-full bg-gold/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gold">
          {priority}
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-black text-sand">
          {subject}
        </span>
        <ChevronDown
          size={15}
          className="shrink-0 text-sand/42 transition group-open:rotate-180"
        />
      </summary>
      <p className="mt-2 text-[12px] leading-relaxed text-sand/64">
        {getSubjectReason(subject, clusterName)}
      </p>
    </details>
  );
}

function VideoSuggestionList({
  suggestions,
}: {
  suggestions: Array<{ label: string; query: string }>;
}) {
  return (
    <div className="grid gap-2 rounded-[18px] border border-sand/10 bg-night/35 p-3">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-sand/42">
        <PlayCircle size={13} />
        Watch before choosing
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

function PathPanel({
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
        <h3 className="text-[14px] font-black text-sand">{title}</h3>
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

function ReportSection({
  fn,
  icon,
  title,
  children,
}: {
  /** Semantic lane — color-codes the section by meaning. */
  fn: Lane;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const lane = LANES[fn];
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-sand/10 bg-sand/[0.052] p-4 shadow-[0_12px_34px_rgba(0,0,0,0.18)]">
      <span
        aria-hidden
        className="absolute inset-y-4 left-0 w-1 rounded-r-full"
        style={{ background: lane.color }}
      />
      <div className="mb-3 flex items-center gap-2">
        <span
          className="grid size-8 place-items-center rounded-full"
          style={{ background: lane.tint, boxShadow: `inset 0 0 0 1px ${lane.ring}` }}
        >
          {icon}
        </span>
        <h2 className="text-[16px] font-bold text-sand">{title}</h2>
      </div>
      <div className="grid gap-3 text-[13.5px] leading-relaxed text-sand/73">
        {children}
      </div>
    </section>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-sand/42">
        {title}
      </p>
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

function buildVideoSuggestions(report: PersonalizedCompassReport) {
  const candidates = [
    ...report.careerExamples.slice(0, 2).map((career) => ({
      label: `Day in the life: ${career}`,
      query: `day in the life of ${career}`,
    })),
    report.universityMajors[0]
      ? {
          label: `What studying ${report.universityMajors[0]} is like`,
          query: `what is it like studying ${report.universityMajors[0]}`,
        }
      : null,
    report.nonObviousPaths[0]
      ? {
          label: `Less obvious path: ${report.nonObviousPaths[0]}`,
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

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query,
  )}`;
}

function getSubjectReason(subject: string, clusterName: string) {
  const normalized = subject.toLowerCase();

  if (/(computer|it|coding|technology|data|statistics)/.test(normalized)) {
    return `This gives you practical tools to test ${clusterName} ideas, build small projects, and understand the digital systems behind many modern careers.`;
  }

  if (/(math|mathematics|further maths)/.test(normalized)) {
    return `This builds the quantitative fluency many ${clusterName} routes depend on, especially when choices later involve data, modelling, finance, engineering, or research.`;
  }

  if (/(physics|chemistry|biology|environmental|geography|science)/.test(
    normalized,
  )) {
    return `This keeps the evidence-based side of ${clusterName} open, especially for careers that need experiments, fieldwork, systems thinking, or technical credibility.`;
  }

  if (/(english|literature|history|government|politics|language|philosophy)/.test(
    normalized,
  )) {
    return `This strengthens communication, argument, and interpretation: skills that help you explain ${clusterName} ideas clearly to people who do not think like you.`;
  }

  if (/(art|design|media|film|drama|music|visual)/.test(normalized)) {
    return `This helps you build a portfolio and communicate ideas visually, which can turn ${clusterName} curiosity into work people can actually see and respond to.`;
  }

  if (/(business|economics|accounting)/.test(normalized)) {
    return `This helps you understand money, markets, and organisations, so ${clusterName} interests can become practical opportunities rather than only ideas.`;
  }

  return `This subject can support ${clusterName} by giving you vocabulary, practice, and proof that you are serious enough to test the path properly.`;
}
