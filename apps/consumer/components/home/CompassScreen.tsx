"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CoreReportScreen } from "@/components/core-report/CoreReportScreen";
import { NoCompassEmptyState } from "@/components/home/NoCompassEmptyState";
import { CompassReportView } from "@/components/home/CompassReportView";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ReportAccessExperience } from "@/components/results/report-access/ReportAccessExperience";
import { LockedReportStory } from "@/components/results/report-access/story/LockedReportStory";
import { trackEvent } from "@/lib/analytics/track";
import { readLocalAssessment } from "@/lib/assessment/progress";
import { CAREER_BANK } from "@/lib/core-v2/content/career-bank";
import { SAMPLE_BANK, SAMPLE_STUDENT } from "@/lib/core-v2/content/sample";
import { scoreCore } from "@/lib/core-v2/scoring";
import { IS_CORE_PREVIEW_ALLOWED } from "@/lib/core-v2/preview";
import { readCoreReport, type StoredCoreReport } from "@/lib/core-v2/storage";
import {
  readGeneratedReport,
  readResultRegistration,
} from "@/lib/results/storage";
import type {
  PersonalizedCompassReport,
  ResultRegistration,
} from "@/lib/results/types";

interface CompassState {
  report: PersonalizedCompassReport | null;
  coreReport: StoredCoreReport | null;
  registration: ResultRegistration | null;
}

/** Fixed timestamp for the sample report (?preview=core-v2; &access=open skips the paywall). */
const PREVIEW_GENERATED_AT = "2026-10-01T00:00:00.000Z";

/**
 * Compass — the report's home inside the app. Locked, it tells the story
 * of what the answers revealed and offers the complete report; unlocked,
 * it is the complete report with its actions. Both read the same local
 * result the assessment stored, so the tab works the moment the user
 * lands here from the analyzing screen.
 */
export function CompassScreen() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CompassState | null>(null);
  const isPreview =
    IS_CORE_PREVIEW_ALLOWED && searchParams.get("preview") === "core-v2";

  useEffect(() => {
    const report = readGeneratedReport();
    // A real CORE 2.0 report needs the real career bank (file 05) to render.
    const coreReport = CAREER_BANK ? readCoreReport() : null;
    setState({ report, coreReport, registration: readResultRegistration() });
    if (report || coreReport) {
      trackEvent("results_viewed", {
        assessmentId: readLocalAssessment()?.assessmentId,
      });
    }
  }, []);

  if (!state) return null;

  if (isPreview) {
    return (
      <CoreReportScreen
        generatedAt={PREVIEW_GENERATED_AT}
        result={scoreCore(SAMPLE_STUDENT)}
        bank={SAMPLE_BANK}
        isFlagged={false}
        isFlagsLive={false}
        email={state.registration?.email ?? ""}
        preview={{ isUnlocked: searchParams.get("access") === "open" }}
      />
    );
  }

  if (state.coreReport && CAREER_BANK) {
    return (
      <CoreReportScreen
        generatedAt={state.coreReport.generatedAt}
        result={state.coreReport.result}
        bank={CAREER_BANK}
        isFlagged={state.coreReport.isFlagged}
        isFlagsLive={false}
        email={state.registration?.email ?? ""}
      />
    );
  }

  if (!state.report) {
    return (
      <NoCompassEmptyState
        title={t("home.compass.empty_title")}
        description={t("home.compass.empty_description")}
      />
    );
  }

  const { report } = state;
  return (
    <section className="flex flex-1 flex-col pb-6">
      <ReportAccessExperience
        generatedAt={report.generatedAt}
        email={state.registration?.email ?? ""}
        renderLocked={(locked) => (
          <LockedReportStory report={report} {...locked} />
        )}
      >
        <CompassReportView
          report={report}
          studentName={state.registration?.name ?? ""}
        />
      </ReportAccessExperience>
    </section>
  );
}
