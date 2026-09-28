import { notFound } from "next/navigation";
import { QuestionScreen } from "@/components/assessment/QuestionScreen";
import { loadAttemptAssessmentContent } from "@/lib/assessment/content.server";
import {
  menaCountries,
  normalizeQuestionIndex,
  restOfWorldCountries,
} from "@/lib/assessment/questions";

type QuestionPageProps = {
  params: Promise<{
    index: string;
  }>;
};

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { index: rawIndex } = await params;
  const content = await loadAttemptAssessmentContent();
  const index = normalizeQuestionIndex(rawIndex, content.questions.length);

  if (index === null) {
    notFound();
  }

  const question = content.questions[index];
  if (!question) notFound();

  return (
    <QuestionScreen
      question={question}
      questions={content.questions}
      index={index}
      totalQuestions={content.questions.length}
      versionId={content.versionId}
      versionLabel={content.versionLabel}
      menaCountries={menaCountries}
      restOfWorldCountries={restOfWorldCountries}
    />
  );
}
