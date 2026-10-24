"use client";

import type { ReportModel } from "@/lib/core-v2/report-model";
import type { SectionId } from "@/lib/core-v2/report-plan";
import { FlagNote } from "./ClosingSections";
import {
  AboutSection,
  NextStepsSection,
  ParentsSection,
} from "./v3/ClosingSections";
import { GlanceSection, OpeningSection } from "./v3/OpeningSections";
import { CuriositySection, MeaningSection } from "./v3/StorySections";

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
      return <OpeningSection generatedAt={generatedAt} onExplore={() => onNavigate("S2")} />;
    case "S2":
      return <GlanceSection model={model} generatedAt={generatedAt} />;
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
