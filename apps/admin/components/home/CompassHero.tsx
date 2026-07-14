"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CompassScene } from "@/components/brand/Illustrations";

interface CompassHeroProps {
  clusterLabel: string;
  clusterColor: string;
  clusterInk: string;
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
  clusterInk,
  confidenceLabel,
  confidence,
}: CompassHeroProps) {
  return (
    <Link
      href="/results"
      aria-label="View your full report"
      className="anim-screen-enter relative block min-h-[176px] overflow-hidden rounded-[28px] shadow-[var(--day-shadow-hero)] transition active:scale-[0.99]"
      style={{
        background: `linear-gradient(150deg, ${clusterColor} 0%, ${clusterInk} 96%)`,
      }}
    >
      {/* One quiet compass illustration, bleeding off the top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 opacity-55"
      >
        <CompassScene size={150} tone="cream" />
      </span>
      {/* Soft scrim for white-text legibility over the gradient */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.12) 44%, transparent 74%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 z-10 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
          Your compass points to
        </p>
        <h2 className="mt-1 text-[27px] font-bold leading-[1.05] text-white">
          {clusterLabel}
        </h2>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <span className="text-[11.5px] font-semibold text-white/75">
            {confidenceLabel} signal · {confidence}%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm">
            View report
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
