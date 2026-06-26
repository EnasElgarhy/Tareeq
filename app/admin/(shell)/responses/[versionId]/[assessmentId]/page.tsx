import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultSummary } from "@/components/admin/responses/ResultSummary";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { PILLAR_NAMES } from "@/lib/admin/content";
import { respondentLabel } from "@/lib/admin/response-format";
import { getRunDetail } from "@/lib/admin/responses";

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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-faint">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-adm-ink">{value}</p>
    </div>
  );
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ versionId: string; assessmentId: string }>;
}) {
  const { versionId, assessmentId } = await params;
  const detail = await getRunDetail(assessmentId);
  if (!detail) notFound();

  const { run, versionLabel, decoded } = detail;
  const name = respondentLabel(run);
  const answeredCount = decoded.filter((d) => d.answered).length;

  // Group answers by pillar, preserving question order within each.
  const pillars = [...new Set(decoded.map((d) => d.pillar))].sort(
    (a, b) => a - b,
  );

  return (
    <>
      <nav className="adm-fade-up mb-4 text-[13px] text-adm-ink-muted">
        <Link href="/admin/responses" className="hover:text-adm-violet">
          Responses
        </Link>
        <span className="mx-2 text-adm-ink-faint">/</span>
        <Link
          href={`/admin/responses/${versionId}`}
          className="hover:text-adm-violet"
        >
          {versionLabel}
        </Link>
        <span className="mx-2 text-adm-ink-faint">/</span>
        <span className="text-adm-ink">{name}</span>
      </nav>

      <PageHeader
        kicker="Admin · Responses"
        title={name}
        description={`${answeredCount} of ${decoded.length} questions answered · ${versionLabel}`}
        actions={
          <StatusBadge status={run.completedAt ? "published" : "draft"} />
        }
      />

      {/* Respondent + run metadata */}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Meta label="Email" value={run.respondentEmail ?? "—"} />
          <Meta label="Language" value={run.locale.toUpperCase()} />
          <Meta label="Started" value={fmtDateTime(run.startedAt)} />
          <Meta label="Completed" value={fmtDateTime(run.completedAt)} />
          <Meta
            label="Identity"
            value={
              run.userId
                ? "Registered user"
                : run.anonSessionId
                  ? "Anonymous"
                  : "—"
            }
          />
          {run.anonSessionId && (
            <Meta label="Session" value={run.anonSessionId} />
          )}
        </div>
      </Card>

      {/* Result */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-adm-ink">Result</h2>
        <Card className="p-5">
          <ResultSummary result={run.result} />
        </Card>
      </section>

      {/* Answers, grouped by pillar */}
      <section>
        <h2 className="mb-3 text-base font-bold text-adm-ink">Answers</h2>
        <div className="space-y-6">
          {pillars.map((pillar) => {
            const rows = decoded.filter((d) => d.pillar === pillar);
            return (
              <div key={pillar}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-adm-violet">
                  {PILLAR_NAMES[pillar] ?? `Pillar ${pillar}`}
                </h3>
                <Card className="divide-y divide-adm-line p-5">
                  {rows.map((d) => (
                    <div
                      key={d.externalId}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                    >
                      <p className="flex-1 text-sm text-adm-ink-soft">
                        <span className="mr-2 text-xs font-semibold text-adm-ink-faint">
                          {d.externalId}
                        </span>
                        {d.questionTitle}
                      </p>
                      <p className="text-sm font-semibold text-adm-ink">
                        {d.answered ? (
                          <>
                            {d.chosenLetter && (
                              <span className="mr-1.5 text-adm-violet">
                                {d.chosenLetter}.
                              </span>
                            )}
                            {d.chosenText ?? "(answered)"}
                          </>
                        ) : (
                          <span className="text-adm-ink-faint">Not answered</span>
                        )}
                      </p>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
