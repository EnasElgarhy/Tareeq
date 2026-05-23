"use client";

import {
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Kai } from "@/components/brand/Kai";
import { readLocalAssessment } from "@/lib/assessment/progress";
import { buildFallbackReport } from "@/lib/results/framework";
import {
  readGeneratedReport,
  readResultRegistration,
  writeGeneratedReport,
} from "@/lib/results/storage";

const ANALYSIS_STEPS = [
  "Reading answer patterns",
  "Balancing the four pillars",
  "Mapping your compass",
  "Writing Kai’s guidance",
] as const;

export function AnalyzingScreen() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<"working" | "done" | "error">("working");

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

    if (existingReport) {
      router.replace("/results");
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

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
        const elapsed = Date.now() - startedAt;
        window.setTimeout(
          () => router.replace("/results"),
          Math.max(700, 2300 - elapsed),
        );
      }
    }

    void generateReport();
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, ANALYSIS_STEPS.length - 1));
    }, 680);

    return () => window.clearInterval(interval);
  }, []);

  const progress =
    status === "done"
      ? 100
      : Math.min(
          92,
          Math.round(((activeStep + 1) / ANALYSIS_STEPS.length) * 86),
        );

  return (
    <section className="anim-screen-enter flex flex-1 flex-col justify-center gap-5 overflow-hidden text-center">
      <div className="relative mx-auto grid h-[250px] w-full max-w-[300px] place-items-center">
        <div className="analysis-grid absolute inset-0 opacity-60" />
        <AnalysisCompass status={status} />
        <div className="anim-avatar-bob relative z-10 grid size-[122px] place-items-center rounded-full border border-sand/12 bg-night/80 shadow-[0_18px_50px_rgba(0,0,0,0.38)]">
          <Kai mood={status === "error" ? "thinking" : "curious"} size={102} />
        </div>
        <span className="analysis-signal analysis-signal--one" />
        <span className="analysis-signal analysis-signal--two" />
        <span className="analysis-signal analysis-signal--three" />
      </div>

      <div className="grid gap-2 text-center">
        <span className="chip chip--violet-on-dark mx-auto">
          {status === "done" ? (
            <CheckCircle2 size={13} />
          ) : (
            <Sparkles size={13} />
          )}
          {status === "done" ? "Compass ready" : "Analyzing answers"}
        </span>
        <h1 className="text-display-2 mx-auto max-w-[13ch] text-sand">
          Kai is building your Compass.
        </h1>
        <p className="text-body-sm mx-auto max-w-[34ch] text-sand/65">
          Your answers are being scored first, then shaped into guidance you can
          actually use.
        </p>
      </div>

      <div className="rounded-[24px] border border-sand/10 bg-sand/[0.055] p-3 shadow-[0_18px_52px_rgba(0,0,0,0.22)]">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.13em] text-sand/48">
          <span>Signal strength</span>
          <span className="tabular-nums text-gold">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-night/55">
          <div
            className="analysis-progress h-full rounded-full bg-grad-warm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="grid w-full gap-2 text-start">
        {ANALYSIS_STEPS.map((step, index) => {
          const complete = index < activeStep || status === "done";
          const active = index === activeStep && status === "working";

          return (
            <li
              key={step}
              className={`analysis-step grid grid-cols-[34px_1fr_auto] items-center gap-2 rounded-[18px] border px-3 py-2.5 ${
                complete
                  ? "border-gold/35 bg-gold/10"
                  : active
                    ? "border-sand/16 bg-sand/[0.07]"
                    : "border-sand/8 bg-sand/[0.035]"
              }`}
            >
              <span
                className={`grid size-8 place-items-center rounded-full ${
                  complete
                    ? "bg-gold text-carbon"
                    : active
                      ? "bg-sand/12 text-gold"
                      : "bg-night/45 text-sand/38"
                }`}
              >
                {complete ? (
                  <CheckCircle2 size={15} />
                ) : active ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <CircleDashed size={15} />
                )}
              </span>
              <span
                className={`text-[13px] font-bold ${
                  complete || active ? "text-sand" : "text-sand/45"
                }`}
              >
                {step}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sand/34">
                {complete ? "Done" : active ? "Now" : "Next"}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "error" ? (
        <p className="text-[12px] leading-snug text-sand/50">
          Claude was not available, so Tareeq will use the built-in guidance
          framework for this result.
        </p>
      ) : null}
    </section>
  );
}

function AnalysisCompass({ status }: { status: "working" | "done" | "error" }) {
  const accent = status === "error" ? "var(--error)" : "var(--gold)";

  return (
    <svg
      aria-hidden
      viewBox="0 0 240 240"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="analysisSweep" x1="24" y1="28" x2="204" y2="214">
          <stop offset="0" stopColor="var(--violet-soft)" stopOpacity="0.14" />
          <stop offset="0.52" stopColor="var(--blush)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <g
        className="analysis-spin-slow"
        style={{ transformOrigin: "120px 120px" }}
      >
        <circle
          cx="120"
          cy="120"
          r="104"
          fill="none"
          stroke="url(#analysisSweep)"
          strokeDasharray="22 12"
          strokeWidth="1.5"
        />
        <circle
          cx="120"
          cy="120"
          r="76"
          fill="none"
          stroke="var(--sand)"
          strokeDasharray="3 12"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
      </g>
      <g
        className="analysis-spin-reverse"
        style={{ transformOrigin: "120px 120px" }}
      >
        <path
          d="M120 18 L132 108 L222 120 L132 132 L120 222 L108 132 L18 120 L108 108 Z"
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="1.2"
        />
      </g>
      <path
        className="analysis-route"
        d="M43 154 C65 84 105 63 154 83 C195 100 199 155 160 178 C124 199 82 186 67 143"
        fill="none"
        stroke="var(--mint)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <line
        className="analysis-scanline"
        x1="120"
        x2="120"
        y1="28"
        y2="212"
        stroke="var(--gold)"
        strokeLinecap="round"
        strokeOpacity="0.62"
        strokeWidth="2"
        style={{ transformOrigin: "120px 120px" }}
      />
      <circle cx="120" cy="120" r="58" fill="var(--night)" opacity="0.72" />
    </svg>
  );
}
