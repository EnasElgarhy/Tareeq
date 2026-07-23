"use client";

import {
  Check,
  FileText,
  ListChecks,
  Search,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { readLocalAssessment } from "@/lib/assessment/progress";
import type { StringKey } from "@/lib/i18n/strings";
import { buildFallbackReport } from "@/lib/results/framework";
import {
  readGeneratedReport,
  readResultRegistration,
  writeGeneratedReport,
} from "@/lib/results/storage";

type AnalysisStatus = "working" | "done" | "error";

const ANALYSIS_STAGES: ReadonlyArray<{
  letter: "C" | "O" | "R" | "E";
  titleKey: StringKey;
  detailKey: StringKey;
  icon: LucideIcon;
  color: string;
  angle: number;
  signalPosition: { top: string; left: string };
}> = [
  {
    letter: "C",
    titleKey: "analyzing.step1.title",
    detailKey: "analyzing.step1.detail",
    icon: ListChecks,
    color: "var(--blush)",
    angle: 0,
    signalPosition: { top: "17%", left: "50%" },
  },
  {
    letter: "O",
    titleKey: "analyzing.step2.title",
    detailKey: "analyzing.step2.detail",
    icon: Search,
    color: "var(--gold)",
    angle: 90,
    signalPosition: { top: "48.5%", left: "83%" },
  },
  {
    letter: "R",
    titleKey: "analyzing.step3.title",
    detailKey: "analyzing.step3.detail",
    icon: Waypoints,
    color: "var(--mint)",
    angle: 180,
    signalPosition: { top: "80%", left: "50%" },
  },
  {
    letter: "E",
    titleKey: "analyzing.step4.title",
    detailKey: "analyzing.step4.detail",
    icon: FileText,
    color: "var(--violet-soft)",
    angle: 270,
    signalPosition: { top: "48.5%", left: "17%" },
  },
];

export function AnalyzingScreen() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const startedRef = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
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

    // Let a cached report settle into the completed route before revealing it.
    if (existingReport) {
      setStatus("done");
      setActiveStage(ANALYSIS_STAGES.length - 1);
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
            locale,
            versionId: progress?.versionId,
            versionLabel: progress?.versionLabel,
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
              fallbackReason: t("analyzing.fallback_reason"),
              locale,
            }),
          );
        }
        setStatus("error");
      } finally {
        // Keep the screen visible long enough for all four signals to form.
        const elapsed = Date.now() - startedAt;
        window.setTimeout(
          () => router.replace("/results"),
          Math.max(3000, 3800 - elapsed),
        );
      }
    }

    void generateReport();
  }, [router, locale, t]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStage((stage) =>
        Math.min(stage + 1, ANALYSIS_STAGES.length - 1),
      );
    }, 900);
    return () => window.clearInterval(interval);
  }, []);

  const formed = status !== "working";
  const headline = formed
    ? t("analyzing.headline_ready")
    : t("analyzing.headline_working");
  const statusLabel = formed
    ? t("analyzing.status_ready")
    : t("analyzing.status_working");
  const reelItems = [
    ...ANALYSIS_STAGES.map((stage) => ({
      title: t(stage.titleKey),
      detail: t(stage.detailKey),
      icon: stage.icon,
      color: stage.color,
    })),
    {
      title: t("analyzing.ready_title"),
      detail: t("analyzing.ready_detail"),
      icon: Check,
      color: "var(--mint)",
    },
  ];
  const reelActiveIndex = formed ? ANALYSIS_STAGES.length : activeStage;

  return (
    <section
      className="relative flex flex-1 items-center overflow-hidden py-5 sm:py-8"
      aria-busy={status === "working"}
    >
      <div className="relative z-10 mx-auto grid w-full max-w-[560px] justify-items-center gap-3 text-center sm:gap-5">
        <div className="grid justify-items-center gap-3" aria-live="polite">
          <p className="text-eyebrow flex items-center gap-2 text-sand/55">
            {formed ? (
              <Check aria-hidden="true" size={14} className="text-mint" />
            ) : (
              <span
                aria-hidden="true"
                className="analysis-status-dot size-1.5 rounded-full bg-gold"
              />
            )}
            {statusLabel}
          </p>

          <h1 className="text-display-2 max-w-[15ch] !tracking-normal text-sand">
            {headline}
          </h1>
          <p className="text-body-sm max-w-[42ch] text-sand/65">
            {t(formed ? "analyzing.subtitle_ready" : "analyzing.subtitle")}
          </p>
        </div>

        <CompassFormation
          activeStage={activeStage}
          formed={formed}
          label={statusLabel}
        />

        <div
          className="analysis-status-reel relative h-32 w-full max-w-[460px] overflow-hidden border-y border-sand/10 sm:h-[158px]"
          aria-live="polite"
        >
          {reelItems.map((item, index) => {
            const distance = index - reelActiveIndex;
            const state =
              index < reelActiveIndex
                ? "complete"
                : index === reelActiveIndex
                  ? "active"
                  : "pending";
            const ItemIcon = state === "complete" ? Check : item.icon;
            return (
              <div
                key={item.title}
                className="analysis-reel-item absolute inset-x-0 top-1/2 flex items-center justify-center gap-3 px-3 text-start"
                data-state={state}
                data-visibility={Math.abs(distance) > 2 ? "far" : "near"}
                aria-hidden={index !== reelActiveIndex}
                style={
                  {
                    "--reel-y": `${distance * 58}px`,
                    "--stage-color": item.color,
                  } as CSSProperties
                }
              >
                <span className="analysis-reel-icon grid size-9 shrink-0 place-items-center rounded-full border">
                  <ItemIcon aria-hidden="true" size={15} />
                </span>
                <span className="min-w-0 w-full max-w-[350px]">
                  <span className="block text-[15px] font-semibold leading-snug text-sand">
                    {item.title}
                  </span>
                  <span className="analysis-reel-detail text-body-sm mt-0.5 block text-sand/50">
                    {item.detail}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {status === "error" ? (
          <p className="max-w-[44ch] text-[12px] leading-relaxed text-sand/50">
            {t("analyzing.error_message")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CompassFormation({
  activeStage,
  formed,
  label,
}: {
  activeStage: number;
  formed: boolean;
  label: string;
}) {
  const needleAngle = formed ? 315 : ANALYSIS_STAGES[activeStage].angle;

  return (
    <div className="analysis-compass-frame relative aspect-square w-[clamp(140px,42vw,230px)] shrink-0">
      <div
        role="img"
        aria-label={label}
        className="analysis-compass-plate absolute inset-0 overflow-hidden rounded-[32px]"
      >
        <Image
          src="/illustrations/analysis-compass.png"
          alt=""
          fill
          priority
          sizes="230px"
          className="analysis-compass-art object-cover"
        />

        <span
          aria-hidden="true"
          className="analysis-compass-warm-glow absolute"
        />

        <span
          aria-hidden="true"
          className="analysis-image-needle absolute"
          style={
            {
              "--needle-angle": `${needleAngle}deg`,
            } as CSSProperties
          }
        >
          <span className="analysis-image-needle__north" />
          <span className="analysis-image-needle__south" />
          <span
            className="analysis-image-hub absolute left-1/2 top-1/2 rounded-full"
            data-formed={formed || undefined}
          />
        </span>

        {ANALYSIS_STAGES.map((stage, index) => {
          const state =
            formed || index < activeStage
              ? "complete"
              : index === activeStage
                ? "active"
                : "pending";
          return (
            <span
              key={stage.letter}
              aria-hidden="true"
              className="analysis-compass-signal absolute grid place-items-center rounded-full"
              data-state={state}
              style={
                {
                  top: stage.signalPosition.top,
                  left: stage.signalPosition.left,
                } as CSSProperties
              }
            >
              {stage.letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}
