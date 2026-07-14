"use client";

import type { ReactNode } from "react";

/**
 * One "suggested action" chip/card on the Kai Landing. Phase 1 has no live
 * conversation to route into yet — `onSelect` is the caller's hook to fire
 * analytics + reveal the "coming soon" reassurance copy (see KaiPanel).
 */
export function KaiActionCard({
  icon,
  label,
  active,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[12.5px] font-bold leading-none transition-colors ${
        active
          ? "border-violet/35 bg-violet/10 text-violet"
          : "border-carbon/10 bg-white text-carbon/75 hover:border-carbon/18 hover:bg-carbon/[0.03]"
      }`}
    >
      <span className={active ? "text-violet" : "text-carbon/45"}>{icon}</span>
      {label}
    </button>
  );
}
