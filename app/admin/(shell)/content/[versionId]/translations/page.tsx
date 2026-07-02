import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import PageHeader from "@/components/admin/PageHeader";
import { TranslationsPanel } from "@/components/admin/TranslationsPanel";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";
import {
  listAssessmentCategories,
  listCustomQuestions,
} from "@/lib/admin/custom-content";
import { listResultProfiles } from "@/lib/admin/scoring-content";
import { findMissingTranslations } from "@/lib/admin/translation-coverage";

export const dynamic = "force-dynamic";

export default async function TranslationsPage({
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

  const [categories, questions, profiles] = await Promise.all([
    listAssessmentCategories(assessment.id),
    listCustomQuestions(versionId),
    listResultProfiles(assessment.id),
  ]);

  const gaps = findMissingTranslations({
    supportedLocales: assessment.supported_languages,
    categories: categories.map((c) => ({ code: c.code, name: c.name })),
    questions: questions.map((q) => ({
      external_id: q.external_id,
      title: q.title,
      options: q.options.map((o) => ({ letter: o.letter, text: o.text })),
    })),
    profiles: profiles.map((p) => ({ code: p.code, name: p.name })),
  });

  const title = assessment.name.en ?? version.label;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-adm-ink-muted">
        <Link href="/admin/content" className="font-semibold text-adm-violet hover:text-adm-deep">
          Content
        </Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span className="text-adm-ink-soft">{title}</span>
      </nav>

      <PageHeader
        kicker="Custom assessment · Translations"
        title={title}
        description="Track bilingual coverage and fill gaps with AI (review before publishing)."
      />

      <AssessmentTabs versionId={versionId} active="translations" />

      <TranslationsPanel
        catalogId={assessment.id}
        versionId={versionId}
        supportedLocales={assessment.supported_languages}
        primaryLanguage={assessment.primary_language}
        gaps={gaps}
      />
    </>
  );
}
