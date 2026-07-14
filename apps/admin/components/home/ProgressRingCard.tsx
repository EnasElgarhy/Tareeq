"use client";

import { Lock } from "lucide-react";

interface ProgressRingCardProps {
  completionPct: number;
  completedCount: number;
  totalCount: number;
  clusterColor: string;
  clusterInk: string;
  moduleName: string | null;
  moduleTagline: string | null;
  moduleDuration: string | null;
}

const CX = 100;
const CY = 100;
const R = 78;
const ARC_DEG = 270; // gauge opens at the bottom
const START_DEG = 225;

/** Point on the ring; 0° = top, increasing clockwise. */
function pointAt(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

function arcPath(sweepDeg: number) {
  const start = pointAt(START_DEG);
  const end = pointAt(START_DEG + sweepDeg);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * A prominent progress gauge (Speechify "0:14 of 30m" pattern) — the
 * journey-completeness arc in the cluster hue, with the next locked
 * module beneath it as the visible "next thing to earn".
 */
export function ProgressRingCard({
  completionPct,
  completedCount,
  totalCount,
  clusterColor,
  clusterInk,
  moduleName,
  moduleTagline,
  moduleDuration,
}: ProgressRingCardProps) {
  const pct = Math.max(0, Math.min(100, completionPct));
  const trackPath = arcPath(ARC_DEG);
  const fillPath = arcPath((pct / 100) * ARC_DEG);

  return (
    <article className="rounded-[24px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
        Your journey
      </p>

      <div className="relative mx-auto mt-1 h-[192px] w-[200px]">
        {/* Square viewBox in a near-square box so the gauge stays circular */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(43,36,28,0.10)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {pct > 0 ? (
            <path
              d={fillPath}
              fill="none"
              stroke={clusterColor}
              strokeWidth="14"
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-[44px] font-black leading-none tabular-nums"
            style={{ color: clusterInk }}
          >
            {pct}%
          </span>
          <span className="mt-1.5 text-[12px] font-semibold text-[color:var(--day-ink-2)]">
            {completedCount} of {totalCount} stages
          </span>
        </div>
      </div>

      {moduleName ? (
        <div className="mt-1 flex items-center gap-3 rounded-2xl border border-[color:var(--day-line)] bg-[color:var(--day-inset)] p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[rgba(43,36,28,0.06)] text-[color:var(--day-ink-3)]">
            <Lock size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-[color:var(--day-ink)]">
              Next: {moduleName}
            </p>
            <p className="truncate text-[11.5px] text-[color:var(--day-ink-3)]">
              {moduleTagline}
            </p>
          </div>
          {moduleDuration ? (
            <span className="shrink-0 rounded-full border border-[color:var(--day-line)] px-2 py-1 text-[10px] font-bold text-[color:var(--day-ink-3)]">
              {moduleDuration}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
