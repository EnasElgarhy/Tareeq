"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { readLocalAssessment } from "@/lib/assessment/progress";
import { buildFallbackReport } from "@/lib/results/framework";
import {
  readGeneratedReport,
  readResultRegistration,
  writeGeneratedReport,
} from "@/lib/results/storage";

type AnalysisStatus = "working" | "done" | "error";

const ANALYSIS_STEPS = [
  {
    title: "Reading answer patterns",
    detail: "Listening to the rhythm of your choices.",
    glyph: "📡",
  },
  {
    title: "Balancing the four pillars",
    detail: "Curiosities, Operations, Rewards, Ecosystems.",
    glyph: "🧭",
  },
  {
    title: "Mapping your compass",
    detail: "Pulling the lines that point your direction.",
    glyph: "🪡",
  },
  {
    title: "Writing Kai’s guidance",
    detail: "Translating the score into a path you can walk.",
    glyph: "✍️",
  },
] as const;

// Four CORE pillars orbit Kai while the analysis runs. Each token has
// a delay so they cascade in instead of appearing at once. Positions
// are radial offsets around the center.
const ORBIT_TOKENS = [
  { letter: "C", label: "Curiosities", angle: -90, color: "#FF6B3D", delay: 0 },
  { letter: "O", label: "Operations",  angle:   0, color: "#FFA53D", delay: 0.15 },
  { letter: "R", label: "Rewards",     angle:  90, color: "#FF3D83", delay: 0.3 },
  { letter: "E", label: "Ecosystems",  angle: 180, color: "#9D7FF0", delay: 0.45 },
] as const;

