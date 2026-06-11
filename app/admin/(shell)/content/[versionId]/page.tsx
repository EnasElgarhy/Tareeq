import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { VersionActions } from "@/components/admin/VersionActions";
import {
  getContentVersion,
  getVersionContent,
  listClusters,
  PILLAR_NAMES,
  type OptionRow,
  type QuestionRow,
} from "@/lib/admin/content";

export const dynamic = "force-dynamic";

function loc(text: Record<string, string>): string {
  return text?.en ?? Object.values(text ?? {})[0] ?? "";
}

/** The scoring metadata an option carries (cluster / driver / axis). */
function OptionMeta({ option }: { option: OptionRow }) {
  const tag =
    option.cluster_code ?? option.driver_code ?? option.axis_value ?? null;
  if (!tag) return null;
  return (
    <span className="ml-auto shrink-0 rounded-full bg-[#6E48E4]/10 px-2 py-0.5 text-[11px] font-bold text-[#6E48E4]">
      {tag}
    </span>
  );
}

function QuestionCard({ q }: { q: QuestionRow }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
          {q.external_id}
        </span>
        {q.axis ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
            axis: {q.axis}
          </span>
        ) : null}
      </div>
      <p className="text-[14px] font-semibold text-slate-900">{loc(q.title)}</p>
      <ul className="mt-2.5 grid gap-1.5">
        {q.options.map((o) => (
          <li
            key={o.id}
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded bg-white text-[11px] font-bold text-slate-600">
              {o.letter}
            </span>
            <span className="text-[13px] text-slate-700">{loc(o.text)}</span>
            <OptionMeta option={o} />
          </li>
        ))}
      </ul>
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

  // Group questions by pillar (already ordered by pillar, position).
  const byPillar = new Map<number, QuestionRow[]>();
  for (const q of questions) {
    const list = byPillar.get(q.pillar) ?? [];
    list.push(q);
    byPillar.set(q.pillar, list);
  }
  const pillars = [...byPillar.keys()].sort((a, b) => a - b);

  return (
    <div>
      <Link
        href="/admin/content"
        className="text-[13px] font-medium text-slate-500 hover:text-slate-900"
      >
        ← Content
      </Link>

      <header className="mb-6 mt-2 flex items-center gap-2">
        <h1 className="text-[24px] font-bold text-slate-900">{version.label}</h1>
        {version.is_active ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            Draft
          </span>
        )}
        <span className="ml-auto text-[13px] text-slate-500">
          {questions.length} questions
        </span>
      </header>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[13px] text-slate-500">
          {version.is_active
            ? "This is the live version. Clone it to make edits safely."
            : "Draft — edit freely, then publish to make it live."}
        </p>
        <VersionActions versionId={version.id} isActive={version.is_active} />
      </div>

      {pillars.map((pillar) => {
        const qs = byPillar.get(pillar)!;
        return (
          <section key={pillar} className="mb-8">
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-400">
              Pillar {pillar} · {PILLAR_NAMES[pillar] ?? "Other"} ({qs.length})
            </h2>
            <div className="grid gap-3">
              {qs.map((q) =>
                version.is_active ? (
                  <QuestionCard key={q.id} q={q} />
                ) : (
                  <QuestionEditor
                    key={q.id}
                    versionId={version.id}
                    question={q}
                    clusters={clusters}
                  />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
