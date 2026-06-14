import type { ReactNode } from "react";
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
        <AssessmentChrome totalQuestions={totalAssessmentQuestions}>
          {children}
        </AssessmentChrome>
      </LanguageGate>
    </LocaleProvider>
  );
}
