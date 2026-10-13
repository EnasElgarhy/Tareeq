"use client";

import type { ReportModel } from "@/lib/core-v2/report-model";
import type { SectionId } from "@/lib/core-v2/report-plan";
import { CuriositySection, MeaningSection } from "./CareerSections";
import {
  AboutSection,
  FlagNote,
  NextStepsSection,
  ParentsSection,
} from "./ClosingSections";
import { AtAGlance, BeforeYouRead } from "./GlanceSections";

/** Maps a section id to its screen. */
export function ReportSection({
  section,
  model,
  generatedAt,
  onNavigate,
}: {
  section: SectionId;
  model: ReportModel;
  generatedAt?: string;
  onNavigate(section: SectionId): void;
}) {
  switch (section) {
    case "FLAG-NOTE":
      return <FlagNote />;
    case "S1":
      return <BeforeYouRead model={model} onExplore={() => onNavigate("S2")} />;
    case "S2":
      return <AtAGlance model={model} generatedAt={generatedAt} />;
    case "S3":
      return <CuriositySection model={model} />;
    case "S4":
      return <MeaningSection model={model} />;
    case "S5":
      return <NextStepsSection model={model} />;
    case "S6":
      return <ParentsSection />;
    case "S7":
      return <AboutSection />;
  }
}
