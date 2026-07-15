import type { ReactNode } from "react";
import { AssessmentAudioProvider } from "@/components/assessment/AssessmentAudioProvider";
import { AssessmentChrome } from "@/components/assessment/AssessmentChrome";
import { LanguageGate } from "@/components/i18n/LanguageGate";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { totalAssessmentQuestions } from "@/lib/assessment/questions";

export default function AssessmentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <LocaleProvider>
      <LanguageGate>
        <AssessmentAudioProvider>
          <AssessmentChrome totalQuestions={totalAssessmentQuestions}>
            {children}
          </AssessmentChrome>
        </AssessmentAudioProvider>
      </LanguageGate>
    </LocaleProvider>
  );
}
