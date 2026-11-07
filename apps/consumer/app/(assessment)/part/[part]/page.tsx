import { notFound } from "next/navigation";
import { PartIntroScreen } from "@/components/assessment/FlowScreens";
import { loadAttemptAssessmentContent } from "@/lib/assessment/content.server";
import { firstQuestionOfPart } from "@/lib/assessment/flow";

export default async function PartPage({ params }: { params: Promise<{ part: string }> }) {
  const { part: rawPart } = await params;
  const part = Number.parseInt(rawPart, 10);
  if (![1, 2, 3, 4].includes(part)) notFound();

  const content = await loadAttemptAssessmentContent();
  const firstIndex = firstQuestionOfPart(part, content.questions);
  const first = content.questions[firstIndex];
  if (!first) notFound();

  return (
    <PartIntroScreen
      part={part}
      firstQuestionIndex={firstIndex}
      firstAudioId={first.externalId}
      versionId={content.versionId}
    />
  );
}
