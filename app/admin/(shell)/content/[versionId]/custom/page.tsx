import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { CustomCategoriesPanel } from "@/components/admin/CustomCategoriesPanel";
import { CustomQuestionsEditor } from "@/components/admin/CustomQuestionsEditor";
import PageHeader from "@/components/admin/PageHeader";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";

export const dynamic = "force-dynamic";

export default async function CustomEditorPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;

  const version = await getContentVersion(versionId);
  if (!version) notFound();

  const assessment = await getAssessmentForVersion(versionId);
  // Not a catalog/custom assessment → fall back to the CORE editor.
  if (!assessment || assessment.assessment_type !== "custom") {
    redirect(`/admin/content/${versionId}`);
  }

  const [categories, questions] = await Promise.all([
    listAssessmentCategories(assessment.id),
    listCustomQuestions(versionId),
  ]);

  const title = assessment.name.en ?? version.label;
  const editable = !version.is_active;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-adm-ink-muted">
        <Link
          href="/admin/content"
          className="font-semibold text-adm-violet hover:text-adm-deep"
        >
          Content
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span className="text-adm-ink-soft">{title}</span>
      </nav>

      <PageHeader
        kicker={`Custom assessment · ${assessment.supported_languages.join(" / ")}`}
        title={title}
        description="Add bilingual questions and map each answer to a scoring category."
      />

      <AssessmentTabs versionId={versionId} active="questions" />

      {editable ? (
        <>
          <CustomCategoriesPanel catalogId={assessment.id} categories={categories} />
          <CustomQuestionsEditor
            versionId={versionId}
            categories={categories}
            questions={questions}
          />
        </>
      ) : (
        <p className="rounded-adm-md border border-adm-gold/50 bg-adm-gold/15 px-4 py-3 text-[13px] font-medium text-adm-gold-ink">
          This version is live and read-only. Clone it to a draft to make changes.
        </p>
      )}
    </>
  );
}
