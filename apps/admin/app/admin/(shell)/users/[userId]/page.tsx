import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/Badge";
import { CopyId } from "@/components/admin/users/CopyId";
import {
  EngagementBadge,
  InitialsAvatar,
  relativeTime,
  ResultCell,
  RiskBadge,
} from "@/components/admin/users/UserBadges";
import { getUserDetail } from "@/lib/admin/users/queries";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "Not collected";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-2 mt-6 flex items-baseline justify-between">
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-adm-ink-muted">{children}</h2>
      {note ? <span className="text-[11px] text-adm-ink-faint">{note}</span> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-adm-md border border-adm-line bg-adm-sand px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-adm-ink-muted">{label}</p>
      <p className="mt-0.5 text-[15px] font-black text-adm-ink">{value}</p>
    </div>
  );
}

function Gated({ children }: { children: React.ReactNode }) {
  return (
    <Card tone="tinted" className="p-4 text-[12.5px] text-adm-ink-soft">
      <span className="mr-1.5 rounded-full bg-adm-gold/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-adm-gold-ink">
        Pending migration
      </span>
      {children}
    </Card>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const now = new Date().toISOString();
  const user = await getUserDetail(userId, now);
  if (!user) notFound();

  const a = user.aggregate;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-adm-ink-muted">
        <Link href="/admin/users" className="font-semibold text-adm-violet hover:text-adm-deep">Users</Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-adm-ink-soft">{user.name ?? "Unnamed student"}</span>
      </nav>

      <PageHeader kicker="Admin · Users" title={user.name ?? "Unnamed student"} />

      {/* Header card */}
      <Card className="mb-2 flex flex-wrap items-center gap-4 p-5">
        <InitialsAvatar name={user.name} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-black text-adm-ink">{user.name ?? "Unnamed student"}</span>
            <StatusBadge status={user.status === "deleted" ? "archived" : "published"} />
            <RiskBadge level={user.risk.level} />
            <EngagementBadge level={user.engagement.level} />
          </div>
          <p className="mt-0.5 text-[13px] text-adm-ink-soft">{user.email ?? "no email on file"}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-adm-ink-muted">
            <span>Language: <b className="uppercase text-adm-ink-soft">{user.language ?? "—"}</b></span>
            <span>Country: <b className="text-adm-ink-soft">{user.country ?? "Not collected"}</b></span>
            <span>Registered: <b className="text-adm-ink-soft">{formatDate(user.registeredAt)}</b></span>
            <span>Last active: <b className="text-adm-ink-soft">{relativeTime(user.lastActiveAt)}</b></span>
          </div>
        </div>
        <CopyId id={user.id} />
      </Card>

      {/* Overview */}
      <SectionTitle>Overview</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="Assessments" value={`${a.assessmentsCompleted}/${a.assessmentsStarted}`} />
        <Stat label="Kai sessions" value={a.kaiSessions} />
        <Stat label="Kai messages" value={a.kaiMessages} />
        <Stat label="Plans saved" value={a.plansSaved} />
        <Stat label="Tasks done" value={a.tasksCompleted} />
        <Stat label="Engagement" value={user.engagement.score} />
      </div>
      {user.risk.reasons.length > 0 ? (
        <Card className="mt-2 p-4">
          <p className="mb-1.5 text-[12px] font-bold text-adm-ink">Needs attention</p>
          <ul className="grid gap-1 text-[12.5px] text-adm-ink-soft">
            {user.risk.reasons.map((r) => (
              <li key={r.code} className="flex items-center gap-2">
                <span aria-hidden className="text-adm-gold-ink">•</span>
                {r.label}
                <span className="text-[10px] uppercase text-adm-ink-faint">({r.severity})</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Journey */}
      <SectionTitle note="verified from real records">Journey</SectionTitle>
      {user.timeline.length === 0 ? (
        <Card className="p-4 text-[12.5px] text-adm-ink-faint">No recorded activity yet.</Card>
      ) : (
        <Card className="p-5">
          <ol className="relative ml-2 border-l border-adm-line">
            {user.timeline.map((e, i) => (
              <li key={`${e.code}-${i}`} className="mb-3 ml-4 last:mb-0">
                <span aria-hidden className="absolute -left-[5px] mt-1 h-2 w-2 rounded-full bg-adm-violet" />
                <p className="text-[13px] font-semibold text-adm-ink">{e.label}</p>
                <p className="text-[11px] text-adm-ink-faint">{formatDate(e.at)}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Assessments */}
      <SectionTitle>Assessments</SectionTitle>
      {user.assessments.length === 0 ? (
        <Card className="p-4 text-[12.5px] text-adm-ink-faint">No assessments taken.</Card>
      ) : (
        <div className="grid gap-2">
          {user.assessments.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-[13px] font-bold text-adm-ink">{s.label}</p>
                <p className="text-[11px] text-adm-ink-faint">
                  {s.completedAt ? `Completed ${formatDate(s.completedAt)}` : `Started ${formatDate(s.startedAt)} · in progress`}
                  {s.locale ? ` · ${s.locale.toUpperCase()}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ResultCell value={s.primaryCluster} />
                {s.archetype ? <span className="text-[12px] text-adm-ink-soft">{s.archetype}</span> : null}
                {s.confidence !== null ? <span className="text-[11px] text-adm-ink-faint">{s.confidence}% conf.</span> : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Kai */}
      <SectionTitle>Kai engagement</SectionTitle>
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Opened Kai" value={a.kaiOpened ? "Yes" : "No"} />
          <Stat label="Sessions" value={a.kaiSessions} />
          <Stat label="Messages" value={a.kaiMessages} />
          <Stat label="Tasks done" value={a.tasksCompleted} />
        </div>
        <p className="mt-3 text-[11.5px] text-adm-ink-faint">
          Private conversation content is never shown here — it lives only on the student’s device
          (localStorage). This summary is derived from anonymised analytics events.
        </p>
      </Card>

      {/* Plans */}
      <SectionTitle>Saved plans</SectionTitle>
      <Card tone="tinted" className="p-4 text-[12.5px] text-adm-ink-soft">
        Plan contents aren’t available in the CMS yet — saved plans currently persist only on the
        student’s device. The <b>{a.plansSaved}</b> plan-save event{a.plansSaved === 1 ? "" : "s"} above
        {a.plansSaved === 1 ? " is" : " are"} counted from analytics. Server-side plan persistence is a
        consumer gap tracked for later.
      </Card>

      {/* Notes & flags + Account (gated) */}
      <SectionTitle>Notes &amp; flags</SectionTitle>
      <Gated>
        Internal notes and flags need the <code>admin_user_notes</code> / <code>admin_user_flags</code>{" "}
        tables from migration <code>202607150001</code>, which isn’t applied yet. Once applied, admins can
        add notes and flag students here.
      </Gated>

      <SectionTitle>Account</SectionTitle>
      <Card className="p-4">
        <div className="grid gap-1.5 text-[12.5px] text-adm-ink-soft">
          <span>User ID: <span className="font-mono text-[11px] text-adm-ink-muted">{user.id}</span></span>
          <span>Email verified: <b className="text-adm-ink-soft">{user.emailVerified === null ? "Unknown" : user.emailVerified ? "Yes" : "No"}</b></span>
          <span>Status: <b className="text-adm-ink-soft">{user.status}</b></span>
        </div>
        <p className="mt-3 text-[11.5px] text-adm-ink-faint">
          Account actions (suspend, reset auth, deletion request) require migration{" "}
          <code>202607150001</code> plus a defined workflow — not enabled yet.
        </p>
      </Card>
    </>
  );
}
