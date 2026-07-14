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
      className="group rounded-[20px] border border-carbon/8 bg-carbon/[0.03] px-3.5 py-3 open:bg-carbon/[0.045]"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) onOpen?.();
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span className="text-[12.5px] font-black uppercase tracking-[0.1em] text-carbon/55">
          {t("kai.panel.grounding_title")}
        </span>
        <ChevronDown
          size={15}
          className="shrink-0 text-carbon/40 transition group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 border-t border-carbon/8 pt-3">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-carbon/40">
          {t("kai.panel.grounding_intro")}
        </p>
        <ul className="grid gap-2">
          {rows.map(([Icon, label, value]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 text-[12.5px]"
            >
              <span className="flex items-center gap-2 text-carbon/55">
                <Icon size={20} />
                {label}
              </span>
              <span className="font-bold text-carbon">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
