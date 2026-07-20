import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import {
  EngagementBadge,
  InitialsAvatar,
  relativeTime,
  ResultCell,
  RiskBadge,
} from "@/components/admin/users/UserBadges";
import { filtersToSearchParams, isDefaultFilter, parseUserFilters, type RawParams } from "@/lib/admin/users/filters";
import { pageCount, parsePagination } from "@/lib/admin/users/pagination";
import { getUsersList } from "@/lib/admin/users/queries";
import { parseSort } from "@/lib/admin/users/sort";

export const dynamic = "force-dynamic";

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-muted">{label}</p>
      <p className="mt-1 text-[26px] font-black leading-none text-adm-ink">{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-adm-ink-faint">{sub}</p> : null}
    </Card>
  );
}

function pct(n: number | null): string {
  return n === null ? "—" : `${n}%`;
}

const FILTER_SELECTS: Array<{ name: string; label: string; options: Array<[string, string]> }> = [
  { name: "account", label: "Account", options: [["all", "All"], ["active", "Active"], ["deleted", "Deleted"]] },
  { name: "language", label: "Language", options: [["all", "All"], ["en", "English"], ["ar", "Arabic"]] },
  {
    name: "assessment",
    label: "Assessment",
    options: [["all", "All"], ["none", "Not started"], ["in_progress", "In progress"], ["compass_completed", "Compass done"], ["multiple_completed", "Multiple done"]],
  },
  { name: "kai", label: "Kai", options: [["all", "All"], ["never", "Never opened"], ["used", "Used Kai"], ["has_plans", "Has plans"]] },
  {
    name: "activity",
    label: "Activity",
    options: [["all", "All"], ["active_7d", "Active 7d"], ["active_30d", "Active 30d"], ["inactive_30d", "Inactive 30d+"], ["inactive_90d", "Inactive 90d+"]],
  },
  { name: "risk", label: "Risk", options: [["all", "All"], ["healthy", "Healthy"], ["needs_attention", "Needs attention"], ["high_risk", "High risk"]] },
];

const SORT_OPTIONS: Array<[string, string]> = [
  ["registered_desc", "Newest"],
  ["registered_asc", "Oldest"],
  ["last_active", "Last active"],
  ["assessments", "Assessments"],
  ["kai", "Kai activity"],
  ["risk", "Risk severity"],
  ["name", "Name A–Z"],
];

const selectCls =
  "rounded-adm-md border border-adm-line bg-adm-card px-2.5 py-1.5 text-[12px] font-semibold text-adm-ink-soft focus:border-adm-violet focus:outline-none";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const filter = parseUserFilters(params);
  const sort = parseSort(typeof params.sort === "string" ? params.sort : null);
  const pagination = parsePagination(
    typeof params.page === "string" ? params.page : null,
    typeof params.perPage === "string" ? params.perPage : null,
  );
  const now = new Date().toISOString();
  const { rows, total, summary } = await getUsersList(filter, sort, pagination, now);

  const totalPages = pageCount(total, pagination.perPage);
  const baseParams = filtersToSearchParams(filter);
  if (!parseSort(sort)) baseParams.delete("sort");
  if (sort !== "registered_desc") baseParams.set("sort", sort);
  const pageHref = (p: number) => {
    const sp = new URLSearchParams(baseParams);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        kicker="Admin · Users"
        title="Students & accounts"
        description="Search, review and support the students using Tareeq."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Metric label="Registered" value={String(summary.totalUsers)} />
        <Metric label="New · 30d" value={String(summary.newInPeriod)} />
        <Metric label="Compass rate" value={pct(summary.compassCompletionRate)} sub="of those who started" />
        <Metric label="Kai adoption" value={pct(summary.kaiAdoptionRate)} sub="of all users" />
        <Metric label="Active · 30d" value={String(summary.activeLast30d)} />
      </div>

      {/* Filters — GET form, so state lives entirely in the URL. */}
      <form method="get" action="/admin/users" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-adm-ink-muted">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={filter.search ?? ""}
            placeholder="Name, email, ID, country"
            className={`${selectCls} w-56`}
          />
        </label>
        {FILTER_SELECTS.map((s) => (
          <label key={s.name} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-adm-ink-muted">{s.label}</span>
            <select name={s.name} defaultValue={(filter as unknown as Record<string, string>)[s.name]} className={selectCls}>
              {s.options.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-adm-ink-muted">Sort</span>
          <select name="sort" defaultValue={sort} className={selectCls}>
            {SORT_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-adm-md bg-adm-violet px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-adm-deep"
        >
          Apply
        </button>
        {!isDefaultFilter(filter) || sort !== "registered_desc" ? (
          <Link href="/admin/users" className="px-2 py-1.5 text-[12px] font-semibold text-adm-violet hover:text-adm-deep">
            Clear
          </Link>
        ) : null}
      </form>

      {summary.totalUsers === 0 ? (
        <EmptyState title="No students yet" description="Registered students will appear here once people sign up." />
      ) : rows.length === 0 ? (
        <EmptyState title="No matches" description="No students match these filters. Try clearing them." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Lang</Th>
                <Th>Country</Th>
                <Th>Status</Th>
                <Th className="text-right">Done</Th>
                <Th>Result</Th>
                <Th className="text-right">Kai</Th>
                <Th className="text-right">Plans</Th>
                <Th>Last active</Th>
                <Th>Risk</Th>
                <Th>Engagement</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Link href={`/admin/users/${r.id}`} className="flex items-center gap-2.5 font-semibold text-adm-ink hover:text-adm-violet">
                      <InitialsAvatar name={r.name} />
                      <span className="min-w-0">
                        <span className="block truncate">{r.name ?? "Unnamed"}</span>
                        <span className="block truncate text-[11px] font-normal text-adm-ink-faint">{r.email ?? "no email"}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="uppercase text-adm-ink-muted">{r.language ?? "—"}</Td>
                  <Td className="text-adm-ink-soft">{r.country ?? "—"}</Td>
                  <Td><StatusBadge status={r.status === "deleted" ? "archived" : "published"} /></Td>
                  <Td className="text-right tabular-nums">{r.assessmentsCompleted}</Td>
                  <Td><ResultCell value={r.primaryResult} /></Td>
                  <Td className="text-right tabular-nums">{r.kaiSessions}</Td>
                  <Td className="text-right tabular-nums">{r.plansSaved}</Td>
                  <Td className="text-adm-ink-soft">{relativeTime(r.lastActiveAt)}</Td>
                  <Td><RiskBadge level={r.risk} /></Td>
                  <Td><EngagementBadge level={r.engagement} /></Td>
                  <Td>
                    <Link href={`/admin/users/${r.id}`} className="text-adm-violet hover:text-adm-deep" aria-label="Open student">→</Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <div className="mt-3 flex items-center justify-between text-[12px] text-adm-ink-muted">
            <span>
              {total} student{total === 1 ? "" : "s"} · page {pagination.page} of {totalPages}
            </span>
            <span className="flex gap-2">
              {pagination.page > 1 ? (
                <Link href={pageHref(pagination.page - 1)} className="rounded-adm-md border border-adm-line px-2.5 py-1 font-semibold text-adm-ink-soft hover:bg-adm-sand">
                  ← Prev
                </Link>
              ) : null}
              {pagination.page < totalPages ? (
                <Link href={pageHref(pagination.page + 1)} className="rounded-adm-md border border-adm-line px-2.5 py-1 font-semibold text-adm-ink-soft hover:bg-adm-sand">
                  Next →
                </Link>
              ) : null}
            </span>
          </div>
        </>
      )}
    </>
  );
}
