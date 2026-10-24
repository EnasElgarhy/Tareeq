import Link from "next/link";
import { GenerationBadge } from "@/components/admin/GenerationBadge";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import {
  getResponseSummaries,
  type VersionResponseSummary,
} from "@/lib/admin/responses";

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

function SummaryTable({
  summaries,
  isArchive = false,
}: {
  summaries: VersionResponseSummary[];
  isArchive?: boolean;
}) {
  return (
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
              {isArchive ? (
                <StatusBadge status="archived" />
              ) : s.generation === "core-2.0" ? (
                <StatusBadge status="published" />
              ) : (
                <StatusBadge status={s.isActive ? "published" : "draft"} />
              )}
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
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: React.ReactNode;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-adm-ink">
          {title}
        </h2>
        <p className="text-xs text-adm-ink-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default async function ResponsesPage() {
  const summaries = await getResponseSummaries();
  const core = summaries.filter((s) => s.generation === "core-2.0");
  const custom = summaries.filter((s) => s.generation === "custom");
  const legacy = summaries.filter((s) => s.generation === "legacy-v4");

  return (
    <>
      <PageHeader
        kicker="Admin · Responses"
        title="Responses"
        description="Every assessment a respondent has taken. CORE 2.0 and the archived v4 assessment are kept apart: their responses are never counted or compared together."
      />

      {summaries.length === 0 ? (
        <EmptyState
          title="No responses yet"
          description="When people complete an assessment, their answers and result land here. Run scripts/seed_sample_responses.mts to preview this view with sample data."
        />
      ) : (
        <>
          {core.length > 0 && (
            <Section
              title={
                <>
                  Current assessment <GenerationBadge generation="core-2.0" />
                </>
              }
              note="Question set 5.x"
            >
              <SummaryTable summaries={core} />
            </Section>
          )}
          {custom.length > 0 && (
            <Section
              title="Custom assessments"
              note="Each scored by its own rules"
            >
              <SummaryTable summaries={custom} />
            </Section>
          )}
          {legacy.length > 0 && (
            <Section
              title={
                <>
                  Archived <GenerationBadge generation="legacy-v4" />
                </>
              }
              note="Read-only · kept for analysis"
            >
              <SummaryTable summaries={legacy} isArchive />
            </Section>
          )}
        </>
      )}
    </>
  );
}
