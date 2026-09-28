import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { AssessmentPreviewClient } from "@/components/admin/AssessmentPreviewClient";
import { AssessmentReadinessSummary } from "@/components/admin/AssessmentReadinessSummary";
import PageHeader from "@/components/admin/PageHeader";
import { PublishPanel } from "@/components/admin/PublishPanel";
import { loadAssessmentWorkspace } from "@/lib/admin/assessment-workspace.server";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";

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

  const { categories, questions, profiles, rules, strategy, readiness } =
    await loadAssessmentWorkspace(
      assessment.id,
      versionId,
      assessment.supported_languages,
    );

  const title = assessment.name.en ?? version.label;

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
        <Link
          href={`/admin/content/${versionId}/custom`}
          className="font-semibold text-adm-violet hover:text-adm-deep"
        >
          {title}
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span className="text-adm-ink-soft">Preview</span>
      </nav>

      <PageHeader
        kicker="Student experience preview"
        title={title}
        description="Check readiness, test the student experience, and publish when every requirement is complete."
      />

      <AssessmentTabs
        versionId={versionId}
        active="preview"
        readiness={readiness}
      />

      <AssessmentReadinessSummary versionId={versionId} readiness={readiness} />

      <AssessmentPreviewClient
        questions={questions}
        categories={categories}
        supportedLanguages={assessment.supported_languages}
        assessmentName={title}
      />

      <PublishPanel
        catalogId={assessment.id}
        versionId={versionId}
        status={assessment.status}
        strategy={strategy}
        categoryCodes={categories.map((category) => category.code)}
        profiles={profiles.map((profile) => ({
          id: profile.id,
          categoryCode: profile.category_code,
        }))}
        ruleCount={rules.length}
        questionCount={questions.length}
        translationGapCount={readiness.translationGaps.length}
      />
    </>
  );
}
