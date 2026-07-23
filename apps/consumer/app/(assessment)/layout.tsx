import type { ReactNode } from "react";
import { AssessmentAudioProvider } from "@/components/assessment/AssessmentAudioProvider";
import { AssessmentChrome } from "@/components/assessment/AssessmentChrome";
import { LanguageGate } from "@/components/i18n/LanguageGate";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { loadAttemptAssessmentContent } from "@/lib/assessment/content.server";

export default async function AssessmentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const content = await loadAttemptAssessmentContent();

  return (
    <LocaleProvider>
      <LanguageGate>
        <AssessmentAudioProvider>
          <AssessmentChrome questions={content.questions}>
            {children}
          </AssessmentChrome>
        </AssessmentAudioProvider>
      </LanguageGate>
    </LocaleProvider>
  );
}
