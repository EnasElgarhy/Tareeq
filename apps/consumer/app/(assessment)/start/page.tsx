import { Suspense } from "react";
import { AssessmentStart } from "@/components/assessment/AssessmentStart";
import { loadActiveAssessmentContent } from "@/lib/assessment/content.server";

export default async function StartPage() {
  const content = await loadActiveAssessmentContent();

  return (
    <Suspense fallback={null}>
      <AssessmentStart
        totalQuestions={content.questions.length}
        assessmentQuestions={content.questions.filter((q) => q.pillar !== 0).length}
        versionId={content.versionId}
        versionLabel={content.versionLabel}
      />
    </Suspense>
  );
}
