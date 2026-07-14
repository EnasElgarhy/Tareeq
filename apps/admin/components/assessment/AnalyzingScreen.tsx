"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

export function AnalyzingScreen({
  preview = false,
}: {
  /** Hold the loader open (no data read, no fetch, no redirect) for
   *  reviewing/redesigning the screen. The step cascade loops. */
  preview?: boolean;
} = {}) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>("working");

  useEffect(() => {
    if (preview) return;

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
  }, [router, preview]);

  useEffect(() => {
    // 4 steps × 820ms ≈ 3.3s — matches the 3s minimum visible time
    // so every step turns "done" before we redirect. In preview mode
    // the cascade loops so the animation stays alive for review.
    const interval = window.setInterval(() => {
      setActiveStep((step) =>
        preview
          ? step >= ANALYSIS_STEPS.length - 1
            ? 0
            : step + 1
          : Math.min(step + 1, ANALYSIS_STEPS.length - 1),
      );
    }, 820);
    return () => window.clearInterval(interval);
  }, [preview]);

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
        {/* Forming compass — the answers converge into a direction. */}
        <div className="relative z-10 grid size-[132px] place-items-center rounded-full border border-sand/14 bg-night/85 shadow-[0_22px_60px_rgba(0,0,0,0.4)]">
          {/* Pulsing aura ring */}
          <span className="analysis-aura absolute inset-0 rounded-full" aria-hidden />
          <CompassCore status={status} />
        </div>
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

      {/* ─── Progress meter (borderless) ─── */}
      <div className="relative z-10 grid gap-2">
        <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.13em] text-sand/52">
          <span className="flex items-center gap-1.5">
            <span className="analysis-spark size-1.5 rounded-full bg-grad-warm" aria-hidden />
            Signal strength
          </span>
          <span className="tabular-nums text-grad-warm">{progress}%</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-sand/10">
          <div
            className="analysis-progress h-full rounded-full bg-grad-warm transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
          {/* Sheen pulse traveling across the bar */}
          <span className="analysis-progress-sheen absolute inset-y-0 w-12 -translate-x-full" />
        </div>
      </div>

      {/* ─── Steps — revealed one at a time, borderless ─── */}
      <ol className="relative z-10 grid w-full gap-1 text-start">
        <style>{`
          @keyframes analysis-step-reveal {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .analysis-step-row {
            animation: analysis-step-reveal 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .analysis-step-row { animation: none; }
          }
        `}</style>
        {ANALYSIS_STEPS.map((step, index) => {
          const complete = index < activeStep || status === "done";
          const active = index === activeStep && status === "working";
          // Progressive reveal — only show steps up to the active one.
          if (status !== "done" && index > activeStep) return null;

          return (
            <li
              key={step.title}
              className={`analysis-step-row flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors ${
                active ? "bg-sand/[0.05]" : ""
              }`}
            >
              <span
                className={`relative grid size-9 shrink-0 place-items-center rounded-full text-lg ${
                  complete
                    ? "bg-grad-warm text-sand shadow-warm-glow"
                    : "analysis-step-active bg-sand/12 text-gold"
                }`}
              >
                {complete ? <CheckCircle2 size={17} /> : step.glyph}
                {active ? (
                  <span className="analysis-step-ring absolute inset-0 rounded-full" aria-hidden />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight text-sand">
                  {step.title}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-sand/55">
                  {step.detail}
                </p>
              </div>
              <span
                className={`shrink-0 text-[9.5px] font-bold uppercase tracking-[0.12em] ${
                  complete ? "text-sand/38" : "text-grad-warm"
                }`}
              >
                {complete ? "Done" : "Now"}
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
 * CompassCore — the central animated illustration that replaces Kai.
 *
 * A compass rose sits in the dark well: the cardinal points settle and
 * breathe while a warm needle sweeps around it, searching for a heading.
 * It reads as "your answers are converging into a direction" without a
 * character — pure compass language, on-brand (cream + warm gradient).
 * All motion is transform/opacity; honours prefers-reduced-motion.
 */
function CompassCore({ status }: { status: AnalysisStatus }) {
  const settled = status === "done";
  return (
    <span className="compass-core relative grid size-[100px] place-items-center" aria-hidden>
      <style>{`
        @keyframes compass-core-pulse {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
        @keyframes compass-core-sweep {
          to { transform: rotate(360deg); }
        }
        @keyframes compass-core-ring {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 0.9; }
        }
        .compass-core__rose {
          transform-box: fill-box;
          transform-origin: center;
          animation: compass-core-pulse 3.2s ease-in-out infinite;
        }
        .compass-core__needle {
          transform-box: fill-box;
          transform-origin: 60px 60px;
          animation: compass-core-sweep 3.6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        .compass-core--settled .compass-core__needle {
          animation: none;
          transform: rotate(0deg);
        }
        .compass-core__tick { animation: compass-core-ring 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .compass-core__rose,
          .compass-core__needle,
          .compass-core__tick { animation: none; }
        }
      `}</style>
      <svg
        viewBox="0 0 120 120"
        className={`size-full ${settled ? "compass-core--settled" : ""}`}
      >
        <defs>
          <linearGradient id="cc-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF3D83" />
            <stop offset="55%" stopColor="#FF6B3D" />
            <stop offset="100%" stopColor="#FFA53D" />
          </linearGradient>
          <radialGradient id="cc-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4C660" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#F4C660" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Warm glow behind the rose */}
        <circle cx="60" cy="60" r="40" fill="url(#cc-core)" />

        {/* Ticked bezel */}
        <circle
          className="compass-core__tick"
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#F5EEE6"
          strokeOpacity="0.22"
          strokeWidth="5"
          strokeDasharray="1.5 8"
        />

        {/* Compass rose — cardinal points; N is warm */}
        <g className="compass-core__rose">
          <path d="M60 16 L67 60 L60 64 L53 60 Z" fill="url(#cc-grad)" />
          <path d="M60 104 L53 60 L60 56 L67 60 Z" fill="#F5EEE6" opacity="0.3" />
          <path d="M16 60 L60 53 L64 60 L60 67 Z" fill="#F5EEE6" opacity="0.5" />
          <path d="M104 60 L60 67 L56 60 L60 53 Z" fill="#F5EEE6" opacity="0.3" />
          {/* diagonal minor spokes */}
          <g stroke="#F5EEE6" strokeOpacity="0.18" strokeWidth="1.4" strokeLinecap="round">
            <line x1="60" y1="60" x2="84" y2="36" />
            <line x1="60" y1="60" x2="84" y2="84" />
            <line x1="60" y1="60" x2="36" y2="84" />
            <line x1="60" y1="60" x2="36" y2="36" />
          </g>
        </g>

        {/* Searching needle — sweeps until the compass settles */}
        <g className="compass-core__needle">
          <line x1="60" y1="60" x2="60" y2="22" stroke="url(#cc-grad)" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="60" cy="22" r="3.4" fill="url(#cc-grad)" />
        </g>

        {/* Center hub */}
        <circle cx="60" cy="60" r="6.5" fill="#0F0824" />
        <circle cx="60" cy="60" r="3" fill="#F4C660" />
      </svg>
    </span>
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
