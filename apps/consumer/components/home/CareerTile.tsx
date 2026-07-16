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
    <article className="daybreak-story-card rounded-story-alt flex w-[190px] shrink-0 snap-start flex-col overflow-hidden">
      {/* Illustration zone — cluster-tinted */}
      <div
        className="relative grid h-[126px] place-items-center overflow-hidden border-b border-[color:var(--day-line)]"
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
        <p className="daybreak-eyebrow text-[10px]">
          {t("home.tile.career_path")}
        </p>
        <h3 className="daybreak-heading mt-1.5 line-clamp-2 text-[17px] leading-tight text-[color:var(--day-ink)]">
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
