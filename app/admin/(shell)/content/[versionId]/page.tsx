import Link from "next/link";
import { notFound } from "next/navigation";
import { CsvImport } from "@/components/admin/CsvImport";
import PageHeader from "@/components/admin/PageHeader";
import { QuestionBuilder } from "@/components/admin/QuestionBuilder";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { VersionActions } from "@/components/admin/VersionActions";
import { VersionRename } from "@/components/admin/VersionRename";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import {
  getContentVersion,
  getVersionContent,
  listClusters,
  PILLAR_NAMES,
  type QuestionRow,
} from "@/lib/admin/content";

export const dynamic = "force-dynamic";

function loc(t: Record<string, string>): string {
  return t?.en ?? Object.values(t ?? {})[0] ?? "";
}

/** Read-only question card (active/published versions). */
function ReadonlyQuestion({ q }: { q: QuestionRow }) {
  return (
    <div className="rounded-adm-lg border border-adm-line bg-adm-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-bold text-adm-ink-muted">
          {q.external_id}
        </span>
        {q.axis ? (
          <span className="rounded bg-adm-sand px-1.5 py-0.5 text-[11px] font-semibold text-adm-ink-muted">
            axis: {q.axis}
          </span>
        ) : null}
      </div>
      <p className="text-[14px] font-semibold text-adm-ink">{loc(q.title)}</p>
      {q.options.length > 0 ? (
        <ul className="mt-2.5 grid gap-1.5">
          {q.options.map((o) => {
            const tag = o.cluster_code ?? o.driver_code ?? o.axis_value;
            return (
              <li
                key={o.id}
                className="flex items-center gap-2 rounded-adm-md bg-adm-sand px-3 py-1.5"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded bg-adm-card text-[11px] font-bold text-adm-ink-soft">
                  {o.letter}
                </span>
                <span className="text-[13px] text-adm-ink-soft">
                  {loc(o.text)}
                </span>
                {tag ? (
                  <span className="ml-auto shrink-0 rounded-full bg-adm-violet/10 px-2 py-0.5 text-[11px] font-bold text-adm-violet">
                    {tag}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const [version, questions, clusters] = await Promise.all([
    getContentVersion(versionId),
    getVersionContent(versionId),
    listClusters(),
  ]);

  if (!version) notFound();
  const editable = !version.is_active;

  const byPillar = new Map<number, QuestionRow[]>();
  for (const q of questions) {
    const list = byPillar.get(q.pillar) ?? [];
    list.push(q);
    byPillar.set(q.pillar, list);
  }
  const pillars = [...byPillar.keys()].sort((a, b) => a - b);

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
        <span className="text-adm-ink-soft">{version.label}</span>
      </nav>

      <PageHeader
        kicker={`Assessment · ${questions.length} questions`}
        title={
          <VersionRename
            versionId={version.id}
            label={version.label}
            isActive={version.is_active}
            editable={editable}
          />
        }
        actions={
          <VersionActions versionId={version.id} isActive={version.is_active} />
        }
      />

      {!editable && (
        <p className="mb-6 rounded-adm-md border border-adm-gold/50 bg-adm-gold/15 px-4 py-3 text-[13px] font-medium text-adm-gold-ink">
          This version is live and read-only. Clone it to a draft to make
          changes.
        </p>
      )}

      {questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add your first question below, or import a batch from CSV."
        />
      ) : (
        pillars.map((pillar) => {
          const qs = byPillar.get(pillar) ?? [];
          return (
            <section key={pillar} className="mb-8">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-adm-ink-muted">
                Pillar {pillar} · {PILLAR_NAMES[pillar] ?? "Other"} ({qs.length})
              </h2>
              <div className="grid gap-3">
                {qs.map((q, i) =>
                  editable ? (
                    <QuestionEditor
                      key={q.id}
                      versionId={version.id}
                      question={q}
                      clusters={clusters}
                      canMoveUp={i > 0}
                      canMoveDown={i < qs.length - 1}
                    />
                  ) : (
                    <ReadonlyQuestion key={q.id} q={q} />
                  ),
                )}
              </div>
            </section>
          );
        })
      )}

      {editable && (
        <div className="mt-8 flex flex-wrap items-start gap-2">
          <QuestionBuilder versionId={version.id} clusters={clusters} />
          <CsvImport versionId={version.id} />
        </div>
      )}
    </>
  );
}
