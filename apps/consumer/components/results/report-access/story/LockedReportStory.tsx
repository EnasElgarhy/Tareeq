"use client";

import type { ReportOffer } from "@/lib/payments/report-access";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import { ChapterOneCard } from "./ChapterOneCard";
import { CompassHeroCard } from "./CompassHeroCard";
import { ExploreTimeline } from "./ExploreTimeline";
import { PaywallHeader } from "./PaywallHeader";
import { PaywallSheet } from "./PaywallSheet";
import { RoutesCarousel } from "./RoutesCarousel";

interface LockedReportStoryProps {
  report: PersonalizedCompassReport;
  offer: ReportOffer;
  /** Questions answered in the local attempt; 0 when unknown. */
  answeredCount: number;
  onOpen(): void;
}

/**
 * The locked Compass tab, rebuilt from the Figma frame (node 3:661):
 * the paper header, the night compass card, Chapter 01 open, the route
 * teaser, the locked rail with the frosted offer sheet sliding over it.
 * Payment state, the checkout sheet and analytics stay in
 * ReportAccessExperience; this renders the story and reports one action.
 */
export function LockedReportStory({
  report,
  offer,
  onOpen,
}: LockedReportStoryProps) {
  return (
    <div className="daybreak-reveal flex w-full flex-col">
      <PaywallHeader />
      <CompassHeroCard report={report} />
      <ChapterOneCard report={report} />
      <RoutesCarousel />
      <ExploreTimeline />
      <PaywallSheet offer={offer} onOpen={onOpen} />
    </div>
  );
}
