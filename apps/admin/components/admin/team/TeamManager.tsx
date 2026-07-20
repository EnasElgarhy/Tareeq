"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input, Select } from "@/components/admin/ui/Field";
import { Table, Td, Th, Tr } from "@/components/admin/ui/Table";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { InlineStatus, type StatusKind, useToast } from "@/components/admin/ui/Toast";
import { InitialsAvatar } from "@/components/admin/users/UserBadges";
import {
  changeRole,
  type InviteResult,
  inviteMember,
  removeMember,
  resendInvite,
  revokeInvite,
  setMemberStatus,
} from "@/lib/admin/team/actions";
import {
  ADMIN_ROLES,
  type AdminRole,
  canManageTargetRole,
  ROLE_LABELS,
} from "@/lib/admin/team/permissions";
import type { TeamInvitation, TeamMember } from "@/lib/admin/team/queries";

export function TeamManager({
  members,
  invitations,
  viewerRole,
  viewerId,
}: {
  members: TeamMember[];
  invitations: TeamInvitation[];
  viewerRole: AdminRole;
  viewerId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("viewer");
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  // Persistent banner for invite/resend results: the "already has an account"
  // message carries an accept URL the admin needs to read, so a 3.6s toast
  // won't do — it stays until dismissed or the next invite action.
  const [notice, setNotice] = useState<{ kind: StatusKind; message: string } | null>(null);

  const assignableRoles = ADMIN_ROLES.filter((r) => canManageTargetRole(viewerRole, r));

  function run(fn: () => Promise<void>, okMsg: string) {
    startTransition(async () => {
      try {
        await fn();
        toast("success", okMsg);
        router.refresh();
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  /** For actions that report a nuanced outcome (invite/resend). */
  function runInvite(fn: () => Promise<InviteResult>) {
    setNotice(null);
    startTransition(async () => {
      try {
        const res = await fn();
        setNotice({ kind: res.outcome === "emailed" ? "success" : "info", message: res.message });
        router.refresh();
      } catch (e) {
        setNotice({ kind: "error", message: e instanceof Error ? e.message : "Something went wrong." });
      }
    });
  }

  function onInvite(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    runInvite(async () => {
      const res = await inviteMember(value, inviteRole);
      setEmail("");
      return res;
    });
  }

  return (
    <div className="grid gap-6">
      {/* Invite */}
      <section className="rounded-adm-lg border border-adm-line bg-adm-card p-5 shadow-adm-xs">
        <h2 className="text-[13px] font-bold text-adm-ink">Invite a teammate</h2>
        <p className="mt-0.5 text-[12px] text-adm-ink-muted">
          New teammates get an email invite, set a password, and land in the admin with the role you pick.
          Someone who already has an account is added without an email — they accept by signing in.
        </p>
        <form onSubmit={onInvite} className="mt-3 flex flex-wrap items-end gap-2">
          <Field label="Email">
            {(p) => (
              <Input
                {...p}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@team.com"
                className="w-64"
                required
              />
            )}
          </Field>
          <Field label="Role">
            {(p) => (
              <Select {...p} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as AdminRole)}>
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
            )}
          </Field>
          <Button type="submit" loading={pending}>Send invite</Button>
        </form>
        {notice ? (
          <div className="mt-3 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <InlineStatus kind={notice.kind}>{notice.message}</InlineStatus>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="mt-1 shrink-0 rounded p-1 text-[11px] font-semibold text-adm-ink-faint hover:text-adm-ink"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </section>

      {/* Members */}
      <section>
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-adm-ink-muted">
          Members ({members.length})
        </h2>
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const manageable = canManageTargetRole(viewerRole, m.role) && m.userId !== viewerId;
              return (
                <Tr key={m.userId}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <InitialsAvatar name={m.name} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-adm-ink">{m.name ?? "Unnamed"}</span>
                        <span className="block truncate text-[11px] text-adm-ink-faint">{m.email ?? "no email"}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    {manageable ? (
                      <Select
                        value={m.role}
                        onChange={(e) => run(() => changeRole(m.userId, e.target.value), "Role updated.")}
                        className="!py-1 text-[12px]"
                      >
                        {assignableRoles.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </Select>
                    ) : (
                      <span className="text-[12px] font-semibold text-adm-ink-soft">{ROLE_LABELS[m.role]}</span>
                    )}
                  </Td>
                  <Td>
                    <span className={m.status === "suspended" ? "text-adm-gold-ink" : "text-adm-mint-ink"}>
                      {m.status === "suspended" ? "Suspended" : "Active"}
                    </span>
                  </Td>
                  <Td>
                    {manageable ? (
                      <span className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              () => setMemberStatus(m.userId, m.status === "suspended" ? "active" : "suspended"),
                              m.status === "suspended" ? "Reactivated." : "Suspended.",
                            )
                          }
                          className="rounded-adm-md border border-adm-line px-2 py-1 text-[11px] font-semibold text-adm-ink-soft hover:bg-adm-sand"
                        >
                          {m.status === "suspended" ? "Reactivate" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(m)}
                          className="rounded-adm-md border border-adm-line px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      <span className="text-[11px] text-adm-ink-faint">{m.userId === viewerId ? "You" : "—"}</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 ? (
        <section>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-adm-ink-muted">
            Pending invitations ({invitations.length})
          </h2>
          <Table>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="text-adm-ink">{inv.email}</Td>
                  <Td className="text-adm-ink-soft">{ROLE_LABELS[inv.role]}</Td>
                  <Td>
                    <span className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => runInvite(() => resendInvite(inv.id))}
                        className="rounded-adm-md border border-adm-line px-2 py-1 text-[11px] font-semibold text-adm-ink-soft hover:bg-adm-sand"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        onClick={() => run(() => revokeInvite(inv.id), "Invite revoked.")}
                        className="rounded-adm-md border border-adm-line px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Revoke
                      </button>
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remove this member?"
        description={`${confirmRemove?.name ?? confirmRemove?.email ?? "This member"} will lose all admin access. Their account is kept but drops off the team.`}
        confirmLabel="Remove"
        variant="danger"
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          const target = confirmRemove;
          setConfirmRemove(null);
          if (target) run(() => removeMember(target.userId), "Member removed.");
        }}
      />
    </div>
  );
}
