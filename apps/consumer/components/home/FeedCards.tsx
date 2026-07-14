"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Lock,
  PlayCircle,
  Shuffle,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { rgbaFromHex } from "@/lib/results/cluster-visuals";
import type {
  AskKaiCard,
  FeedAccent,
  HomeFeedCard,
  InsightCard,
  IntersectionCard,
  NextStepCard,
  SpotlightCard,
  TodayCard,
  UnlockCard,
} from "@/lib/home/feed";

// On-light accent pairs. `vivid` for fills / rails / dots; `ink` for text,
// icons, and CTA backgrounds (each ink passes WCAG AA on the warm-paper card).
const ACCENT_VIVID: Record<Exclude<FeedAccent, "cluster">, string> = {
  gold: "#F4C660",
  violet: "#6E48E4",
  mint: "#6FE0C0",
};
const ACCENT_INK: Record<Exclude<FeedAccent, "cluster">, string> = {
  gold: "#6B4D00",
  violet: "#6E48E4", // brand purple — AA on the warm-paper card (~5.7:1)
  mint: "#0E7A6E",
};
const GOLD_INK = "#6B4D00";

function accentVivid(accent: FeedAccent, clusterColor: string): string {
  return accent === "cluster" ? clusterColor : ACCENT_VIVID[accent];
}
function accentInk(accent: FeedAccent, clusterInk: string): string {
  return accent === "cluster" ? clusterInk : ACCENT_INK[accent];
}

interface CardTheme {
  clusterColor: string;
  clusterInk: string;
}

/** Switchboard — renders the right card for each feed item. */
export function FeedCardView({
  card,
  clusterColor,
  clusterInk,
}: {
  card: HomeFeedCard;
  clusterColor: string;
  clusterInk: string;
}) {
  const theme: CardTheme = { clusterColor, clusterInk };
  switch (card.kind) {
    case "today":
      return <TodayCardView card={card} />;
    case "next-step":
      return <NextStepCardView card={card} theme={theme} />;
    case "spotlight":
      return <SpotlightCardView card={card} theme={theme} />;
    case "unlock":
      return <UnlockCardView card={card} theme={theme} />;
    case "insight":
      return <InsightCardView card={card} />;
    case "intersection":
      return <IntersectionCardView card={card} theme={theme} />;
    case "ask-kai":
      return <AskKaiCardView card={card} theme={theme} />;
    default:
      return null;
  }
}

/** The soft daily beat — the one card that reads as "today". */
function TodayCardView({ card }: { card: TodayCard }) {
  return (
    <article
      className="relative overflow-hidden rounded-[24px] border border-gold/40 p-4 shadow-[var(--day-shadow-card)]"
      style={{
        background:
          "radial-gradient(130% 100% at 100% 0%, rgba(255,138,76,0.18), transparent 56%), var(--day-card)",
      }}
    >
      <div className="relative z-10">
        <p
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: GOLD_INK }}
        >
          <Sun size={13} />
          {card.eyebrow}
        </p>
        <h2 className="mt-2 text-[19px] font-black leading-[1.12] text-[color:var(--day-ink)]">
          {card.title}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {card.body}
        </p>
        {card.source ? (
          <p className="mt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[color:var(--day-ink-3)]">
            {card.source}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function NextStepCardView({
  card,
  theme,
}: {
  card: NextStepCard;
  theme: CardTheme;
}) {
  const vivid = accentVivid(card.accent, theme.clusterColor);
  const ink = accentInk(card.accent, theme.clusterInk);
  const ctaInner = (
    <>
      {card.cta}
      {card.external ? <ArrowUpRight size={15} /> : <ArrowRight size={15} />}
    </>
  );

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <span
        aria-hidden
        className="absolute inset-y-4 left-0 w-1 rounded-r-full"
        style={{ background: vivid }}
      />
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
        style={{
          background: rgbaFromHex(vivid, 0.14),
          color: ink,
          boxShadow: `inset 0 0 0 1px ${rgbaFromHex(vivid, 0.3)}`,
        }}
      >
        {card.label}
      </span>
      <h3 className="mt-2.5 text-[15.5px] font-black leading-tight text-[color:var(--day-ink)]">
        {card.title}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--day-ink-2)]">
        {card.body}
      </p>
      {card.external ? (
        <a
          href={card.href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition active:scale-95"
          style={{ background: ink, color: "#fff" }}
        >
          {ctaInner}
        </a>
      ) : (
        <Link
          href={card.href}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition active:scale-95"
          style={{ background: ink, color: "#fff" }}
        >
          {ctaInner}
        </Link>
      )}
    </article>
  );
}

function SpotlightCardView({
  card,
  theme,
}: {
  card: SpotlightCard;
  theme: CardTheme;
}) {
  const { t } = useLocale();
  return (
    <article className="rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
        <span
          className="size-1.5 rounded-full"
          style={{ background: theme.clusterColor }}
        />
        {t("home.feed.spotlight_eyebrow")}
      </p>
      <h3 className="mt-1.5 text-[17px] font-black leading-tight text-[color:var(--day-ink)]">
        {card.career}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--day-ink-2)]">
        {card.why}
      </p>
      <a
        href={card.watchHref}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-[11.5px] font-bold transition hover:bg-gold/15"
        style={{ background: "rgba(244,198,96,0.14)", color: GOLD_INK }}
      >
        <PlayCircle size={14} />
        {t("home.feed.see_day_in_life")}
      </a>
    </article>
  );
}

