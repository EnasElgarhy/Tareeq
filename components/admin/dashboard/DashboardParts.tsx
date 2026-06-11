import Link from "next/link";
import { cache } from "react";
import { AnimatedNumber } from "@/components/admin/dashboard/AnimatedNumber";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { Card } from "@/components/admin/ui/Card";
import { CLUSTERS } from "@/lib/admin/clusters";
import {
  countQuestionsByVersion,
  listContentVersions,
} from "@/lib/admin/content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Deduped within a request so Coverage + Health share one versions fetch. */
const getVersionsData = cache(async () => {
  const [versions, counts] = await Promise.all([
    listContentVersions(),
    countQuestionsByVersion(),
  ]);
  return { versions, counts };
});

/* ======================== Stats ======================== */

async function getCounts() {
  const sb = createSupabaseAdminClient();
  const head = { count: "exact" as const, head: true };
  try {
    const [s, c, u] = await Promise.all([
      sb.from("assessments").select("*", head),
      sb.from("assessments").select("*", head).not("completed_at", "is", null),
      sb.from("user_accounts").select("*", head),
    ]);
    const started = s.count ?? 0;
    const completed = c.count ?? 0;
    return {
      started,
      completed,
      users: u.count ?? 0,
      rate: started > 0 ? Math.round((completed / started) * 100) : null,
    };
  } catch {
    return { started: 0, completed: 0, users: 0, rate: null };
  }
}

function StatCard({
  label,
  value,
  suffix,
  sub,
  index,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  sub?: string;
  index: number;
}) {
  return (
    <Card
      className="adm-fade-up adm-lift p-5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-adm-ink-muted">
        {label}
      </p>
      <p className="adm-display mt-2 text-[2.25rem] leading-none">
        {value === null ? (
          "—"
        ) : (
          <AnimatedNumber value={value} suffix={suffix} />
        )}
      </p>
      <span
        aria-hidden="true"
        className="mt-2 block h-1 w-10 rounded-full bg-adm-gold"
      />
      {sub && (
        <p className="mt-3 text-xs font-semibold text-adm-ink-muted">{sub}</p>
      )}
    </Card>
  );
}

export async function StatsSection() {
  const c = await getCounts();
  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      <StatCard index={0} label="Registered users" value={c.users} />
      <StatCard index={1} label="Assessments completed" value={c.completed} />
      <StatCard
        index={2}
        label="Completion rate"
        value={c.rate}
        suffix="%"
        sub={`${c.completed} of ${c.started} started`}
      />
      <StatCard index={3} label="Assessments started" value={c.started} />
    </section>
  );
}

function SkelCard() {
  return (
    <Card className="p-5">
      <div className="adm-skeleton h-3 w-24" />
      <div className="adm-skeleton mt-3 h-9 w-20" />
      <div className="adm-skeleton mt-3.5 h-3 w-16" />
    </Card>
  );
}

export function StatsSkeleton() {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <SkelCard key={i} />
      ))}
    </section>
  );
}

/* ======================== Cluster coverage ======================== */

async function getCoverage() {
  const { versions } = await getVersionsData();
  const active = versions.find((v) => v.is_active) ?? null;
  const coverage: Record<string, number> = {};
  if (active) {
    const sb = createSupabaseAdminClient();
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
  return { active, coverage };
}

export async function CoverageSection() {
  const { active, coverage } = await getCoverage();
  const total = Object.values(coverage).reduce((a, b) => a + b, 0);
  const pct = (code: string) =>
    total > 0 ? Math.round(((coverage[code] ?? 0) / total) * 100) : 0;

  return (
    <Card className="adm-fade-up p-5 lg:col-span-3">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-adm-ink">Cluster coverage</h2>
        <p className="text-xs text-adm-ink-muted">
          {active ? `Live · ${active.label}` : "No live version"}
        </p>
      </div>
      {total > 0 ? (
        <>
          <div
            className="adm-grow-x flex h-4 overflow-hidden rounded-full"
            role="img"
            aria-label={CLUSTERS.map((c) => `${c.name} ${pct(c.code)}%`).join(
              ", ",
            )}
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
            {CLUSTERS.map((c, i) => (
              <li
                key={c.code}
                className="adm-fade-up flex items-center gap-2 text-[13px]"
                style={{ animationDelay: `${120 + i * 40}ms` }}
              >
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
  );
}

export function CoverageSkeleton() {
  return (
    <Card className="p-5 lg:col-span-3">
      <div className="adm-skeleton h-4 w-32" />
      <div className="adm-skeleton mt-5 h-4 w-full !rounded-full" />
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="adm-skeleton h-3 w-full" />
        ))}
      </div>
    </Card>
  );
}

/* ======================== Content health ======================== */

export async function HealthSection() {
  const { versions, counts } = await getVersionsData();
  const active = versions.find((v) => v.is_active) ?? null;
  const draft = versions.find((v) => !v.is_active) ?? null;

  return (
    <Card
      className="adm-fade-up p-5 lg:col-span-2"
      style={{ animationDelay: "60ms" }}
    >
      <h2 className="mb-4 text-base font-bold text-adm-ink">Content health</h2>
      <div className="space-y-3">
        {active && (
          <Link
            href={`/admin/content/${active.id}`}
            className="adm-lift block rounded-adm-md border border-adm-line bg-adm-sand/70 p-4 hover:border-adm-violet"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-adm-ink">
                {active.label}
              </p>
              <StatusBadge status="published" />
            </div>
            <p className="mt-1 text-xs text-adm-ink-muted">
              {counts[active.id] ?? 0} questions · live for all students
            </p>
          </Link>
        )}
        {draft && (
          <Link
            href={`/admin/content/${draft.id}`}
            className="adm-lift block rounded-adm-md border border-dashed border-adm-line-strong p-4 hover:border-adm-violet"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-adm-ink">
                {draft.label}
              </p>
              <StatusBadge status="draft" />
            </div>
            <p className="mt-1 text-xs text-adm-ink-muted">
              {counts[draft.id] ?? 0} questions · in progress
            </p>
          </Link>
        )}
        {!active && !draft && (
          <p className="text-sm text-adm-ink-muted">No content versions yet.</p>
        )}
      </div>
    </Card>
  );
}

export function HealthSkeleton() {
  return (
    <Card className="p-5 lg:col-span-2">
      <div className="adm-skeleton h-4 w-28" />
      <div className="adm-skeleton mt-4 h-16 w-full !rounded-adm-md" />
      <div className="adm-skeleton mt-3 h-16 w-full !rounded-adm-md" />
    </Card>
  );
}
