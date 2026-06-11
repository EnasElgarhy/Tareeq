import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { countQuestionsByVersion, listContentVersions } from "@/lib/admin/content";
import { CLUSTERS } from "@/lib/admin/clusters";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface DashboardData {
  ok: boolean;
  started: number;
  completed: number;
  users: number;
  rate: number | null;
  questionCounts: Record<string, number>;
  active: Awaited<ReturnType<typeof listContentVersions>>[number] | null;
  draft: Awaited<ReturnType<typeof listContentVersions>>[number] | null;
  coverage: Record<string, number>;
}

async function getDashboard(): Promise<DashboardData> {
  const sb = createSupabaseAdminClient();
  const head = { count: "exact" as const, head: true };
  try {
    const [startedR, completedR, usersR, versions, questionCounts] =
      await Promise.all([
        sb.from("assessments").select("*", head),
        sb.from("assessments").select("*", head).not("completed_at", "is", null),
        sb.from("user_accounts").select("*", head),
        listContentVersions(),
        countQuestionsByVersion(),
      ]);

    const active = versions.find((v) => v.is_active) ?? null;
    const draft = versions.find((v) => !v.is_active) ?? null;

    const coverage: Record<string, number> = {};
    if (active) {
      const { data: qs } = await sb
        .from("questions")
        .select("question_options(cluster_code)")
        .eq("version_id", active.id);
      for (const q of qs ?? []) {
        const opts =
          (q as { question_options: { cluster_code: string | null }[] })
            .question_options ?? [];
        for (const o of opts) {
          if (o.cluster_code)
            coverage[o.cluster_code] = (coverage[o.cluster_code] ?? 0) + 1;
        }
      }
    }

    const started = startedR.count ?? 0;
    const completed = completedR.count ?? 0;
    return {
      ok: ![startedR, completedR, usersR].some((r) => r.error),
      started,
      completed,
      users: usersR.count ?? 0,
      rate: started > 0 ? Math.round((completed / started) * 100) : null,
      questionCounts,
      active,
      draft,
      coverage,
    };
  } catch {
    return {
      ok: false,
      started: 0,
      completed: 0,
      users: 0,
      rate: null,
      questionCounts: {},
      active: null,
      draft: null,
      coverage: {},
    };
  }
}

function StatCard({
  label,
  value,
  sub,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  index: number;
}) {
  return (
    <Card
      className="adm-fade-up p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
        {label}
      </p>
      <p className="adm-display mt-2 text-[2.25rem] leading-none">{value}</p>
      <span
        aria-hidden="true"
        className="mt-2 block h-1 w-10 rounded-full bg-adm-gold"
      />
      {sub && <p className="mt-3 text-xs font-semibold text-adm-ink-muted">{sub}</p>}
    </Card>
  );
}

export default async function AdminDashboard() {
  const d = await getDashboard();
  const coverageTotal = Object.values(d.coverage).reduce((a, b) => a + b, 0);
  const pct = (code: string) =>
    coverageTotal > 0 ? Math.round((d.coverage[code] ?? 0) / coverageTotal * 100) : 0;

  return (
    <>
      <PageHeader
        kicker="Admin · Overview"
        title="The compass, at a glance."
        description="Assessment activity and content health. Result analytics fill in once the live app starts recording assessments."
      />

      <section
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        <StatCard index={0} label="Registered users" value={String(d.users)} />
        <StatCard
          index={1}
          label="Assessments completed"
          value={String(d.completed)}
        />
        <StatCard
          index={2}
          label="Completion rate"
          value={d.rate === null ? "—" : `${d.rate}%`}
          sub={`${d.completed} of ${d.started} started`}
        />
        <StatCard
          index={3}
          label="Assessments started"
          value={String(d.started)}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Cluster coverage of the live assessment */}
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-bold text-adm-ink">
              Cluster coverage
            </h2>
            <p className="text-xs text-adm-ink-muted">
              {d.active ? `Live assessment · ${d.active.label}` : "No live version"}
            </p>
          </div>
          {coverageTotal > 0 ? (
            <>
              <div
                className="flex h-4 overflow-hidden rounded-full"
                role="img"
                aria-label={CLUSTERS.map(
                  (c) => `${c.name} ${pct(c.code)}%`,
                ).join(", ")}
              >
                {CLUSTERS.map((c) => (
                  <span
                    key={c.code}
                    className="h-full"
                    style={{
                      width: `${pct(c.code)}%`,
                      backgroundColor: `var(${c.cssVar})`,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {CLUSTERS.map((c) => (
                  <li key={c.code} className="flex items-center gap-2 text-[13px]">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: `var(${c.cssVar})` }}
                    />
                    <span className="text-adm-ink-soft">{c.name}</span>
                    <span className="ml-auto font-bold text-adm-ink">
                      {pct(c.code)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-adm-ink-muted">
              No scored answers in the live assessment yet.
            </p>
          )}
        </Card>

        {/* Content health */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-adm-ink">Content health</h2>
          <div className="space-y-3">
            {d.active && (
              <Link
                href={`/admin/content/${d.active.id}`}
                className="adm-lift block rounded-adm-md border border-adm-line bg-adm-sand/70 p-4 hover:border-adm-violet"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-adm-ink">
                    {d.active.label}
                  </p>
                  <StatusBadge status="published" />
                </div>
                <p className="mt-1 text-xs text-adm-ink-muted">
                  {d.questionCounts[d.active.id] ?? 0} questions · live for all
                  students
                </p>
              </Link>
            )}
            {d.draft && (
              <Link
                href={`/admin/content/${d.draft.id}`}
                className="adm-lift block rounded-adm-md border border-dashed border-adm-line-strong p-4 hover:border-adm-violet"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-adm-ink">
                    {d.draft.label}
                  </p>
                  <StatusBadge status="draft" />
                </div>
                <p className="mt-1 text-xs text-adm-ink-muted">
                  {d.questionCounts[d.draft.id] ?? 0} questions · in progress
                </p>
              </Link>
            )}
            {!d.active && !d.draft && (
              <p className="text-sm text-adm-ink-muted">No content versions yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent activity — arrives with the analytics phase */}
      <section aria-label="Recent activity" className="mt-6">
        <h2 className="mb-3 text-base font-bold text-adm-ink">Recent activity</h2>
        <EmptyState
          title="Nothing logged yet"
          description="An editor activity feed and result analytics arrive once assessment persistence + events are wired up."
        />
      </section>
    </>
  );
}
