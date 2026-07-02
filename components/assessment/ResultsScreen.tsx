"use client";

import {
  ChevronDown,
  Download,
  FileText,
  PlayCircle,
  RefreshCcw,
  Share2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
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
import { trackEvent } from "@/lib/analytics/track";
import { readLocalAssessment, resetLocalAssessment } from "@/lib/assessment/progress";
import {
  clearResultStorage,
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import type { ClusterCode } from "@/lib/scoring";

const CLUSTER_VISUALS: Record<
  ClusterCode,
  { color: string; label: string; tagline: string }
> = {
  TECH: {
    color: "#1E3A8A",
    label: "Technology",
    tagline: "Building systems. Solving problems. Creating tools.",
  },
  ENG: {
    color: "#475569",
    label: "Engineering",
    tagline: "Designing structures. Testing ideas. Making things work.",
  },
  SCI: {
    color: "#0E7A8C",
    label: "Science and Data",
    tagline: "Following evidence. Finding patterns. Explaining the unknown.",
  },
  ART: {
    color: "#7C3AED",
    label: "Arts and Media",
    tagline: "Shaping stories. Designing meaning. Moving people.",
  },
  BUS: {
    color: "#065F46",
    label: "Business",
    tagline: "Reading markets. Building value. Creating momentum.",
  },
  LAW: {
    color: "#1E40AF",
    label: "Law and Diplomacy",
    tagline: "Clarifying rules. Negotiating power. Protecting fairness.",
  },
  PPL: {
    color: "#F97316",
    label: "People and Psychology",
    tagline: "Understanding people. Building trust. Helping systems heal.",
  },
  ENV: {
    color: "#16A34A",
    label: "Environment",
    tagline: "Reading ecosystems. Protecting resources. Designing resilience.",
  },
};

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
    trackEvent("results_viewed", {
      assessmentId: readLocalAssessment()?.assessmentId,
    });
  }, [router]);

  function handleStartOver() {
    resetLocalAssessment();
    clearResultStorage();
    router.push("/start");
  }

  async function handleShare() {
    if (!report) return;

    const shareText = `My Tareeq answers point to high curiosity for ${report.clusterName}. Work style: ${report.archetype}. Motivation: ${report.primaryDriver}.`;
    const assessmentId = readLocalAssessment()?.assessmentId;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Tareeq Career Compass",
          text: shareText,
          url: window.location.href,
        });
        setShareStatus("Shared.");
        trackEvent("results_shared", { assessmentId, method: "native_share" });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setShareStatus("Summary copied.");
      trackEvent("results_shared", { assessmentId, method: "clipboard" });
    } catch {
      setShareStatus("Share cancelled.");
    }
  }

  function handleDownloadView() {
    trackEvent("results_downloaded", {
      assessmentId: readLocalAssessment()?.assessmentId,
      method: "print",
    });
    window.print();
  }

  if (!report) return null;

  const rankedClusters = report.score.clusterRanked;
  const maxClusterScore = Math.max(1, rankedClusters[0]?.[1] ?? 1);
  const clusterVisual = CLUSTER_VISUALS[report.clusterCode];
  const videoSuggestions = buildVideoSuggestions(report);

  return (
    <section
      className="anim-screen-enter flex flex-1 flex-col gap-4 pb-2"
      style={
        {
          "--result-accent": clusterVisual.color,
        } as CSSProperties
      }
    >
      <header className="result-hero relative overflow-hidden rounded-[30px] border border-sand/12 bg-sand/[0.055] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="result-hero-grid absolute inset-0 opacity-70" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <span className="chip chip--violet-on-dark">
            <Sparkles size={13} />
            Curiosity Compass
          </span>
          <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
            CORE v4
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
              Curiosity signal
            </p>
            <h1 className="text-[42px] font-black uppercase leading-[0.9] text-white">
              {clusterVisual.label}
            </h1>
            <p className="max-w-[30ch] text-[14px] font-semibold leading-snug text-white/74">
              Your answers point to a high curiosity for this territory. Use it
              as a direction to explore, not a final prescription.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
          <StatPill
            label="Signal"
            value="High curiosity"
            meta={clusterVisual.label}
          />
          <StatPill
            label="Confidence"
            value={`${report.score.confidencePercentage}%`}
            meta={report.score.confidenceLabel}
          />
          <StatPill label="Style" value={report.archetype} meta="Work mode" />
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
          accent="warm"
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
          accent="warm"
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
              <ConstellationIcon size={22} />
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

        <div className="grid gap-3">
          {rankedClusters.map(([code, score], index) => (
            <div key={code} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[12px] font-bold text-sand">
                  <span
                    className="grid size-6 place-items-center rounded-full text-[10px] text-white"
                    style={{
                      background:
                        index === 0
                          ? clusterVisual.color
                          : "rgba(245, 238, 230, 0.1)",
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
                    background:
                      index === 0
                        ? clusterVisual.color
                        : "rgba(245, 238, 230, 0.32)",
                    width: `${Math.max(8, (score / maxClusterScore) * 100)}%`,
                  }}
                />
              </span>
            </div>
          ))}
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
        accent={clusterVisual.color}
        icon={<CareerIcon size={20} />}
        title="Why these career families fit"
      >
        <p>{report.careerLandscape}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<UniversityIcon size={20} />}
        title="How the study path connects"
      >
        <p>{report.academicPath}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<Sparkles size={20} />}
        title="Less obvious paths"
      >
        <TagList
          title="These intersections can be surprisingly strong"
          items={report.nonObviousPaths}
        />
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<RealityIcon size={20} />}
        title="Reality Check"
      >
        <p>{report.realityCheck}</p>
        <VideoSuggestionList suggestions={videoSuggestions} />
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<CompassResultIcon size={20} />}
        title="How your work style changes the path"
      >
        <p>{report.integration}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<NextStepsIcon size={20} />}
        title="Next Steps"
      >
        <p>{report.nextSteps}</p>
      </ReportSection>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="btn-v2 btn-v2--primary w-full"
          data-size="lg"
        >
          <Share2 size={18} />
          Share result
        </button>
        <a
          href="/profile"
          className="btn-v2 btn-v2--ghost-on-dark w-full"
          data-size="md"
        >
          <Sparkles size={16} />
          View your profile
        </a>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadView}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            <Download size={16} />
            Save
          </button>
          <button
            type="button"
            onClick={handleDownloadView}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            <FileText size={16} />
            Parent view
          </button>
        </div>
        <button
          type="button"
          onClick={handleStartOver}
          className="btn-v2 btn-v2--ghost-on-dark w-full"
          data-size="md"
        >
          <RefreshCcw size={16} />
          Start over
        </button>
        {shareStatus ? (
          <p className="text-center text-[11px] font-semibold text-sand/55">
            {shareStatus}
          </p>
        ) : null}
      </div>

      <p className="text-center text-[11px] leading-snug text-sand/38">
        {report.source === "claude"
          ? `Generated with ${report.model ?? "Claude"} using Tareeq’s scoring framework.`
          : `Built from Tareeq’s scoring framework. ${report.fallbackReason ?? ""}`}
      </p>
    </section>
  );
}

function ResultCompass({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 220"
      className="result-compass-spin absolute inset-0 h-full w-full"
    >
      <circle
        cx="110"
        cy="110"
        r="96"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeDasharray="2 10"
        strokeWidth="1.5"
      />
      <circle
        cx="110"
        cy="110"
        r="72"
        fill="none"
        stroke={color}
        strokeDasharray="18 10"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M110 24 L124 96 L196 110 L124 124 L110 196 L96 124 L24 110 L96 96 Z"
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="1.5"
      />
      <circle cx="110" cy="110" r="42" fill="rgba(8,5,26,0.74)" />
    </svg>
  );
}

function StatPill({
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
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/42">
        {label}
      </p>
      <p className="mt-1 min-h-[32px] text-[13px] font-black leading-none text-white">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-white/42">{meta}</p>
    </div>
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
        <span className="grid size-8 place-items-center rounded-full bg-sand/[0.09]">
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
