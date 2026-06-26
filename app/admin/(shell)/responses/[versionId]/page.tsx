import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultSummaryInline } from "@/components/admin/responses/ResultSummary";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import { getAssessmentForVersion } from "@/lib/admin/catalog";
import { getContentVersion } from "@/lib/admin/content";
import { respondentLabel } from "@/lib/admin/response-format";
import { listRunsForVersion } from "@/lib/admin/responses";

export const dynamic = "force-dynamic";

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function VersionResponsesPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const [version, catalog, runs] = await Promise.all([
    getContentVersion(versionId),
    getAssessmentForVersion(versionId),
    listRunsForVersion(versionId),
  ]);

  if (!version) notFound();
  const title = catalog?.name.en ?? version.label;

  return (
    <>
      <nav className="adm-fade-up mb-4 text-[13px] text-adm-ink-muted">
        <Link href="/admin/responses" className="hover:text-adm-violet">
          Responses
        </Link>
        <span className="mx-2 text-adm-ink-faint">/</span>
        <span className="text-adm-ink">{title}</span>
      </nav>

      <PageHeader
        kicker="Admin · Responses"
        title={title}
        description={`${runs.length} ${runs.length === 1 ? "respondent" : "respondents"} · ${runs.filter((r) => r.completedAt).length} completed`}
        actions={<StatusBadge status={version.is_active ? "published" : "draft"} />}
      />

      {runs.length === 0 ? (
        <EmptyState
          title="No responses for this assessment"
          description="Nobody has taken this assessment yet. Completed runs will appear here with their result."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Respondent</Th>
              <Th className="w-28">Status</Th>
              <Th>Result</Th>
              <Th className="w-48">Completed</Th>
              <Th className="w-20">
                <span className="sr-only">View</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <Tr key={run.id}>
                <Td>
                  <Link
                    href={`/admin/responses/${versionId}/${run.id}`}
                    className="font-bold text-adm-ink underline-offset-2 hover:text-adm-violet hover:underline"
                  >
                    {respondentLabel(run)}
                  </Link>
                  {run.respondentEmail && (
                    <p className="text-xs text-adm-ink-muted">
                      {run.respondentEmail}
                    </p>
                  )}
                </Td>
                <Td>
                  <StatusBadge
                    status={run.completedAt ? "published" : "draft"}
                  />
                </Td>
                <Td>
                  <ResultSummaryInline result={run.result} />
                </Td>
                <Td className="text-adm-ink-muted">
                  {fmtDateTime(run.completedAt)}
                </Td>
                <Td>
                  <Link
                    href={`/admin/responses/${versionId}/${run.id}`}
                    className="text-[13px] font-semibold text-adm-violet hover:text-adm-deep"
                  >
                    View →
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
