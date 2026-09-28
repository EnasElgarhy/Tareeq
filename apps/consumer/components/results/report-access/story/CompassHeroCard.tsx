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

/** The night card — the same gradient as the Overview hero. */
const CARD_GRADIENT =
  "linear-gradient(145deg, #221248 0%, #100A24 58%, #08051A 100%)";

/**
 * The Figma frame's hero: the report compass centred over the result —
 * Curiosity Compass chip, the cluster name, the one-line read, and the
 * three signal pills. Canvas-only in the design; here it is the locked
 * tab's centrepiece.
 */
export function CompassHeroCard({
  report,
}: {
  report: PersonalizedCompassReport;
}) {
  const { t } = useLocale();
  const cluster = getClusterLabel(report.clusterCode, t);
  const clusterColor = CLUSTER_VISUALS[report.clusterCode].color;

  return (
    <section
      aria-labelledby="compass-hero-heading"
      className="rounded-story relative overflow-hidden px-5 pb-12 pt-5 text-center shadow-[0_24px_56px_rgba(8,5,26,0.2)]"
      style={{ background: CARD_GRADIENT }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div
          role="img"
          aria-label={fill(t("paywall.reveal.compass_alt"), { cluster })}
          className="relative grid size-[200px] place-items-center"
        >
          <ResultCompass color={clusterColor} />
          <div className="grid size-[92px] place-items-center rounded-full border border-white/12 bg-night/80 text-center shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
              {report.clusterCode}
            </span>
          </div>
        </div>

        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-bold leading-[14px] text-white">
          <Sparkles size={13} aria-hidden="true" />
          {t("results.hero.chip")}
        </span>

        <h2
          id="compass-hero-heading"
          className="daybreak-heading mt-2 text-[36px] font-extrabold leading-[43px]"
          style={{ color: "#f5eee6" }}
        >
          {cluster}
        </h2>
        <p
          className="mt-1.5 max-w-[40ch] text-[13.5px] font-semibold leading-[18.5px] md:max-w-[58ch]"
          style={{ color: "rgba(245,238,230,0.78)" }}
        >
          {t("results.hero.subtitle")}
        </p>

        <StatStrip report={report} className="mt-5 w-full" />
      </div>
    </section>
  );
}
