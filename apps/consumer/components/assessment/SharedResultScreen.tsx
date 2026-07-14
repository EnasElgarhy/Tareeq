"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ShareRevealIllustration } from "@/components/brand/ShareRevealIllustration";
import { ReportBody } from "@/components/assessment/report-parts";
import { LocaleProvider, useLocale } from "@/components/i18n/LocaleProvider";
import { prefersReducedMotion } from "@/lib/audio/ui-sounds";
import type { Locale } from "@/lib/i18n/locale";
import type { PersonalizedCompassReport } from "@/lib/results/types";

interface SharedResultScreenProps {
  name: string | null;
  locale: Locale;
  report: PersonalizedCompassReport;
}

const REVEAL_DELAY_MS = 5000;
const REVEAL_DELAY_REDUCED_MS = 900;

/** Splits a `t()` template around a literal "{name}" placeholder so the name
 *  itself can get its own emphasis styling — works regardless of where the
 *  placeholder falls in the sentence, which varies by language/word order. */
function splitAroundName(template: string, name: string | null): [string, string] {
  if (!name) return [template, ""];
  const [before, after] = template.split("{name}");
  return [before ?? "", after ?? ""];
}

/**
 * Read-only view of someone else's Career Compass, opened via a `/share/[token]`
 * link. Renders the SAME full report body as the owner's own /results screen
 * (via the shared `ReportBody`) — a cold visitor gets the complete picture,
 * not a teaser — wrapped in a context banner (whose result this is, and what
 * Tareeq even is, since a visitor may be landing here having never used the
 * app) and a CTA to take their own assessment instead of the owner-only
 * actions (Share, Save, Parent view, Start over).
 *
 * Renders in the REPORT's own locale (not the visitor's) — the narrative
 * content was generated once in that locale, so mixing chrome and content
 * languages here would read as broken. `LocaleProvider`'s `initialLocale`
 * forces this regardless of whatever locale the visitor's browser has
 * stored from browsing the app before.
 */
export function SharedResultScreen({ name, locale, report }: SharedResultScreenProps) {
  return (
    <LocaleProvider initialLocale={locale}>
      <SharedResultScreenInner name={name} report={report} />
    </LocaleProvider>
  );
}

function SharedResultScreenInner({
  name,
  report,
}: {
  name: string | null;
  report: PersonalizedCompassReport;
}) {
  const { t, locale, dir } = useLocale();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const delay = prefersReducedMotion() ? REVEAL_DELAY_REDUCED_MS : REVEAL_DELAY_MS;
    const timer = window.setTimeout(() => setRevealed(true), delay);
    return () => window.clearTimeout(timer);
  }, []);

  if (!revealed) {
    return <ShareIntroReveal name={name} onSkip={() => setRevealed(true)} />;
  }

  const [ownerBefore, ownerAfter] = splitAroundName(
    name ? t("share.owner_heading") : t("share.owner_heading_fallback"),
    name,
  );

  return (
    <main
      dir={dir}
      className={`relative flex min-h-dvh w-full flex-col items-center overflow-hidden surface-night text-sand ${
        locale === "ar" ? "font-arabic" : ""
      }`}
    >
      <div className="absolute inset-0 bg-night-stars opacity-80 pointer-events-none" />

      <div className="anim-screen-enter relative z-10 flex w-full max-w-[640px] flex-1 flex-col gap-4 px-5 pb-10 pt-8">
        <BrandHeader />

        <div className="text-center">
          <h1 className="text-[22px] font-black leading-tight text-sand">
            {ownerBefore}
            {name ? <NameEmphasis>{name}</NameEmphasis> : null}
            {ownerAfter}
          </h1>
          <p className="mx-auto mt-1.5 max-w-[44ch] text-[13px] leading-snug text-sand/60">
            {t("share.intro_tagline")}
          </p>
        </div>

        <ReportBody report={report} t={t} />

        <section className="mt-2 grid gap-2 rounded-[24px] border border-gold/25 bg-gold/[0.08] p-4 text-center">
          <h3 className="text-[16px] font-black text-sand">{t("share.cta_title")}</h3>
          <Link
            href="/start"
            className="btn-v2 btn-v2--primary mx-auto w-full justify-center"
            data-size="lg"
          >
            <Sparkles size={16} />
            {t("share.cta_button")}
          </Link>
          <p className="text-[11px] font-semibold text-sand/45">{t("share.cta_meta")}</p>
        </section>

        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-sand/30">
          {t("share.footer_brand")}
        </p>
      </div>
    </main>
  );
}

