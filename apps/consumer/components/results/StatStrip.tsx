"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import { getArchetypeKey, getConfidenceLabelKey } from "@/lib/results/report-labels";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/**
 * The three readouts that summarise a Compass result: the strongest signal,
 * the confidence in it, and the working style behind it.
 *
 * One component because the same strip appears on three surfaces — the locked
 * Compass story, the unlocked Compass identity card, and the assessment
 * report body — which previously each carried their own near-identical copy.
 */
export function StatStrip({
  report,
  className,
}: {
  report: PersonalizedCompassReport;
  /** Spacing / stacking from the surface that owns the strip. */
  className?: string;
}) {
  const { t } = useLocale();
  const confidence = report.score.confidencePercentage;

  return (
    <div className={`grid grid-cols-3 gap-2.5 ${className ?? ""}`}>
      <Readout
        label={t("results.stat.signal_label")}
        value={t("results.stat.signal_value")}
        meta={getClusterLabel(report.clusterCode, t)}
        ink={READOUT_INK.signal}
      />
      <Readout
        label={t("results.stat.confidence_label")}
        value={`${confidence}%`}
        meta={t(getConfidenceLabelKey(report.score.confidenceLabel))}
        ink={READOUT_INK.confidence}
        meter={confidence}
      />
      <Readout
        label={t("results.stat.style_label")}
        value={t(getArchetypeKey(report.archetype))}
        meta={t("results.stat.style_meta")}
        ink={READOUT_INK.style}
      />
    </div>
  );
}

/**
 * The readouts' hues — the same gold / violet / green trio the route cards and
 * CORE medallions use, in their AA-safe tints for text on the night surface.
 */
const READOUT_INK = {
  signal: "#f4c660",
  confidence: "#a99ae8",
  style: "#5fbf9e",
} as const;

/**
 * One readout. Three devices do the work: an accent bar at the inline-start
 * edge (the app's own marker, correct in RTL because it is logical), the value
 * in that accent so the strip is scannable, and a hairline meter only where
 * the value is a real proportion — never decoration.
 */
function Readout({
  label,
  value,
  meta,
  ink,
  meter,
}: {
  label: string;
  value: string;
  meta: string;
  ink: string;
  /** Rendered as a meter under the value when the figure is a percentage. */
  meter?: number;
}) {
  return (
    <div
      className="relative flex flex-col rounded-[18px] border border-white/12 px-2.5 py-2.5 ps-3 text-start shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.035) 100%)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-2.5 start-0 w-[3px] rounded-e-full"
        style={{ background: ink }}
      />
      <p
        className="break-words text-[10px] font-bold leading-[12px]"
        style={{ color: "rgba(245,238,230,0.74)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 break-words text-[13.5px] font-extrabold leading-[1.15] tabular-nums"
        style={{ color: ink }}
      >
        {value}
      </p>
      {typeof meter === "number" ? (
        <span
          aria-hidden="true"
          className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-white/20"
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(8, meter)}%`, background: ink }}
          />
        </span>
      ) : null}
      {/* Two lines are reserved for the caption so all three readouts keep the
          same rhythm even when one caption is longer than the others. */}
      <p
        className="mt-auto min-h-[25px] break-words pt-1 text-[10px] font-semibold leading-[12.5px]"
        style={{ color: "rgba(245,238,230,0.62)" }}
      >
        {meta}
      </p>
    </div>
  );
}
