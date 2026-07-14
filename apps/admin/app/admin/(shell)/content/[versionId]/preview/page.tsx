import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { AssessmentPreviewClient } from "@/components/admin/AssessmentPreviewClient";
import PageHeader from "@/components/admin/PageHeader";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;

  const version = await getContentVersion(versionId);
  if (!version) notFound();

  const assessment = await getAssessmentForVersion(versionId);
  if (!assessment || assessment.assessment_type !== "custom") {
    redirect(`/admin/content/${versionId}`);
  }

  const [categories, questions] = await Promise.all([
    listAssessmentCategories(assessment.id),
    listCustomQuestions(versionId),
  ]);

  const title = assessment.name.en ?? version.label;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-adm-ink-muted">
        <Link
          href="/admin/content"
          className="font-semibold text-adm-violet hover:text-adm-deep"
        >
          Content
        </Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <Link
          href={`/admin/content/${versionId}/custom`}
          className="font-semibold text-adm-violet hover:text-adm-deep"
        >
          {title}
        </Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span className="text-adm-ink-soft">Preview</span>
      </nav>

      <PageHeader
        kicker="Student experience preview"
        title={title}
        description="Review how the assessment appears to students. Answers are not saved."
      />

      <AssessmentTabs versionId={versionId} active="preview" />

      <AssessmentPreviewClient
        questions={questions}
        categories={categories}
        supportedLanguages={assessment.supported_languages}
        assessmentName={title}
      />
    </>
  );
}
