import { Suspense } from "react";
import { AssessmentStart } from "@/components/assessment/AssessmentStart";
import { totalAssessmentQuestions } from "@/lib/assessment/questions";

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <AssessmentStart totalQuestions={totalAssessmentQuestions} />
    </Suspense>
  );
}
