"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  ArchetypeMarkIcon,
  CareerCompassIcon,
  ConfidenceMarkIcon,
  DriverMarkIcon,
  EcosystemMarkIcon,
} from "@/components/brand/DomainIcons";
import type { KaiAssessmentContext } from "@/lib/kai/types";

/**
 * "Why this?" transparency panel — every Kai recommendation traces back to
 * a real, already-user-facing field from the deterministic result. This is
 * the visible half of that promise; lib/kai/context.ts is the enforced half.
 */
export function KaiGroundingCard({
  assessment,
  onOpen,
}: {
  assessment: KaiAssessmentContext;
  onOpen?: () => void;
}) {
  const { t } = useLocale();

  const rows: Array<
    [ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>, string, string]
  > = [
    [CareerCompassIcon, t("kai.panel.grounding.primary_cluster"), assessment.primaryCluster],
    [ArchetypeMarkIcon, t("kai.panel.grounding.archetype"), assessment.archetype],
    [DriverMarkIcon, t("kai.panel.grounding.reward_driver"), assessment.rewardDriver],
    [EcosystemMarkIcon, t("kai.panel.grounding.ecosystem"), assessment.ecosystemFit],
    [ConfidenceMarkIcon, t("kai.panel.grounding.confidence"), `${assessment.confidence}%`],
  ];

  return (
    <details
      className="daybreak-story-card rounded-story-alt group px-4 py-3.5 open:bg-[color:var(--day-inset)]"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) onOpen?.();
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span className="daybreak-eyebrow text-[color:var(--day-ink-2)]">
          {t("kai.panel.grounding_title")}
        </span>
        <ChevronDown
          size={15}
          className="shrink-0 text-[color:var(--day-ink-3)] transition group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 border-t border-[color:var(--day-line)] pt-3">
        <p className="daybreak-eyebrow mb-2 text-[color:var(--day-ink-3)]">
          {t("kai.panel.grounding_intro")}
        </p>
        <ul className="grid gap-2">
          {rows.map(([Icon, label, value]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 text-[12.5px]"
            >
              <span className="flex items-center gap-2 text-[color:var(--day-ink-2)]">
                <Icon size={20} />
                {label}
              </span>
              <span className="font-bold text-[color:var(--day-ink)]">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
