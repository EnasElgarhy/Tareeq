import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { TeamManager } from "@/components/admin/team/TeamManager";
import { getTeam } from "@/lib/admin/team/queries";
import { requirePermission } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const identity = await requirePermission("team.manage");
  const team = await getTeam();

  return (
    <>
      <PageHeader
        kicker="Admin · Team"
        title="Team & access"
        description="Invite teammates and control what each of them can do."
      />

      {!team.available ? (
        <Card tone="tinted" className="p-4 text-[13px] text-adm-ink-soft">
          <span className="mr-1.5 rounded-full bg-adm-gold/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-adm-gold-ink">
            Pending migration
          </span>
          Team management needs the <code>admin_members</code> / <code>admin_invitations</code> tables from
          migration <code>202607150002</code>, which isn&apos;t applied yet. Once applied (and SMTP is configured
          in Supabase for invite emails), invitations and roles become available here.
        </Card>
      ) : (
        <TeamManager
          members={team.members}
          invitations={team.invitations}
          viewerRole={identity.role}
          viewerId={identity.id}
        />
      )}
    </>
  );
}
