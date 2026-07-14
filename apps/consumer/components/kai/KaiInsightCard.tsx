"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import type { KaiAssessmentContext } from "@/lib/kai/types";

/**
 * Kai's opening insight — deterministic, template-based copy for Phase 1
 * (no Gemini call exists yet; see CONSUMER_2_ARCHITECTURE.md §4/§6 for
 * where a real generated opener plugs in later). Every fact used here is
 * already visible to the user elsewhere in their Career Compass — this is
 * framing, not new information.
 */
function buildOpeningInsight(assessment: KaiAssessmentContext, locale: string): string {
  const hasNuance = assessment.topClusters.length > 1;

  if (locale === "ar") {
    return hasNuance
      ? `كنت أراجع بوصلتك المهنية. شيء واحد لفت انتباهي: "${assessment.primaryCluster}" هو اتجاهك الأقوى، لكن أسلوب عملك كـ"${assessment.archetype}" يوحي بأنك قد لا تستمتع بكل أنواع الأدوار في هذا المسار.`
      : `كنت أراجع بوصلتك المهنية. شيء واحد لفت انتباهي: "${assessment.primaryCluster}" هو اتجاهك الأقوى، ومحرك "${assessment.rewardDriver}" يفسّر جزءاً كبيراً من سبب استمرار هذا الاهتمام.`;
  }

  return hasNuance
    ? `I've been looking at your Career Compass. One thing stood out: ${assessment.primaryCluster} is your strongest direction, but your ${assessment.archetype}-style work suggests you may not enjoy every type of role in that space.`
    : `I've been looking at your Career Compass. One thing stood out: ${assessment.primaryCluster} is your strongest direction, and your ${assessment.rewardDriver} driver is a big part of why it keeps pulling at you.`;
}

export function KaiInsightCard({
  assessment,
  onContinue,
  overrideText,
}: {
  assessment: KaiAssessmentContext | null;
  /** Shown only when provided — the Kai tab itself has no reason to
   * link back to Kai, but the Overview dashboard does. */
  onContinue?: () => void;
  /** When the proactive layer's moment for this visit IS an insight
   * (kind "compass_highlight" — see lib/kai/proactive/), it replaces
   * this card's own static template instead of showing both. Ignored in
   * the no-assessment empty state, which has nothing to override. */
  overrideText?: string;
}) {
  const { t, locale } = useLocale();

  if (!assessment) {
    return (
      <section className="rounded-[24px] border border-carbon/8 bg-white p-4 shadow-[0_10px_28px_rgba(43,36,28,0.06)]">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-carbon ring-1 ring-carbon/10">
            <div style={{ transform: "translateY(4px)" }}>
              <KaiChromaVideo src="/kai/kai-mentor-green.mp4" size={56} playing={false} restTime={2.3} />
            </div>
          </div>
          <div className="grid min-w-0 flex-1 gap-2">
            <p className="text-[15px] font-black leading-tight text-carbon">{t("kai.panel.empty_title")}</p>
            <p className="text-[13.5px] leading-relaxed text-carbon/65">{t("kai.panel.empty_body")}</p>
            <Link href="/start" className="btn-v2 btn-v2--primary mt-1 w-fit" data-size="md">
              {t("kai.panel.empty_cta")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[24px] shadow-[0_24px_48px_rgba(43,36,28,0.08)]">
      {/* The one place on Overview that leans fully into the brand's
          aurora gradient, per the redesign brief — everywhere else on
          this screen the gradient stays a small accent, never a fill. */}
      <div className="relative overflow-hidden p-4 pb-8" style={{ background: "var(--aurora)" }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 78% -10%, rgba(255,255,255,0.35), transparent 55%)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-white/55 bg-carbon/28 shadow-[0_8px_20px_rgba(20,16,31,0.25)]">
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full border-[1.5px] border-white/50"
            />
            <div style={{ transform: "translateY(3px) scale(1.15)" }}>
              <KaiChromaVideo src="/kai/kai-mentor-green.mp4" size={50} playing={false} restTime={2.3} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-black text-white">{t("profile.tab.kai")}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-carbon/62">{t("kai.panel.noticed_label")}</p>
          </div>
        </div>
      </div>

      <div className="-mt-5 rounded-t-[22px] bg-paper p-4">
        <p className="text-[14px] leading-relaxed text-carbon">{overrideText ?? buildOpeningInsight(assessment, locale)}</p>
        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[13.5px] font-bold text-night shadow-[0_12px_28px_rgba(110,72,228,0.35)]"
            style={{ background: "var(--aurora)" }}
          >
            <Sparkles size={15} />
            {t("kai.panel.continue_cta")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
