"use client";

import { useEffect, useState } from "react";
import { NoCompassEmptyState } from "@/components/home/NoCompassEmptyState";
import { CompassReportView } from "@/components/home/CompassReportView";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ReportAccessExperience } from "@/components/results/report-access/ReportAccessExperience";
import { trackEvent } from "@/lib/analytics/track";
import { readLocalAssessment } from "@/lib/assessment/progress";
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
  registration: ResultRegistration | null;
}

/**
 * Compass — the report's home inside the app. Locked, it tells the story
 * of what the answers revealed and offers the complete report; unlocked,
 * it is the complete report with its actions. Both read the same local
 * result the assessment stored, so the tab works the moment the user
 * lands here from the analyzing screen.
 */
export function CompassScreen() {
  const { t } = useLocale();
  const [state, setState] = useState<CompassState | null>(null);

  useEffect(() => {
    const report = readGeneratedReport();
    setState({ report, registration: readResultRegistration() });
    if (report) {
      trackEvent("results_viewed", {
        assessmentId: readLocalAssessment()?.assessmentId,
      });
    }
  }, []);

  if (!state) return null;
  if (!state.report) {
    return (
      <NoCompassEmptyState
        title={t("home.compass.empty_title")}
        description={t("home.compass.empty_description")}
      />
    );
  }

  return (
    <section className="flex flex-1 flex-col pb-6">
      <ReportAccessExperience
        report={state.report}
        email={state.registration?.email ?? ""}
      >
        <CompassReportView
          report={state.report}
          studentName={state.registration?.name ?? ""}
        />
      </ReportAccessExperience>
    </section>
  );
}
