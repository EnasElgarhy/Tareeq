import { ContractScreen } from "@/components/assessment/ContractScreen";
import { loadAttemptAssessmentContent } from "@/lib/assessment/content.server";

export default async function ContractPage() {
  const content = await loadAttemptAssessmentContent();
  return (
    <ContractScreen
      firstQuestionAudioId={
        content.questions.find((q) => q.pillar !== 0)?.externalId ?? null
      }
      versionId={content.versionId}
    />
  );
}
