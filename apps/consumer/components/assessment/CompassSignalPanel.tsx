import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CLUSTER_VISUALS, getClusterLabel } from "@/lib/results/cluster-visuals";
import { getArchetypeKey, getConfidenceLabelKey } from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/**
 * The CORE Compass result, as a dark hero. Shared so it can never drift
 * between `/results` (where this ring/gradient treatment was built
 * first — see ResultCompass below, extracted from ResultsScreen.tsx)
 * and the Overview tab's "compact" summary of the same result.
 *
 * `variant="full"` reproduces exactly what ResultsScreen.tsx renders
 * inline today — built here so it's ready to swap in later, but this
 * pass doesn't touch `/results` itself (out of scope: Overview only).
 * `variant="compact"` is the new Overview placement — a fixed dark
 * gradient (not per-cluster colored, matching the approved mockup)
 * with a smaller, corner-cropped ring instead of the centered hero ring.
 */
export function CompassSignalPanel({
  report,
  variant,
  onViewReport,
}: {
  report: PersonalizedCompassReport;
  variant: "compact" | "full";
  /** Only used by "compact" — routes into the Compass tab, not a page nav. */
  onViewReport?: () => void;
}) {
  const { t } = useLocale();
  const clusterVisual = CLUSTER_VISUALS[report.clusterCode];

  if (variant === "full") {
    return (
      <header className="result-hero relative overflow-hidden rounded-[30px] border border-sand/12 bg-sand/[0.055] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="result-hero-grid absolute inset-0 opacity-70" />
        <div className="relative z-10 grid gap-4">
          <div className="relative mx-auto grid h-[178px] w-full max-w-[260px] place-items-center">
            <ResultCompass color={clusterVisual.color} />
            <div className="grid size-[92px] place-items-center rounded-full border border-white/12 bg-night/80 text-center shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
                {report.clusterCode}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Curiosity signal</p>
            <h1 className="text-[42px] font-black uppercase leading-[0.9] text-white">{getClusterLabel(report.clusterCode, t)}</h1>
            <p className="max-w-[30ch] text-[14px] font-semibold leading-snug text-white/74">{report.summary}</p>
          </div>
        </div>
      </header>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[30px] border border-sand/12 p-4 text-white shadow-[0_24px_48px_rgba(8,5,26,0.35)]"
      style={{ background: "linear-gradient(135deg, #1F3A6A 0%, #100A24 56%, #08051A 100%)" }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 220 220"
        className="pointer-events-none absolute -right-[46px] -top-[46px] size-[180px] opacity-90"
      >
        <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="2 9" strokeWidth="1.4" />
        <circle
          cx="110"
          cy="110"
          r="70"
          fill="none"
          stroke="#6FE0C0"
          strokeOpacity="0.55"
          strokeDasharray="16 10"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
        <path
          d="M110 42 L120 100 L178 110 L120 120 L110 178 L100 120 L42 110 L100 100 Z"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>

      <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
        {t("profile.resultHero.eyebrow")}
      </p>
      <h1 className="relative z-10 mt-2.5 max-w-[78%] text-[30px] font-black uppercase leading-[0.98] tracking-[-0.2px] text-white">
        {report.clusterName}
      </h1>
      <p className="relative z-10 mt-2.5 max-w-[90%] text-[12.5px] leading-relaxed text-white/68">{report.summary}</p>

      <div className="relative z-10 mt-4 flex gap-2">
        <div className="flex-1 rounded-[14px] border border-white/14 bg-white/[0.06] px-2.5 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.4px] text-white/42">
            {t("profile.resultHero.style_label")}
          </p>
          <p className="mt-0.5 text-[13px] font-bold text-white">{t(getArchetypeKey(report.archetype))}</p>
        </div>
        <div className="flex-1 rounded-[14px] border border-white/14 bg-white/[0.06] px-2.5 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.4px] text-white/42">
            {t("profile.compass.confidence_title")}
          </p>
          <p className="mt-0.5 text-[13px] font-bold text-white">
            {report.score.confidencePercentage}% · {t(getConfidenceLabelKey(report.score.confidenceLabel))}
          </p>
        </div>
      </div>

      <Link
        href="/profile?tab=compass"
        onClick={onViewReport}
        className="relative z-10 mt-3.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-gold-soft"
      >
        {t("profile.resultHero.view_report")}
        <ChevronRight size={13} />
      </Link>
    </div>
  );
}

/** The dashed-ring + diamond compass motif, colored per-cluster —
 * extracted from ResultsScreen.tsx so this exact treatment can be
 * reused without redrawing it, and so `/results` and any future
 * consumer never visually drift apart on what "the compass ring" is. */
export function ResultCompass({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 220" className="result-compass-spin absolute inset-0 h-full w-full">
      <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.2)" strokeDasharray="2 10" strokeWidth="1.5" />
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
