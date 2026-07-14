"use client";

import { PlayCircle } from "lucide-react";
import type { ComponentType } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { rgbaFromHex } from "@/lib/results/cluster-visuals";

interface SceneComponentProps {
  size?: number | string;
  tone?: "cream" | "ink";
}

interface CareerTileProps {
  career: string;
  color: string;
  scene: ComponentType<SceneComponentProps>;
  watchHref: string;
}

const GOLD_INK = "#6B4D00";

/**
 * A light career-path tile for the "Paths to explore" carousel: a
 * cluster-tinted illustration zone over a warm-paper card, with the
 * career name and a "day in the life" affordance.
 */
export function CareerTile({
  career,
  color,
  scene: Scene,
  watchHref,
}: CareerTileProps) {
  const { t } = useLocale();
  return (
    <article className="flex w-[166px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] shadow-[var(--day-shadow-card)]">
      {/* Illustration zone — cluster-tinted */}
      <div
        className="relative grid h-[116px] place-items-center overflow-hidden"
        style={{
          background: `linear-gradient(150deg, ${rgbaFromHex(
            color,
            0.22,
          )}, ${rgbaFromHex(color, 0.07)})`,
        }}
      >
        <span aria-hidden className="opacity-95">
          <Scene size={118} tone="ink" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
          {t("home.tile.career_path")}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[14.5px] font-black leading-tight text-[color:var(--day-ink)]">
          {career}
        </h3>
        <a
          href={watchHref}
          target="_blank"
          rel="noreferrer"
          className="mt-auto inline-flex w-fit items-center gap-1.5 pt-3 text-[11.5px] font-bold transition hover:opacity-80"
          style={{ color: GOLD_INK }}
        >
          <PlayCircle size={14} />
          {t("home.tile.day_in_life")}
        </a>
      </div>
    </article>
  );
}
