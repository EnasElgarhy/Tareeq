import Link from "next/link";
import { ClusterCard } from "@/components/admin/ClusterCard";
import { NewAssessmentButton } from "@/components/admin/NewAssessmentButton";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import { CLUSTERS } from "@/lib/admin/clusters";
import {
  countQuestionsByVersion,
  getVersionContent,
  listContentVersions,
} from "@/lib/admin/content";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ContentPage() {
  const [versions, counts] = await Promise.all([
    listContentVersions(),
    countQuestionsByVersion(),
  ]);

  const active = versions.find((v) => v.is_active) ?? null;
  const liveQuestions = active ? await getVersionContent(active.id) : [];
  const countFor = (code: string) =>
    liveQuestions.filter((q) => q.options.some((o) => o.cluster_code === code))
      .length;

  return (
    <>
      <PageHeader
        kicker="Admin · Content"
        title="Assessment versions"
        description="Draft, review, and publish the question sets behind the compass. One version is live at a time."
        actions={<NewAssessmentButton />}
      />

      {versions.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          description="Every compass starts with a question. Create your first assessment version to get going."
          action={<NewAssessmentButton />}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Version</Th>
              <Th className="w-28">Status</Th>
              <Th className="w-28">Questions</Th>
              <Th className="w-32">Created</Th>
              <Th className="w-20">
                <span className="sr-only">Open</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <Tr key={v.id}>
                <Td>
                  <Link
                    href={`/admin/content/${v.id}`}
                    className="font-bold text-adm-ink underline-offset-2 hover:text-adm-violet hover:underline"
                  >
                    {v.label}
                  </Link>
                </Td>
                <Td>
                  <StatusBadge status={v.is_active ? "published" : "draft"} />
                </Td>
                <Td>{counts[v.id] ?? 0}</Td>
                <Td className="text-adm-ink-muted">{fmtDate(v.created_at)}</Td>
                <Td>
                  <Link
                    href={`/admin/content/${v.id}`}
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

      {/* Cluster coverage */}
      <section aria-label="Cluster coverage" className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-adm-ink">Cluster coverage</h2>
          <p className="text-xs text-adm-ink-muted">
            Questions touching each cluster · live version
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CLUSTERS.map((c) => (
            <ClusterCard
              key={c.code}
              cluster={c}
              questionCount={countFor(c.code)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
