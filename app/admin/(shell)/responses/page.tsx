import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import { getResponseSummaries } from "@/lib/admin/responses";

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

export default async function ResponsesPage() {
  const summaries = await getResponseSummaries();

  return (
    <>
      <PageHeader
        kicker="Admin · Responses"
        title="Responses"
        description="Every assessment a respondent has taken, grouped by assessment. Open one to see who took it and the result they got."
      />

      {summaries.length === 0 ? (
        <EmptyState
          title="No responses yet"
          description="When people complete an assessment, their answers and result land here. Run scripts/seed_sample_responses.mts to preview this view with sample data."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Assessment</Th>
              <Th className="w-28">Status</Th>
              <Th className="w-28">Responses</Th>
              <Th className="w-28">Completed</Th>
              <Th className="w-48">Last activity</Th>
              <Th className="w-20">
                <span className="sr-only">Open</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <Tr key={s.versionId}>
                <Td>
                  <Link
                    href={`/admin/responses/${s.versionId}`}
                    className="font-bold text-adm-ink underline-offset-2 hover:text-adm-violet hover:underline"
                  >
                    {s.label}
                  </Link>
                </Td>
                <Td>
                  <StatusBadge status={s.isActive ? "published" : "draft"} />
                </Td>
                <Td>{s.total}</Td>
                <Td>{s.completed}</Td>
                <Td className="text-adm-ink-muted">
                  {fmtDateTime(s.lastActivityAt)}
                </Td>
                <Td>
                  <Link
                    href={`/admin/responses/${s.versionId}`}
                    className="text-[13px] font-semibold text-adm-violet hover:text-adm-deep"
                  >
                    Open →
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
