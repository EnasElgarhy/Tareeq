import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AiImportFlow } from "@/components/admin/AiImportFlow";
import PageHeader from "@/components/admin/PageHeader";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";

export const dynamic = "force-dynamic";

export default async function ImportPage({
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
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span className="text-adm-ink-soft">Import</span>
      </nav>

      <PageHeader
        kicker="Custom assessment · Import"
        title={title}
        description="Bring in your existing questions and scoring logic. AI structures the source; you review every part before it enters the editor."
      />

      <AiImportFlow catalogId={assessment.id} versionId={versionId} />
    </>
  );
}
