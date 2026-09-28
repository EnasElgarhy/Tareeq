"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ActionPlanIcon, KaiIcon, ResearchIcon } from "@/components/brand/DomainIcons";
import type { StringKey } from "@/lib/i18n/strings";
import { proactiveMomentCtaKey, proactiveMomentHref, renderProactiveMomentText } from "@/lib/kai/proactive/proactive-render";
import type { KaiProactiveMoment } from "@/lib/kai/proactive/proactive-types";

/** One icon + tint per moment kind — the same warm/violet/mint palette
 * used everywhere else (SnapshotTile, ModuleRow, Achievements), each
 * kind gets its own color instead of a single repeated tint, so the
 * card reads as "this specific thing," not a generic template.
 * "compass_highlight" never actually renders via this component (it
 * overrides KaiInsightCard instead) but still needs a case to stay
 * exhaustive. Icon components come from DomainIcons (a real .tsx file)
 * — kept in this component rather than the plain-.ts proactive-render
 * module, which can't safely import JSX-bearing files. */
const MOMENT_VISUALS: Record<KaiProactiveMoment["kind"], { Icon: typeof KaiIcon; background: string }> = {
  resume_conversation: {
    Icon: KaiIcon,
    background: "linear-gradient(135deg, rgba(157,127,240,0.18), rgba(110,72,228,0.07))",
  },
  resume_topic: {
    Icon: ResearchIcon,
    background: "linear-gradient(135deg, rgba(244,198,96,0.2), rgba(253,231,168,0.08))",
  },
  next_step: {
    Icon: ActionPlanIcon,
    background: "linear-gradient(135deg, rgba(111,224,192,0.2), rgba(111,224,192,0.07))",
  },
  compass_highlight: {
    Icon: KaiIcon,
    background: "linear-gradient(135deg, rgba(255,107,61,0.18), rgba(255,165,61,0.07))",
  },
};

/**
 * Renders one KaiProactiveMoment as a card — shared by Overview and the
 * Kai tab so "Kai's one recommended action" looks and behaves the same
 * wherever it shows up, per lib/kai/proactive/proactive-render.ts.
 */
export function ProactiveMomentCard({
  moment,
  eyebrowKey,
  onCtaClick,
  onAction,
}: {
  moment: KaiProactiveMoment;
  eyebrowKey: StringKey;
  onCtaClick: () => void;
  /** When provided, the CTA fires this in-page action instead of
   * navigating — for callers (like the Kai tab itself) that are already
   * on the destination and just need to trigger the local handler. */
  onAction?: () => void;
}) {
  const { t } = useLocale();
  const { Icon, background } = MOMENT_VISUALS[moment.kind];

  return (
    <div className="daybreak-story-card rounded-story p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background }}>
          <Icon size={18} />
        </span>
        <p className="daybreak-eyebrow text-[color:var(--day-ink-3,#675d4e)]">{t(eyebrowKey)}</p>
      </div>
      <p className="daybreak-heading mt-2 text-[16px] leading-snug text-[color:var(--day-ink,#2a2118)]">
        {renderProactiveMomentText(moment, t)}
      </p>
      {onAction ? (
        <button
          type="button"
          onClick={() => {
            onCtaClick();
            onAction();
          }}
          className="daybreak-primary-action mt-3 w-full"
        >
          {t(proactiveMomentCtaKey(moment))}
        </button>
      ) : (
        <Link
          href={proactiveMomentHref(moment)}
          onClick={onCtaClick}
          className="daybreak-primary-action mt-3 w-full"
        >
          {t(proactiveMomentCtaKey(moment))}
        </Link>
      )}
    </div>
  );
}
