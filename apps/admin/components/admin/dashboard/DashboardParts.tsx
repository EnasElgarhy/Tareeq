import Link from "next/link";
import { cache } from "react";
import { AnimatedNumber } from "@/components/admin/dashboard/AnimatedNumber";
import { GenerationBadge } from "@/components/admin/GenerationBadge";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { Card } from "@/components/admin/ui/Card";
import {
  filterAttemptsByGeneration,
  versionIdsOf,
} from "@/lib/admin/assessment-generation";
import { loadVersionGenerations } from "@/lib/admin/assessment-generation.server";
import {
  countQuestionsByVersion,
  listContentVersions,
} from "@/lib/admin/content";
import {
  CORE_PACKAGE_VERSIONS,
  CORE_QUESTION_SET,
  countItems,
} from "@/lib/admin/core/framework";
import { tallyLeadingCuriosities } from "@/lib/admin/core/result";
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

/** CORE 2.0 attempts only, never mixed with the archived v4 assessment. */
const getCoreAttempts = cache(async () => {
  const sb = createSupabaseAdminClient();
  const generations = await loadVersionGenerations();
  const coreIds = versionIdsOf(generations, "core-2.0");
  if (coreIds.length === 0) return [];
  const { data, error } = await sb
    .from("assessments")
    .select("version_id,completed_at,result")
    .in("version_id", coreIds);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as {
    version_id: string;
    completed_at: string | null;
    result: unknown;
  }[];
  return filterAttemptsByGeneration(rows, generations, "core-2.0");
});

async function getCounts() {
  const sb = createSupabaseAdminClient();
  const head = { count: "exact" as const, head: true };
  try {
    const [attempts, u] = await Promise.all([
      getCoreAttempts(),
      sb.from("user_accounts").select("*", head),
    ]);
    const started = attempts.length;
    const completed = attempts.filter((a) => a.completed_at).length;
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
      <StatCard index={1} label="CORE 2.0 completed" value={c.completed} />
      <StatCard
        index={2}
        label="Completion rate"
        value={c.rate}
        suffix="%"
        sub={`${c.completed} of ${c.started} started`}
      />
      <StatCard index={3} label="CORE 2.0 started" value={c.started} />
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

/* ======================== Leading curiosities (CORE 2.0) ======================== */

export async function CoverageSection() {
  const attempts = await getCoreAttempts().catch(() => []);
  const completed = attempts.filter((a) => a.completed_at);
  const tally = tallyLeadingCuriosities(
    CORE_QUESTION_SET,
    completed.map((a) => a.result),
  );
  const max = Math.max(1, ...tally.map((t) => t.count));

  return (
    <Card className="adm-fade-up p-5 lg:col-span-3">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-adm-ink">
          Leading curiosities
        </h2>
        <p className="text-xs text-adm-ink-muted">
          CORE 2.0 · {completed.length} completed
        </p>
      </div>
      {completed.length > 0 ? (
        <ul className="grid gap-2">
          {tally.map((t, i) => (
            <li
              key={t.code}
              className="adm-fade-up grid grid-cols-[10rem_1fr_2.5rem] items-center gap-3 text-[13px]"
              style={{ animationDelay: `${120 + i * 40}ms` }}
            >
              <span className="truncate text-adm-ink-soft">{t.name}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-adm-sand">
                <span
                  className="adm-grow-x block h-full rounded-full bg-adm-violet"
                  style={{ width: `${Math.round((t.count / max) * 100)}%` }}
                />
              </span>
              <span className="text-right font-bold text-adm-ink">
                {t.count}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-adm-ink-muted">
          No completed CORE 2.0 assessments yet.
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
  const [{ versions, counts }, generations] = await Promise.all([
    getVersionsData(),
    loadVersionGenerations(),
  ]);
  const legacyIds = new Set(versionIdsOf(generations, "legacy-v4"));
  const archived = versions.filter((v) => legacyIds.has(v.id));
  const archivedQuestions = archived.reduce(
    (n, v) => n + (counts[v.id] ?? 0),
    0,
  );

  return (
    <Card
      className="adm-fade-up p-5 lg:col-span-2"
      style={{ animationDelay: "60ms" }}
    >
      <h2 className="mb-4 text-base font-bold text-adm-ink">Content health</h2>
      <div className="space-y-3">
        <Link
          href="/admin/content/core"
          className="adm-lift block rounded-adm-md border border-adm-line bg-adm-sand/70 p-4 hover:border-adm-violet"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-adm-ink">CORE 2.0</p>
            <StatusBadge status="published" />
          </div>
          <p className="mt-1 text-xs text-adm-ink-muted">
            Question set {CORE_PACKAGE_VERSIONS.questionSet} ·{" "}
            {countItems(CORE_QUESTION_SET)} questions · current assessment
          </p>
        </Link>
        {archived.length > 0 && (
          <Link
            href="/admin/content#archived-assessments"
            className="adm-lift block rounded-adm-md border border-dashed border-adm-line-strong p-4 hover:border-adm-violet"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-adm-ink">
                Archived v4
              </p>
              <GenerationBadge generation="legacy-v4" />
            </div>
            <p className="mt-1 text-xs text-adm-ink-muted">
              {archived.length} {archived.length === 1 ? "version" : "versions"}{" "}
              · {archivedQuestions} questions · read-only
            </p>
          </Link>
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
