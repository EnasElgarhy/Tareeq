"use client";

import { useEffect, useState } from "react";
import { ResultsScreen } from "@/components/assessment/ResultsScreen";
import { assessmentQuestions } from "@/lib/assessment/questions";
import { buildFallbackReport } from "@/lib/results/framework";
import {
  writeGeneratedReport,
  writeResultRegistration,
} from "@/lib/results/storage";
import { computeScore } from "@/lib/scoring";

/**
 * Internal preview for the results screen. Seeds a real, computed report
 * (so it always matches the current schema) into localStorage, then
 * renders the live ResultsScreen. Lets us review and iterate on the
 * results layout without walking through the whole assessment.
 *
 * Not linked in the live flow.
 */
export function ResultsPreview() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Deterministic sample answers — first option of each question.
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
  return <ResultsScreen />;
}
