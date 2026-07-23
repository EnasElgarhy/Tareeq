import { Suspense } from "react";
import { AssessmentStart } from "@/components/assessment/AssessmentStart";
import { loadActiveAssessmentContent } from "@/lib/assessment/content.server";

export default async function StartPage() {
  const content = await loadActiveAssessmentContent();

  return (
    <Suspense fallback={null}>
      <AssessmentStart
        totalQuestions={content.questions.length}
        versionId={content.versionId}
        versionLabel={content.versionLabel}
      />
    </Suspense>
  );
}