export function AnalyzingScreen() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>("working");

  useEffect(() => {
    const progress = readLocalAssessment();
    const registration = readResultRegistration();
    const existingReport = readGeneratedReport();

    if (!progress?.completedAt || !progress.result) {
      router.replace("/start");
      return;
    }
    if (!registration) {
      router.replace("/register");
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    // If a report is already cached, still show the loader — but in
    // a "ready" state for a short beat instead of redirecting instantly.
    // This guarantees the redesigned animations are visible even on
    // return visits and on devices that resolve the API in <100ms.
    if (existingReport) {
      setStatus("done");
      setActiveStep(ANALYSIS_STEPS.length - 1);
      window.setTimeout(() => router.replace("/results"), 1800);
      return;
    }

    const startedAt = Date.now();

    async function generateReport() {
      try {
        const response = await fetch("/api/results/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: registration?.name,
            email: registration?.email,
            answers: progress?.answers,
          }),
        });
        if (!response.ok) throw new Error("Generation request failed.");
        const data = await response.json();
        if (!data?.report) throw new Error("Missing report.");
        writeGeneratedReport(data.report);
        setStatus("done");
      } catch {
        if (progress?.result) {
          writeGeneratedReport(
            buildFallbackReport({
              result: progress.result,
              name: registration?.name,
              fallbackReason: "Claude generation was interrupted.",
            }),
          );
        }
        setStatus("error");
      } finally {
        // Minimum visible time of 3 seconds so the orbit + thread +
        // step-cascade animations all have time to land before we
        // redirect to /results. Previously was 900ms which often
        // flashed by faster than users could perceive.
        const elapsed = Date.now() - startedAt;
        window.setTimeout(
          () => router.replace("/results"),
          Math.max(3000, 3800 - elapsed),
        );
      }
    }

    void generateReport();
  }, [router]);

  useEffect(() => {
    // 4 steps × 820ms ≈ 3.3s — matches the 3s minimum visible time
    // so every step turns "done" before we redirect.
    const interval = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, ANALYSIS_STEPS.length - 1));
    }, 820);
    return () => window.clearInterval(interval);
  }, []);

  const progress =
    status === "done"
      ? 100
      : Math.min(94, Math.round(((activeStep + 1) / ANALYSIS_STEPS.length) * 88));

  return (
    <section className="anim-screen-enter relative flex flex-1 flex-col gap-5 overflow-hidden text-center">
      {/* Floating background particles — adds atmosphere across the whole screen */}
      <FloatingParticles />

      {/* ─── Hero stage: Kai surrounded by orbiting CORE tokens, threads
              drawing toward the center, scanning beam sweeping. ─── */}
      <div className="relative mx-auto grid h-[280px] w-full max-w-[320px] place-items-center">
        <AnalysisOrbitField status={status} />
        <div className="relative z-10 grid size-[126px] place-items-center overflow-hidden rounded-full border border-sand/14 bg-night/85 shadow-[0_22px_60px_rgba(0,0,0,0.4)]">
          {/* Pulsing aura ring */}
          <span className="analysis-aura absolute inset-0 rounded-full" aria-hidden />
          {/* New Kai — green screen keyed out, scaled + clipped to the
              circular plate so she reads as a face while tokens orbit. */}
          <div className="anim-avatar-bob">
            <div style={{ transform: "translateY(12px)" }}>
              <KaiChromaVideo src="/kai/kai-mentor-green.mp4" size={150} />
            </div>
          </div>
        </div>
        {/* CORE pillar tokens orbiting Kai */}
        {ORBIT_TOKENS.map((token) => (
          <OrbitToken key={token.letter} {...token} status={status} />
        ))}
      </div>

      {/* ─── Status copy ─── */}
      <div className="relative z-10 grid gap-2 text-center">
        <span className="chip chip--violet-on-dark mx-auto">
          {status === "done" ? (
            <CheckCircle2 size={13} />
          ) : (
            <span className="analysis-spark size-1.5 rounded-full bg-gold" aria-hidden />
          )}
          {status === "done" ? "Compass ready" : "Analyzing answers"}
        </span>
        <h1 className="text-display-2 mx-auto max-w-[14ch] text-sand">
          Kai is{" "}
          <span
            className="text-grad-warm"
            style={{
              fontStyle: "italic",
              fontVariationSettings: '"SOFT" 100, "opsz" 144',
            }}
          >
            shaping
          </span>{" "}
          your Compass.
        </h1>
        <p className="text-body-sm mx-auto max-w-[34ch] text-sand/65">
          Your answers are being scored, then translated into guidance you can
          actually walk with.
        </p>
      </div>

      {/* ─── Progress meter ─── */}
      <div className="relative z-10 rounded-[24px] border border-sand/12 bg-sand/[0.055] p-3 shadow-[0_18px_52px_rgba(0,0,0,0.22)]">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.13em] text-sand/52">
          <span className="flex items-center gap-1.5">
            <span className="analysis-spark size-1.5 rounded-full bg-grad-warm" aria-hidden />
            Signal strength
          </span>
          <span className="tabular-nums text-grad-warm">{progress}%</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-night/55">
          <div
            className="analysis-progress h-full rounded-full bg-grad-warm transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
          {/* Sheen pulse traveling across the bar */}
          <span className="analysis-progress-sheen absolute inset-y-0 w-12 -translate-x-full" />
        </div>
      </div>

      {/* ─── Steps cascading in ─── */}
      <ol className="relative z-10 grid w-full gap-2 text-start">
        {ANALYSIS_STEPS.map((step, index) => {
          const complete = index < activeStep || status === "done";
          const active = index === activeStep && status === "working";

          return (
            <li
              key={step.title}
              className={`analysis-step-card grid grid-cols-[40px_1fr_auto] items-center gap-2 rounded-[18px] border px-3 py-2.5 transition-colors ${
                complete
                  ? "border-grad-warm/35 bg-grad-warm/8"
                  : active
                    ? "border-sand/18 bg-sand/[0.075]"
                    : "border-sand/8 bg-sand/[0.03]"
              }`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span
                className={`relative grid size-9 place-items-center rounded-full text-lg ${
                  complete
                    ? "bg-grad-warm text-sand shadow-warm-glow"
                    : active
                      ? "analysis-step-active bg-sand/12 text-gold"
                      : "bg-night/45 text-sand/35"
                }`}
              >
                {complete ? <CheckCircle2 size={17} /> : step.glyph}
                {active ? (
                  <span className="analysis-step-ring absolute inset-0 rounded-full" aria-hidden />
                ) : null}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-[13px] font-bold leading-tight ${
                    complete || active ? "text-sand" : "text-sand/45"
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`mt-0.5 text-[10.5px] leading-snug ${
                    complete || active ? "text-sand/55" : "text-sand/30"
                  }`}
                >
                  {step.detail}
                </p>
              </div>
              <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-sand/38">
                {complete ? "Done" : active ? "Now" : "Next"}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "error" ? (
        <p className="relative z-10 text-[12px] leading-snug text-sand/50">
          Claude was not available, so Tareeq will use the built-in guidance
          framework for this result.
        </p>
      ) : null}
    </section>
  );
}

/**
 * Floating ambient particles behind the whole screen — gives the
 * "something is alive" feeling without competing with the central
 * orbit composition.
 */
function FloatingParticles() {
  const particles = [
    { x: "8%",  y: "12%", size: 4,  delay: 0,   dur: 7 },
    { x: "82%", y: "18%", size: 3,  delay: 1.2, dur: 8.5 },
    { x: "18%", y: "78%", size: 5,  delay: 2.4, dur: 9 },
    { x: "76%", y: "70%", size: 3,  delay: 0.6, dur: 7.5 },
    { x: "92%", y: "44%", size: 2,  delay: 3.1, dur: 6.5 },
    { x: "5%",  y: "48%", size: 2,  delay: 1.8, dur: 8 },
    { x: "50%", y: "5%",  size: 2,  delay: 2.7, dur: 7.2 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {particles.map((p, i) => (
        <span
          key={i}
          className="analysis-particle absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * A CORE pillar token (C, O, R, E) orbiting Kai. Position is computed
 * from `angle` so the 4 tokens land at the 4 compass directions.
 * Continuous slow orbit motion via CSS.
 */
function OrbitToken({
  letter,
  label: _label,
  angle,
  color,
  delay,
  status,
}: {
  letter: string;
  label: string;
  angle: number;
  color: string;
  delay: number;
  status: AnalysisStatus;
}) {
  const radius = 108;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  return (
    <span
      aria-hidden
      className="analysis-orbit-token absolute z-20 grid size-9 place-items-center rounded-full text-[12px] font-black text-sand shadow-[0_8px_22px_rgba(0,0,0,0.4)]"
      style={{
        left: "50%",
        top: "50%",
        // --ox/--oy feed the entrance keyframes so the token settles at
        // its compass position (not collapsed to center over Kai's face).
        ["--ox"]: `${x}px`,
        ["--oy"]: `${y}px`,
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 50%, #ffffff))`,
        animationDelay: `${delay}s`,
        opacity: status === "done" ? 1 : undefined,
      } as CSSProperties}
    >
      {letter}
    </span>
  );
}

/**
 * Background SVG: pulsing concentric rings, sweeping scanline,
 * four threads drawing in from each compass direction toward the
 * center anchor. Builds the "everything is converging on Kai" read.
 */
function AnalysisOrbitField({ status }: { status: AnalysisStatus }) {
  const accent = status === "error" ? "var(--error)" : "var(--gold)";
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 320"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="orbitSweep" x1="40" y1="40" x2="280" y2="280">
          <stop offset="0" stopColor="var(--violet-soft)" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="var(--blush)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="orbitCore" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--gold)" stopOpacity="0.45" />
          <stop offset="0.7" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft warm core glow behind Kai */}
      <circle cx="160" cy="160" r="80" fill="url(#orbitCore)" />

      {/* Outer dashed ring — slowly rotates */}
      <g
        className="analysis-spin-slow"
        style={{ transformOrigin: "160px 160px" }}
      >
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke="url(#orbitSweep)"
          strokeDasharray="24 14"
          strokeWidth="1.5"
        />
      </g>
      {/* Middle dotted ring — reverse rotation */}
      <g
        className="analysis-spin-reverse"
        style={{ transformOrigin: "160px 160px" }}
      >
        <circle
          cx="160"
          cy="160"
          r="108"
          fill="none"
          stroke="var(--sand)"
          strokeDasharray="2 10"
          strokeOpacity="0.34"
          strokeWidth="1.5"
        />
      </g>

      {/* Four threads converging from each compass direction to the
          center anchor. Each draws in continuously. */}
      <g
        fill="none"
        stroke={accent}
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path className="analysis-thread analysis-thread--n" d="M 160 20 L 160 110" />
        <path className="analysis-thread analysis-thread--e" d="M 300 160 L 210 160" />
        <path className="analysis-thread analysis-thread--s" d="M 160 300 L 160 210" />
        <path className="analysis-thread analysis-thread--w" d="M 20 160 L 110 160" />
      </g>

      {/* Sweeping vertical scanline */}
      <line
        className="analysis-scanline"
        x1="160"
        x2="160"
        y1="35"
        y2="285"
        stroke="var(--gold)"
        strokeLinecap="round"
        strokeOpacity="0.55"
        strokeWidth="2"
        style={{ transformOrigin: "160px 160px" }}
      />

      {/* Inner translucent disc so Kai's container sits in a slight
          well of darkness for legibility */}
      <circle cx="160" cy="160" r="70" fill="var(--night)" opacity="0.55" />
    </svg>
  );
}
