import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { CustomQuestionsEditor } from "@/components/admin/CustomQuestionsEditor";
import PageHeader from "@/components/admin/PageHeader";
import { VersionGovernancePanel } from "@/components/admin/VersionGovernancePanel";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { loadAssessmentWorkspace } from "@/lib/admin/assessment-workspace.server";
import { getContentVersion } from "@/lib/admin/content";
import { getVersionResponseStats } from "@/lib/admin/responses";

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

  const { categories, questions, readiness } = await loadAssessmentWorkspace(
    assessment.id,
    versionId,
    assessment.supported_languages,
  );

  const title = assessment.name.en ?? version.label;
  const editable = !version.is_active;
  const responseStats = editable
    ? null
    : await getVersionResponseStats(version.id);

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 text-[13px] text-adm-ink-muted"
      >
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
        description="Write each question, then connect its answers to the result they support."
      />

      <AssessmentTabs
        versionId={versionId}
        active="questions"
        readiness={readiness}
      />

      {editable ? (
        <CustomQuestionsEditor
          versionId={versionId}
          categories={categories}
          questions={questions}
          supportedLanguages={assessment.supported_languages}
        />
      ) : (
        responseStats && (
          <VersionGovernancePanel
            label={version.label}
            createdAt={version.created_at}
            responseCount={responseStats.total}
            completedCount={responseStats.completed}
            questionCount={questions.length}
          />
        )
      )}
    </>
  );
}
