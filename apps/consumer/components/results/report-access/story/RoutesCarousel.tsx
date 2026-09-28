"use client";

import { Blocks, Network, Telescope, type LucideIcon } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";
import { fill } from "./story-data";

interface RouteCardData {
  number: string;
  percent: number;
  /** The route's house hue — progress fill, badge tint, watermark. */
  accent: string;
  /** The AA-safe tint of that hue for the small text and glyph on the card. */
  ink: string;
  accentSoft: string;
  /** The card's mark: builder blocks, explorer telescope, connector network. */
  icon: LucideIcon;
  titleKey: StringKey;
  tagsKey: StringKey;
}

const ROUTES: RouteCardData[] = [
  {
    number: "01",
    percent: 82,
    accent: "#f4c660",
    ink: "#f4c660",
    accentSoft: "rgba(244,198,96,0.16)",
    icon: Blocks,
    titleKey: "paywall.routes.r1.title",
    tagsKey: "paywall.routes.r1.tags",
  },
  {
    number: "02",
    percent: 74,
    accent: "#6d5ba8",
    ink: "#a99ae8",
    accentSoft: "rgba(109,91,168,0.16)",
    icon: Telescope,
    titleKey: "paywall.routes.r2.title",
    tagsKey: "paywall.routes.r2.tags",
  },
  {
    number: "03",
    percent: 68,
    accent: "#3d8a73",
    ink: "#5fbf9e",
    accentSoft: "rgba(61,138,115,0.16)",
    icon: Network,
    titleKey: "paywall.routes.r3.title",
    tagsKey: "paywall.routes.r3.tags",
  },
];

function RouteCard({ route }: { route: RouteCardData }) {
  const { t } = useLocale();
  const tags = t(route.tagsKey).split(" · ");
  const Icon = route.icon;
  const label = fill(t("paywall.routes.route_label"), { n: route.number });

  return (
    <article
      aria-label={label}
      className="relative flex w-[220px] shrink-0 snap-start flex-col gap-3 overflow-hidden rounded-[24px] border border-[rgba(109,91,168,0.3)] bg-[#221248] p-5 shadow-[0_12px_32px_rgba(34,18,72,0.18)] md:w-auto md:shrink"
    >
      {/* Atmosphere, not information: the route's mark, oversized and faint. */}
      <Icon
        aria-hidden="true"
        size={132}
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-7 -end-7"
        style={{ color: route.accent, opacity: 0.08 }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full"
            style={{ background: route.accentSoft, color: route.ink }}
          >
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="truncate text-[9px] font-bold leading-[11px] tracking-[0.16em] text-[rgba(245,238,230,0.6)]">
            {label}
          </span>
        </span>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold leading-[11px] tracking-[0.08em]"
          style={{ background: route.accentSoft, color: route.ink }}
        >
          {fill(t("paywall.routes.signal"), { percent: String(route.percent) })}
        </span>
      </div>

      <h3 className="daybreak-heading relative text-[22px] font-extrabold leading-[26px] text-[#f5eee6]">
        {t(route.titleKey)}
      </h3>

      <div className="relative flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold leading-[13px] text-[rgba(245,238,230,0.72)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="relative mt-auto h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${route.percent}%`, background: route.ink }}
        />
      </div>
    </article>
  );
}

/**
 * The Figma frame's route teaser. On the phone it stays a snap scroller with
 * the next card peeking past the edge; from `md` up the three cards become a
 * grid so they fill the row instead of leaving dead space on the right.
 * Canvas-only in the design — the routes stay illustrative until the report
 * is unlocked.
 */
export function RoutesCarousel() {
  const { t } = useLocale();

  return (
    <section aria-labelledby="routes-heading" className="pt-6">
      <div>
        <p
          className="text-[10px] font-bold uppercase leading-[13px] tracking-[0.18em]"
          style={{ color: "#7a4a21" }}
        >
          {t("paywall.routes.eyebrow")}
        </p>
        <h2
          id="routes-heading"
          className="daybreak-heading mt-1 text-[22px] font-extrabold leading-[27px] text-[color:var(--day-ink)]"
        >
          {t("paywall.routes.title")}
        </h2>
      </div>

      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
        {ROUTES.map((route) => (
          <RouteCard key={route.number} route={route} />
        ))}
      </div>
    </section>
  );
}
