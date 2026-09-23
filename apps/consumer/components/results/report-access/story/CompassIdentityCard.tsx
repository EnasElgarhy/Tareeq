"use client";

import { Sparkles } from "lucide-react";
import { ResultCompass } from "@/components/assessment/CompassSignalPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { StatStrip } from "@/components/results/StatStrip";
import {
  CLUSTER_VISUALS,
  getClusterLabel,
} from "@/lib/results/cluster-visuals";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import { fill } from "./story-data";

/** The app's dark identity card — the same gradient as the Overview hero. */
const CARD_GRADIENT =
  "linear-gradient(145deg, #221248 0%, #100A24 58%, #08051A 100%)";
const CARD_TEXT = "#F5EEE6";

interface CompassIdentityCardProps {
  report: PersonalizedCompassReport;
}

/**
 * The report's compass card — Concept A's centrepiece — on the app's dark
 * card: the Curiosity Compass chip, the dashed ring and diamond in the
 * cluster's colour with the code at the centre, the signal name, and the
 * three stat pills. Landscape at desktop (ring left, signal right), as the
 * report itself draws it. Shared by the locked story and the unlocked
 * report so the Compass tab keeps one identity before and after purchase.
 */
export function CompassIdentityCard({ report }: CompassIdentityCardProps) {
  const { t } = useLocale();
  const cluster = getClusterLabel(report.clusterCode, t);
  const clusterColor = CLUSTER_VISUALS[report.clusterCode].color;

  return (
    <section
      aria-labelledby="compass-card-heading"
      className="rounded-story relative overflow-hidden shadow-[0_24px_56px_rgba(8,5,26,0.2)]"
      style={{ background: CARD_GRADIENT }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(120deg, ${clusterColor}26 0%, transparent 48%), linear-gradient(to top, rgba(8,5,26,0.6), transparent 70%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-x-6 gap-y-4 p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-x-8 lg:p-7">
        <div
          role="img"
          aria-label={fill(t("paywall.reveal.compass_alt"), { cluster })}
          className="relative mx-auto grid size-[200px] place-items-center lg:size-[220px]"
        >
          <ResultCompass color={clusterColor} />
          <div className="grid size-[92px] place-items-center rounded-full border border-white/12 bg-night/80 text-center shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
              {report.clusterCode}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/[0.08] px-3 py-1 text-[11px] font-bold text-white">
              <Sparkles size={13} aria-hidden="true" />
              {t("results.hero.chip")}
            </span>
            <span
              className="rounded-full border border-white/14 bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "rgba(245,238,230,0.72)" }}
            >
              {t("results.hero.badge")}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "rgba(245,238,230,0.6)" }}
            >
              {t("results.hero.eyebrow")}
            </p>
            <h2
              id="compass-card-heading"
              className="daybreak-heading text-[36px] leading-[1.02] lg:text-[44px]"
              style={{ color: CARD_TEXT }}
            >
              {cluster}
            </h2>
            {/* Inline: the paper surface colours paragraphs, and this card is dark. */}
            <p
              className="max-w-[34ch] text-[13.5px] font-semibold leading-snug lg:text-[14px]"
              style={{ color: "rgba(245,238,230,0.78)" }}
            >
              {t("results.hero.subtitle")}
            </p>
          </div>
          <StatStrip report={report} />
        </div>
      </div>
    </section>
  );
}
