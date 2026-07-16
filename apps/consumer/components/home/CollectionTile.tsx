"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface SceneComponentProps {
  size?: number | string;
  tone?: "cream" | "ink";
}

interface CollectionTileProps {
  label: string;
  tagline: string;
  color: string;
  ink: string;
  scene: ComponentType<SceneComponentProps>;
  href: string;
  rank?: number;
}

/**
 * A bold, colored "collection" tile for the curiosity carousel — the
 * Headway "Collections made for you" pattern. The cluster house color
 * fills the tile; a cream line-scene motif bleeds off the bottom-right.
 */
export function CollectionTile({
  label,
  tagline,
  color,
  ink,
  scene: Scene,
  href,
  rank,
}: CollectionTileProps) {
  const { t } = useLocale();
  const exploreLabel = t("home.explore.title");
  return (
    <Link
      href={href}
      className="rounded-story relative flex min-h-[218px] w-[208px] shrink-0 snap-start flex-col overflow-hidden border border-white/10 p-5 shadow-[0_16px_38px_rgba(8,5,26,0.16)] transition active:scale-[0.98]"
      style={{
        background: `linear-gradient(145deg, ${ink} 0%, #100A24 100%)`,
        boxShadow: `inset 0 4px 0 ${color}, 0 16px 38px rgba(8,5,26,0.16)`,
      }}
    >
      {/* Scene motif — bleeds off bottom-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -right-5 opacity-80"
      >
        <Scene size={132} tone="cream" />
      </span>

      <p className="relative z-10 text-[10px] font-bold uppercase text-[#F4C660]">
        {typeof rank === "number" ? `#${rank} · ${exploreLabel}` : exploreLabel}
      </p>
      <h3 className="daybreak-heading relative z-10 mt-2 text-[24px] leading-[0.98] text-[#F5EEE6]">
        {label}
      </h3>
      <p className="relative z-10 mt-auto max-w-[20ch] text-[11.5px] font-medium leading-snug text-white/90">
        {tagline}
      </p>
    </Link>
  );
}
