import Link from "next/link";
import { GenerationBadge } from "@/components/admin/GenerationBadge";
import { NewAssessmentButton } from "@/components/admin/NewAssessmentButton";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import { versionIdsOf } from "@/lib/admin/assessment-generation";
import { loadVersionGenerations } from "@/lib/admin/assessment-generation.server";
import {
  getDraftVersionForCatalog,
  listCatalogAssessments,
} from "@/lib/admin/catalog";
import {
  countQuestionsByVersion,
  listContentVersions,
} from "@/lib/admin/content";
import { CORE_PACKAGE_VERSIONS, CORE_PARTS } from "@/lib/admin/core/framework";
import { getVersionResponseStats } from "@/lib/admin/responses";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ContentPage() {
  const [versions, counts, catalogs, generations] = await Promise.all([
    listContentVersions(),
    countQuestionsByVersion(),
    listCatalogAssessments(),
    loadVersionGenerations(),
  ]);

  // Catalog (custom / AI-import) assessments own a content_version. Show them in
  // their own section and exclude their versions from the legacy CORE list.
  const catalogList = await Promise.all(
    catalogs.map(async (c) => ({
      ...c,
      versionId: await getDraftVersionForCatalog(c.id),
    })),
  );
  const catalogVersionIds = new Set(
    catalogList
      .map((c) => c.versionId)
      .filter((id): id is string => Boolean(id)),
  );
  // The archived v4 assessment: every non-catalog version except CORE 2.0's row.
  const legacyIds = new Set(versionIdsOf(generations, "legacy-v4"));
  const legacyVersions = versions.filter(
    (v) => legacyIds.has(v.id) && !catalogVersionIds.has(v.id),
  );
  const coreVersionId = versionIdsOf(generations, "core-2.0")[0] ?? null;
  const coreStats = coreVersionId
    ? await getVersionResponseStats(coreVersionId)
    : null;

  return (
    <>
      <PageHeader
        kicker="Admin · Content"
        title="Assessment versions"
        description="CORE 2.0 is the current assessment. Custom assessments are drafted and published here; the v4 assessment is archived and read-only."
        actions={<NewAssessmentButton />}
      />

      <section aria-labelledby="current-assessment" className="mb-8">
        <h2
          id="current-assessment"
          className="mb-3 text-base font-bold text-adm-ink"
        >
          Current assessment
        </h2>
        <Link
          href="/admin/content/core"
          className="group block rounded-adm-lg border border-adm-line bg-adm-card p-5 transition hover:border-adm-violet/40 hover:shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-adm-ink group-hover:text-adm-violet">
              CORE 2.0
            </span>
            <GenerationBadge generation="core-2.0" />
            <StatusBadge status="published" />
          </div>
          <p className="mt-1 text-[13px] text-adm-ink-muted">
            Question set {CORE_PACKAGE_VERSIONS.questionSet} · report wording{" "}
            {CORE_PACKAGE_VERSIONS.reportWording} · career bank{" "}
            {CORE_PACKAGE_VERSIONS.bank}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2 text-[12px] text-adm-ink-soft">
            {CORE_PARTS.map((p) => (
              <li key={p.pillar} className="rounded-full bg-adm-sand px-2.5 py-1">
                Part {p.part} · {p.name}
              </li>
            ))}
            {coreStats ? (
              <li className="rounded-full bg-adm-violet/10 px-2.5 py-1 font-semibold text-adm-deep">
                {coreStats.completed} completed responses
              </li>
            ) : null}
          </ul>
        </Link>
      </section>

      {legacyVersions.length === 0 && catalogList.length === 0 ? (
        <EmptyState
          title="No custom assessments yet"
          description="Create a custom assessment to run alongside CORE 2.0."
          action={<NewAssessmentButton />}
        />
      ) : (
        <>
          {catalogList.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-bold text-adm-ink">
                Custom assessments
              </h2>
              <Table>
                <thead>
                  <tr>
                    <Th>Assessment</Th>
                    <Th className="w-24">Type</Th>
                    <Th className="w-28">Status</Th>
                    <Th className="w-28">Source</Th>
                    <Th className="w-20">
                      <span className="sr-only">Open</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {catalogList.map((c) => {
                    const href = c.versionId
                      ? c.creation_method === "ai_import"
                        ? `/admin/content/${c.versionId}/import`
                        : `/admin/content/${c.versionId}/custom`
                      : null;
                    return (
                      <Tr key={c.id}>
                        <Td>
                          {href ? (
                            <Link
                              href={href}
                              className="font-bold text-adm-ink underline-offset-2 hover:text-adm-violet hover:underline"
                            >
                              {c.name.en ?? "Untitled"}
                            </Link>
                          ) : (
                            <span className="font-bold text-adm-ink">
                              {c.name.en ?? "Untitled"}
                            </span>
                          )}
                        </Td>
                        <Td className="capitalize text-adm-ink-muted">
                          {c.assessment_type}
                        </Td>
                        <Td>
                          <StatusBadge
                            status={c.status === "published" ? "published" : "draft"}
                          />
                        </Td>
                        <Td className="text-adm-ink-muted">
                          {c.creation_method === "ai_import" ? "AI import" : "Manual"}
                        </Td>
                        <Td>
                          {href ? (
                            <Link
                              href={href}
                              className="text-[13px] font-semibold text-adm-violet hover:text-adm-deep"
                            >
                              Open →
                            </Link>
                          ) : null}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </section>
          ) : null}

          {legacyVersions.length > 0 ? (
            <section aria-labelledby="archived-assessments">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2
                  id="archived-assessments"
                  className="flex items-center gap-2 text-base font-bold text-adm-ink"
                >
                  Archived <GenerationBadge generation="legacy-v4" />
                </h2>
                <p className="text-xs text-adm-ink-muted">
                  Legacy v4 assessment · viewable with its responses, never
                  edited or published
                </p>
              </div>
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
                  {legacyVersions.map((v) => (
                    <Tr key={v.id}>
                      <Td>
                        <Link
                          href={`/admin/content/${v.id}`}
                          className="font-bold text-adm-ink underline-offset-2 hover:text-adm-violet hover:underline"
                        >
                          {v.label}
                        </Link>
                        {v.is_active ? (
                          <span className="ml-2 text-xs text-adm-ink-muted">
                            last live v4 version
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        <StatusBadge status="archived" />
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
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
