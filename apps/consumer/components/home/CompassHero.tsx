"use client";

import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { CompassScene } from "@/components/brand/Illustrations";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CompassHeroProps {
  clusterLabel: string;
  clusterColor: string;
  confidenceLabel: string;
  confidence: number;
}

/**
 * The compass identity card — deliberately calm: a soft cluster-colored
 * gradient, one quiet compass illustration, the cluster name, and a single
 * light "View report" button. Tapping it opens the full report.
 */
export function CompassHero({
  clusterLabel,
  clusterColor,
  confidenceLabel,
  confidence,
}: CompassHeroProps) {
  const { t } = useLocale();
  return (
    <Link
      href="/results"
      aria-label={t("home.hero.view_report_aria")}
      className="rounded-story daybreak-reveal relative block min-h-[228px] overflow-hidden shadow-[0_24px_56px_rgba(8,5,26,0.2)] transition active:scale-[0.99] sm:min-h-[250px]"
      style={{
        background:
          "linear-gradient(145deg, #221248 0%, #100A24 58%, #08051A 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 opacity-75 sm:right-4 sm:top-1"
      >
        <CompassScene size={210} tone="cream" />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            `linear-gradient(120deg, ${clusterColor}22 0%, transparent 45%), linear-gradient(to top, rgba(8,5,26,0.72), transparent 72%)`,
        }}
      />

      <div className="relative z-10 flex min-h-[228px] max-w-[88%] flex-col p-5 sm:min-h-[250px] sm:max-w-[76%] sm:p-7">
        <span className="grid size-10 place-items-center rounded-xl bg-[#F4C660] text-[#100A24] shadow-[0_8px_20px_rgba(244,198,96,0.22)]">
          <Compass size={20} strokeWidth={2.2} />
        </span>
        <p className="mt-auto text-[11px] font-bold uppercase text-[#F4C660]">
          {t("home.hero.eyebrow")}
        </p>
        <h2 className="daybreak-heading mt-1.5 text-[31px] leading-[1.02] text-[#F5EEE6] sm:text-[40px]">
          {clusterLabel}
        </h2>

        <div className="mt-4 grid grid-cols-[auto_minmax(48px,1fr)] items-center gap-x-3 gap-y-3">
          <span className="text-[12px] font-semibold text-[#C8B6F0]">
            {t("home.hero.confidence")
              .replace("{label}", confidenceLabel)
              .replace("{percent}", String(confidence))}
          </span>
          <span className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-white/15">
            <span
              className="block h-full rounded-full bg-[#F4C660] transition-[width] duration-700"
              style={{ width: `${Math.max(8, confidence)}%` }}
            />
          </span>
          <span className="col-span-2 inline-flex w-fit shrink-0 items-center gap-1 rounded-xl bg-[#F5EEE6] px-3 py-2 text-[12px] font-bold text-[#100A24]">
            {t("home.hero.view_report")}
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
