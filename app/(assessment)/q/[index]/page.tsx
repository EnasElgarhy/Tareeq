import { notFound } from "next/navigation";
import { QuestionScreen } from "@/components/assessment/QuestionScreen";
import {
  assessmentQuestions,
  getQuestionByIndex,
  menaCountries,
  normalizeQuestionIndex,
  restOfWorldCountries,
  totalAssessmentQuestions,
} from "@/lib/assessment/questions";

type QuestionPageProps = {
  params: Promise<{
    index: string;
  }>;
};

export function generateStaticParams() {
  return assessmentQuestions.map((_, index) => ({
    index: index.toString(),
  }));
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { index: rawIndex } = await params;
  const index = normalizeQuestionIndex(rawIndex);

  if (index === null) {
    notFound();
  }

  const question = getQuestionByIndex(index);

  return (
    <QuestionScreen
      question={question}
      questions={assessmentQuestions}
      index={index}
      totalQuestions={totalAssessmentQuestions}
      menaCountries={menaCountries}
      restOfWorldCountries={restOfWorldCountries}
    />
  );
}
