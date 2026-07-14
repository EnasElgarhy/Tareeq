import type { ReactNode } from "react";
import { AssessmentChrome } from "@/components/assessment/AssessmentChrome";
import { totalAssessmentQuestions } from "@/lib/assessment/questions";

export default function AssessmentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AssessmentChrome totalQuestions={totalAssessmentQuestions}>
      {children}
    </AssessmentChrome>
  );
}
