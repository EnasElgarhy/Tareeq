"use client";

import Link from "next/link";
import type { ComponentType } from "react";

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
  return (
    <Link
      href={href}
      className="relative flex min-h-[196px] w-[182px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] p-4 shadow-[var(--day-shadow-card)] transition active:scale-[0.98]"
      style={{
        // Ink-dominant jewel tile with a vivid color glow in the top-right
        // corner — keeps white text legible for every hue (incl. gold/green)
        // while still reading as the cluster's color.
        background: `radial-gradient(125% 105% at 94% 4%, ${color} 0%, transparent 52%), ${ink}`,
      }}
    >
      {/* Scene motif — bleeds off bottom-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -right-5 opacity-80"
      >
        <Scene size={132} tone="cream" />
      </span>

      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.16em] text-white/90">
        {typeof rank === "number" ? `#${rank} · Explore` : "Explore"}
      </p>
      <h3 className="relative z-10 mt-1.5 text-[21px] font-black uppercase leading-[0.95] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
        {label}
      </h3>
      <p className="relative z-10 mt-auto max-w-[20ch] text-[11.5px] font-medium leading-snug text-white/90">
        {tagline}
      </p>
    </Link>
  );
}
