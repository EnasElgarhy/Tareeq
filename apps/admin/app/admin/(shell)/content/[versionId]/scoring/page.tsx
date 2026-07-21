import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { CustomCategoriesPanel } from "@/components/admin/CustomCategoriesPanel";
import { ResultProfilesPanel } from "@/components/admin/ResultProfilesPanel";
import { RuleBuilder } from "@/components/admin/RuleBuilder";
import { ScoringPreview } from "@/components/admin/ScoringPreview";
import PageHeader from "@/components/admin/PageHeader";
import { loadAssessmentWorkspace } from "@/lib/admin/assessment-workspace.server";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";

export const dynamic = "force-dynamic";

export default async function ScoringPage({
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
        <span className="text-adm-ink-soft">Scoring</span>
      </nav>

      <PageHeader
        kicker="Custom assessment · Results"
        title={title}
        description="Define the possible outcomes first, then choose how answers lead to them."
      />

      <AssessmentTabs
        versionId={versionId}
        active="scoring"
        readiness={readiness}
      />

      <CustomCategoriesPanel
        catalogId={assessment.id}
        categories={categories}
      />

      <ResultProfilesPanel
        catalogId={assessment.id}
        versionId={versionId}
        categories={categories}
        profiles={profiles}
        strategy={strategy}
        supportedLanguages={assessment.supported_languages}
      />

      <RuleBuilder
        catalogId={assessment.id}
        versionId={versionId}
        categories={categories}
        profiles={profiles}
        rules={rules}
        strategy={strategy}
      />

      <ScoringPreview
        questions={questions}
        categories={categories}
        profiles={profiles}
        rules={rules}
        strategy={strategy}
      />
    </>
  );
}
