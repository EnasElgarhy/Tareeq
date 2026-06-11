import Link from "next/link";
import { NewAssessmentButton } from "@/components/admin/NewAssessmentButton";
import {
  countQuestionsByVersion,
  listClusters,
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
  const [versions, counts, clusters] = await Promise.all([
    listContentVersions(),
    countQuestionsByVersion(),
    listClusters(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[24px] font-bold text-slate-900">Content</h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Assessment versions, questions, and the 8 career clusters.
        </p>
      </header>

      {/* Content versions */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
            Assessment versions
          </h2>
          <NewAssessmentButton />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {versions.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-slate-500">
              No content versions yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {versions.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/admin/content/${v.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-slate-900">
                          {v.label}
                        </span>
                        {v.is_active ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            Draft
                          </span>
                        )}
                      </div>
                      {v.notes ? (
                        <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
                          {v.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-[12.5px] text-slate-500">
                      <p className="font-semibold text-slate-700">
                        {counts[v.id] ?? 0} questions
                      </p>
                      <p>{fmtDate(v.created_at)}</p>
                    </div>
                    <span className="text-slate-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Clusters */}
      <section>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-400">
          Career clusters ({clusters.length})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {clusters.map((c) => (
            <div
              key={c.code}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6E48E4]">
                {c.code}
              </p>
              <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">
                {c.name}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