/** Carries the progress/unlock spine — completeness + the next module. */
function UnlockCardView({
  card,
  theme,
}: {
  card: UnlockCard;
  theme: CardTheme;
}) {
  const { t } = useLocale();
  return (
    <article className="rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
            {t("profile.journey.eyebrow")}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-[color:var(--day-ink-2)]">
            {t("home.you.stages_complete")
              .replace("{completed}", String(card.completedCount))
              .replace("{total}", String(card.totalCount))}
          </p>
        </div>
        <span
          className="text-[22px] font-black tabular-nums leading-none"
          style={{ color: theme.clusterInk }}
        >
          {card.completionPct}%
        </span>
      </div>

      <span className="mt-3 block h-2 overflow-hidden rounded-full bg-[color:var(--day-inset)]">
        <span
          className="block h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(6, card.completionPct)}%`,
            background: theme.clusterColor,
          }}
        />
      </span>

      <div className="mt-3.5 flex items-center gap-3 rounded-2xl border border-[color:var(--day-line)] bg-[color:var(--day-inset)] p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[rgba(43,36,28,0.06)] text-[color:var(--day-ink-3)]">
          <Lock size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-[color:var(--day-ink)]">
            {card.moduleName}
          </p>
          <p className="truncate text-[11.5px] text-[color:var(--day-ink-3)]">
            {card.tagline}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[color:var(--day-line)] px-2 py-1 text-[10px] font-bold text-[color:var(--day-ink-3)]">
          {card.durationLabel}
        </span>
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold text-[color:var(--day-ink-3)]">
        {t("home.feed.unlock_footer")}
      </p>
    </article>
  );
}

function InsightCardView({ card }: { card: InsightCard }) {
  return (
    <article className="relative overflow-hidden rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <span
        aria-hidden
        className="absolute inset-y-4 left-0 w-1 rounded-r-full"
        style={{ background: ACCENT_VIVID.violet }}
      />
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
        {card.eyebrow}
      </p>
      <h3
        className="mt-1 text-[16px] font-black leading-tight"
        style={{ color: ACCENT_INK.violet }}
      >
        {card.title}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--day-ink-2)]">
        {card.body}
      </p>
    </article>
  );
}

function IntersectionCardView({
  card,
  theme,
}: {
  card: IntersectionCard;
  theme: CardTheme;
}) {
  return (
    <article className="rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <div className="flex items-center gap-2">
        <span
          className="grid size-8 place-items-center rounded-full"
          style={{
            background: rgbaFromHex(theme.clusterColor, 0.14),
            color: theme.clusterInk,
          }}
        >
          <Shuffle size={16} />
        </span>
        <h3 className="text-[14px] font-black text-[color:var(--day-ink)]">
          {card.title}
        </h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.paths.map((path) => (
          <span
            key={path}
            className="rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-inset)] px-2.5 py-1 text-[11px] font-semibold leading-none text-[color:var(--day-ink-2)]"
          >
            {path}
          </span>
        ))}
      </div>
    </article>
  );
}

/** Where a prompt bubble should link to start the chat with that exact
 * question as the opening message. */
function promptHref(prompt: string): string {
  return `/kai?prompt=${encodeURIComponent(prompt)}`;
}

/** A seeded set of chat openers — looks like the start of a conversation
 * with Kai, one bubble per suggested question. The lead prompt uses
 * `card.href` when it's a real proactive moment (e.g. resuming a
 * conversation); every other bubble always starts a fresh chat seeded
 * with its exact text. */
function AskKaiCardView({ card, theme }: { card: AskKaiCard; theme: CardTheme }) {
  const { t } = useLocale();
  const leadHref = card.href ?? promptHref(card.prompt);

  return (
    <div
      className="overflow-hidden rounded-[22px] border border-[color:var(--day-line)] p-4 shadow-[var(--day-shadow-card)]"
      style={{
        background:
          "linear-gradient(135deg, rgba(110,72,228,0.12), rgba(244,198,96,0.12)), var(--day-card)",
      }}
    >
      <Link href={leadHref} className="group flex items-center gap-3">
        <span className="size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[color:var(--day-card)] shadow-[var(--day-shadow-card)]">
          {/* The "video Kai" — poster frame of the assessment-host video.
              eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kai/kai-poster.png"
            alt="Kai"
            width={56}
            height={56}
            className="size-full object-cover"
            style={{ objectPosition: "50% 26%" }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
            <Sparkles size={11} style={{ color: theme.clusterInk }} />
            {t("home.feed.ask_kai_eyebrow")}
          </p>
          <p className="text-[13.5px] font-black text-[color:var(--day-ink)]">
            {t("home.feed.ask_kai_title")}
          </p>
        </div>
        <ArrowRight
          size={16}
          className="shrink-0 text-[color:var(--day-ink-3)] transition group-hover:translate-x-0.5"
        />
      </Link>

      <div className="mt-3 grid gap-2">
        <Link
          href={leadHref}
          className="rounded-2xl rounded-tl-md border border-[color:var(--day-line)] bg-[color:var(--day-elevated)] px-3 py-2.5 text-[12.5px] font-medium leading-snug text-[color:var(--day-ink-2)] transition hover:border-[color:var(--day-line-strong)]"
        >
          “{card.prompt}”
        </Link>
        {card.morePrompts.map((prompt) => (
          <Link
            key={prompt}
            href={promptHref(prompt)}
            className="rounded-2xl rounded-tl-md border border-[color:var(--day-line)] bg-[color:var(--day-elevated)] px-3 py-2.5 text-[12.5px] font-medium leading-snug text-[color:var(--day-ink-2)] transition hover:border-[color:var(--day-line-strong)]"
          >
            “{prompt}”
          </Link>
        ))}
      </div>
    </div>
  );
}
