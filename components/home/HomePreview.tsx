"use client";

import { useEffect, useState } from "react";
import { OverviewScreen } from "@/components/home/OverviewScreen";
import { assessmentQuestions } from "@/lib/assessment/questions";
import { buildFallbackReport } from "@/lib/results/framework";
import {
  writeGeneratedReport,
  writeResultRegistration,
} from "@/lib/results/storage";
import { computeScore } from "@/lib/scoring";

/**
 * Internal preview for the Home Overview feed. Seeds a real, computed
 * report into local storage (so it always matches the live schema), then
 * renders the live OverviewScreen. Not linked in the live flow.
 */
export function HomePreview() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const answers: Record<string, string> = {};
    for (const q of assessmentQuestions) {
      const letter = q.options[0]?.letter;
      if (letter) answers[q.externalId] = letter;
    }

    const result = computeScore(answers, assessmentQuestions);
    const report = buildFallbackReport({
      result,
      name: "Sara",
      fallbackReason: "Preview seed.",
    });

    const now = new Date().toISOString();
    writeResultRegistration({
      name: "Sara",
      email: "sara@example.com",
      verifiedAt: now,
      consent: {
        generalResearch: true,
        longitudinalFollowup: false,
        universitySharing: false,
        ageGate: "adult",
        recordedAt: now,
        consentVersion: "v1",
        language: "en",
      },
    });
    writeGeneratedReport(report);
    setReady(true);
  }, []);

  if (!ready) return null;
  return <OverviewScreen />;
}
