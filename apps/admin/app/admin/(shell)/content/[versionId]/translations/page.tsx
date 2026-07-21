import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentTabs } from "@/components/admin/AssessmentTabs";
import { CoreTranslationsPanel } from "@/components/admin/CoreTranslationsPanel";
import PageHeader from "@/components/admin/PageHeader";
import { TranslationsPanel } from "@/components/admin/TranslationsPanel";
import { loadAssessmentWorkspace } from "@/lib/admin/assessment-workspace.server";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion, getVersionContent } from "@/lib/admin/content";

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
    const questions = await getVersionContent(versionId);
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
            href={`/admin/content/${versionId}`}
            className="font-semibold text-adm-violet hover:text-adm-deep"
          >
            {version.label}
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span className="text-adm-ink-soft">Translations</span>
        </nav>

        <PageHeader
          kicker="CORE assessment · Translations"
          title={version.label}
          description="Edit the Arabic (ar) title and option text directly. This only ever touches the ar key — it never changes English text, question structure, or scoring, so it's safe to edit even on the live/published version."
        />

        <CoreTranslationsPanel versionId={versionId} questions={questions} />
      </>
    );
  }

  const { readiness } = await loadAssessmentWorkspace(
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
        <span className="text-adm-ink-soft">{title}</span>
      </nav>

      <PageHeader
        kicker="Custom assessment · Languages"
        title={title}
        description="Check every required language and fill any missing content before review."
      />

      <AssessmentTabs
        versionId={versionId}
        active="translations"
        readiness={readiness}
      />

      <TranslationsPanel
        catalogId={assessment.id}
        versionId={versionId}
        supportedLocales={assessment.supported_languages}
        primaryLanguage={assessment.primary_language}
        gaps={readiness.translationGaps}
      />
    </>
  );
}
