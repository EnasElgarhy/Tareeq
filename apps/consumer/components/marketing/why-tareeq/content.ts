import type { StringKey } from "@/lib/i18n/strings";
import type { Audience } from "../whyTareeqContent";

export interface WhyReason {
  title: StringKey;
  body: StringKey;
}

export interface WhyPanelCopy {
  headline: StringKey;
  description: StringKey;
  reasons: readonly WhyReason[];
}

const REASON_COUNT = 4;

const panelCopy = (audience: Audience): WhyPanelCopy => ({
  headline: `marketing.whyPanel.${audience}.headline` as StringKey,
  description: `marketing.whyPanel.${audience}.desc` as StringKey,
  reasons: Array.from({ length: REASON_COUNT }, (_, i) => ({
    title: `marketing.whyPanel.${audience}.${i + 1}_title` as StringKey,
    body: `marketing.whyPanel.${audience}.${i + 1}_body` as StringKey,
  })),
});

export const PANEL_COPY: Record<Audience, WhyPanelCopy> = {
  learners: panelCopy("learners"),
  parents: panelCopy("parents"),
};
