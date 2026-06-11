import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Counts {
  ok: boolean;
  started: number;
  completed: number;
  analytics: number;
  users: number;
}

async function getCounts(): Promise<Counts> {
  try {
    const sb = createSupabaseAdminClient();
    const head = { count: "exact" as const, head: true };
    const [started, completed, analytics, users] = await Promise.all([
      sb.from("assessments").select("*", head),
      sb.from("assessments").select("*", head).not("completed_at", "is", null),
      sb.from("assessment_data").select("*", head),
      sb.from("user_accounts").select("*", head),
    ]);

    const ok = ![started, completed, analytics, users].some((r) => r.error);
    return {
      ok,
      started: started.count ?? 0,
      completed: completed.count ?? 0,
      analytics: analytics.count ?? 0,
      users: users.count ?? 0,
    };
  } catch {
    return { ok: false, started: 0, completed: 0, analytics: 0, users: 0 };
  }
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-[30px] font-black leading-none text-slate-900">
        {value}
      </p>
      {sub ? <p className="mt-1 text-[12.5px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default async function AdminDashboard() {
  const c = await getCounts();
  const rate =
    c.started > 0 ? `${Math.round((c.completed / c.started) * 100)}%` : "—";

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[24px] font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Overview of assessment activity.
        </p>
      </header>

      {!c.ok ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Live data isn&apos;t available yet — the public app doesn&apos;t persist
          results to the database yet (that&apos;s Phase 3). These counts will fill
          in once persistence + events are wired up.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Assessments started" value={String(c.started)} />
        <StatCard label="Completed" value={String(c.completed)} />
        <StatCard label="Completion rate" value={rate} />
        <StatCard label="Registered users" value={String(c.users)} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-[15px] font-bold text-slate-900">
          Phase 0 — Foundation ✓
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          Admin auth, role-gating, and the app shell are live. Next up:{" "}
          <strong className="font-semibold text-slate-700">Phase 1</strong> —
          the content CMS (manage clusters, content versions, and questions),
          then the assessment builder, persistence + events, and analytics. See{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px]">
            docs/CMS_BACKEND_PLAN.md
          </code>
          .
        </p>
      </div>
    </div>
  );
}
