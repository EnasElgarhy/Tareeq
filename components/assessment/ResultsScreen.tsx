"use client";

import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  Compass,
  Download,
  FileText,
  Footprints,
  GraduationCap,
  Map,
  RefreshCcw,
  Route,
  Share2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { resetLocalAssessment } from "@/lib/assessment/progress";
import {
  clearResultStorage,
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import type { ClusterCode } from "@/lib/scoring";

const iconClass = "size-4";

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
  }, [router]);

  function handleStartOver() {
    resetLocalAssessment();
    clearResultStorage();
    router.push("/start");
  }

  async function handleShare() {
    if (!report) return;

    const shareText = `My Tareeq Compass points toward ${report.clusterName}. Work style: ${report.archetype}. Motivation: ${report.primaryDriver}.`;

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

  const rankedClusters = report.score.clusterRanked.slice(0, 4);
  const maxClusterScore = Math.max(1, rankedClusters[0]?.[1] ?? 1);
  const clusterVisual = CLUSTER_VISUALS[report.clusterCode];

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
            Career Compass
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
              Primary direction
            </p>
            <h1 className="text-[42px] font-black uppercase leading-[0.9] text-white">
              {clusterVisual.label}
            </h1>
            <p className="max-w-[30ch] text-[14px] font-semibold leading-snug text-white/74">
              {clusterVisual.tagline}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
          <StatPill
            label="Confidence"
            value={`${report.score.confidencePercentage}%`}
            meta={report.score.confidenceLabel}
          />
          <StatPill label="Style" value={report.archetype} meta="Work mode" />
          <StatPill label="Drive" value={report.primaryDriver} meta="Reward" />
        </div>
      </header>

      <section className="rounded-[24px] border border-sand/10 bg-sand/[0.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
          Kai’s read
        </p>
        <h2 className="mt-2 text-[22px] font-black leading-[1.05] text-sand">
          {report.headline}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-sand/72">
          {report.summary}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-2">
        <WorkTile
          icon={<Compass className={iconClass} />}
          label="How you work"
          value={report.archetype}
        />
        <WorkTile
          icon={<Target className={iconClass} />}
          label="What pulls you forward"
          value={report.primaryDriver}
        />
        <WorkTile
          icon={<Users className={iconClass} />}
          label="Where you thrive"
          value={report.ecosystemFit}
        />
      </section>

      <section className="rounded-[24px] border border-sand/10 bg-night/35 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
              Cluster signal
            </p>
            <h2 className="mt-1 text-[18px] font-black text-sand">
              Your top directions
            </h2>
          </div>
          <span className="rounded-full border border-sand/10 px-3 py-1 text-[11px] font-bold text-sand/58">
            Final score
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
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sand/42">
              Path forward
            </p>
            <h2 className="mt-1 text-[20px] font-black text-sand">
              What to explore next
            </h2>
          </div>
          <Route size={22} className="text-gold" />
        </div>

        <PathPanel
          icon={<GraduationCap className={iconClass} />}
          title="School focus"
          items={report.highSchoolSubjects}
        />
        <PathPanel
          icon={<BookOpen className={iconClass} />}
          title="University paths"
          items={report.universityMajors}
        />
        <PathPanel
          icon={<Map className={iconClass} />}
          title="Career examples"
          items={report.careerExamples}
        />
      </section>

      <ReportSection
        accent={clusterVisual.color}
        icon={<GraduationCap className={iconClass} />}
        title="Academic Path"
      >
        <p>{report.academicPath}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<BriefcaseBusiness className={iconClass} />}
        title="Career Landscape"
      >
        <p>{report.careerLandscape}</p>
        <TagList title="Less obvious paths" items={report.nonObviousPaths} />
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<Compass className={iconClass} />}
        title="How You Work"
      >
        <p>{report.integration}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<AlertTriangle className={iconClass} />}
        title="Reality Check"
      >
        <p>{report.realityCheck}</p>
      </ReportSection>

      <ReportSection
        accent={clusterVisual.color}
        icon={<Footprints className={iconClass} />}
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

function WorkTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-sand/10 bg-sand/[0.055] p-3">
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full text-gold"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--result-accent) 24%, transparent)",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-sand/42">
          {label}
        </p>
        <p className="mt-0.5 text-[15px] font-black leading-tight text-sand">
          {value}
        </p>
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
