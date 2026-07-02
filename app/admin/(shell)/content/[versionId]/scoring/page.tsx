import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { PublishPanel } from "@/components/admin/PublishPanel";
import { ResultProfilesPanel } from "@/components/admin/ResultProfilesPanel";
import { RuleBuilder } from "@/components/admin/RuleBuilder";
import { ScoringPreview } from "@/components/admin/ScoringPreview";
import PageHeader from "@/components/admin/PageHeader";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";
import {
  getScoringStrategy,
  listProfileRules,
  listResultProfiles,
} from "@/lib/admin/scoring-content";

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

  const [categories, questions, profiles, rules, strategy] = await Promise.all([
    listAssessmentCategories(assessment.id),
    listCustomQuestions(versionId),
    listResultProfiles(assessment.id),
    listProfileRules(assessment.id),
    getScoringStrategy(assessment.id),
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
        kicker="Custom assessment · Scoring"
        title={title}
        description="Define result profiles, the rules that select them, and preview the outcome."
      />

      <AssessmentTabs versionId={versionId} active="scoring" />

      <ResultProfilesPanel
        catalogId={assessment.id}
        versionId={versionId}
        categories={categories}
        profiles={profiles}
        strategy={strategy}
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

      <PublishPanel
        catalogId={assessment.id}
        versionId={versionId}
        status={assessment.status}
        strategy={strategy}
        categoryCodes={categories.map((c) => c.code)}
        profiles={profiles.map((p) => ({ id: p.id, categoryCode: p.category_code }))}
        ruleCount={rules.length}
        questionCount={questions.length}
      />
    </>
  );
}