/** The animated "someone shared their Compass with you" beat that plays
 *  before the report itself appears — gives the link somewhere to land
 *  emotionally (whose result this is, what's coming) instead of dumping a
 *  dense report on a cold visitor with zero framing. Tappable/clickable
 *  anywhere to skip straight to the report. */
function ShareIntroReveal({ name, onSkip }: { name: string | null; onSkip: () => void }) {
  const { t, dir } = useLocale();
  const [before, after] = splitAroundName(
    name ? t("share.intro_reveal_heading") : t("share.intro_reveal_heading_fallback"),
    name,
  );
  const reduced = prefersReducedMotion();

  return (
    <main
      dir={dir}
      onClick={onSkip}
      className="anim-screen-enter relative flex min-h-dvh w-full cursor-pointer flex-col items-center justify-center overflow-hidden surface-night text-sand"
    >
      <div className="absolute inset-0 bg-night-stars opacity-80 pointer-events-none" />
      <span
        aria-hidden="true"
        className="anim-aura-bloom pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(244,198,96,0.28), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-5 px-5 text-center">
        <BrandHeader />

        <div className="anim-avatar-in flex h-[200px] w-[200px] items-center justify-center">
          <ShareRevealIllustration size={200} />
        </div>

        <div>
          <h1 className="text-[22px] font-black leading-tight text-sand">
            {before}
            {name ? <NameEmphasis>{name}</NameEmphasis> : null}
            {after}
          </h1>
          <p className="mt-2 text-[13px] leading-snug text-sand/60">
            {t("share.intro_reveal_subtitle")}
          </p>
        </div>

        {!reduced ? (
          <span className="block h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-sand/12">
            <span
              className="anim-reveal-progress block h-full rounded-full bg-grad-warm"
              style={{ animationDuration: `${REVEAL_DELAY_MS}ms` }}
            />
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSkip();
          }}
          className="text-[11px] font-semibold text-sand/40 underline-offset-4 transition hover:text-sand/70 hover:underline"
        >
          {t("share.intro_skip")}
        </button>
      </div>
    </main>
  );
}

function NameEmphasis({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-grad-warm"
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontVariationSettings: '"SOFT" 100, "opsz" 144',
      }}
    >
      {children}
    </span>
  );
}

function BrandHeader() {
  return (
    <header className="flex items-center justify-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-block size-6 bg-aurora"
        style={{
          WebkitMaskImage: "url('/logo/tareeq-mark.svg')",
          maskImage: "url('/logo/tareeq-mark.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <span className="text-[16px] font-bold leading-none tracking-[-0.025em] lowercase text-sand">
        tareeq
      </span>
    </header>
  );
}

/** Shown when a `/share/[token]` link doesn't resolve to a result — expired,
 *  malformed, or removed. Locale falls back to the visitor's own preference
 *  (no report to derive one from), so this one DOES read from storage. */
export function SharedResultNotFound({ locale }: { locale?: Locale }) {
  return (
    <LocaleProvider initialLocale={locale}>
      <SharedResultNotFoundInner />
    </LocaleProvider>
  );
}

function SharedResultNotFoundInner() {
  const { t, dir } = useLocale();

  return (
    <main
      dir={dir}
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden surface-night text-sand"
    >
      <div className="absolute inset-0 bg-night-stars opacity-80 pointer-events-none" />
      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-5 px-5 text-center">
        <BrandHeader />
        <div>
          <h1 className="text-[20px] font-black leading-tight text-sand">
            {t("share.not_found_title")}
          </h1>
          <p className="mt-2 text-[13px] leading-snug text-sand/60">
            {t("share.not_found_body")}
          </p>
        </div>
        <Link href="/start" className="btn-v2 btn-v2--primary w-full justify-center" data-size="lg">
          <Sparkles size={16} />
          {t("share.cta_button")}
        </Link>
      </div>
    </main>
  );
}
