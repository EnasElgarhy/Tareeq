"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";
import { Card } from "@/components/admin/ui/Card";
import { InlineStatus, useToast } from "@/components/admin/ui/Toast";
import {
  createReportInvite,
  revokeReportInvite,
  type ReportInviteRow,
} from "@/lib/admin/access/actions";

export interface GrantableAssessment {
  id: string;
  label: string;
  completedAt: string | null;
}

/**
 * Free report-access grants for one student. Per completed assessment the
 * admin can mint a single-use invite link; the token itself is shown once
 * (only its hash is stored) with a copy button, then the pending invite can
 * be revoked until redeemed or expired.
 */
export function FreeAccessManager({
  userId,
  assessments,
  invites,
}: {
  userId: string;
  assessments: GrantableAssessment[];
  invites: ReportInviteRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  // The freshly-minted link — the only time the full token exists.
  const [freshLink, setFreshLink] = useState<{
    link: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const completed = assessments.filter((a) => a.completedAt);
  const pendingFor = (assessmentId: string) =>
    invites.find(
      (i) => i.assessmentId === assessmentId && i.status === "pending",
    );

  function onGrant(assessmentId: string) {
    setFreshLink(null);
    setActiveId(assessmentId);
    startTransition(async () => {
      try {
        const res = await createReportInvite(userId, assessmentId);
        if (res.alreadyOwned) {
          toast("info", "This report is already unlocked for the student.");
        } else {
          setFreshLink({ link: res.link, expiresAt: res.expiresAt });
          toast(
            "success",
            "Free-access link created. Share it with the student.",
          );
        }
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "Something went wrong.",
        );
      } finally {
        setActiveId(null);
      }
    });
  }

  function onRevoke(invitationId: string) {
    startTransition(async () => {
      try {
        await revokeReportInvite(invitationId);
        toast("success", "Invitation revoked.");
        router.refresh();
      } catch (e) {
        toast(
          "error",
          e instanceof Error ? e.message : "Something went wrong.",
        );
      }
    });
  }

  async function onCopy() {
    if (!freshLink) return;
    try {
      await navigator.clipboard.writeText(freshLink.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("error", "Copy failed — select the link manually.");
    }
  }

  if (completed.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-adm-ink-muted">
        <Badge tone="success">Free</Badge>
        <Badge>Premium report</Badge>
        <span>Each grant unlocks the premium report without payment.</span>
      </p>
      {freshLink ? (
        <Card tone="tinted" className="p-4">
          <InlineStatus kind="success">
            Share this one-time link with the student. It won&apos;t be shown
            again.
          </InlineStatus>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-adm-sm bg-adm-card px-2 py-1.5 font-mono text-[11.5px] text-adm-ink">
              {freshLink.link}
            </code>
            <Button size="sm" variant="ghost" onClick={onCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-1.5 text-[11.5px] text-adm-ink-faint">
            Expires{" "}
            {new Date(freshLink.expiresAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · single use · revocable below until redeemed.
          </p>
        </Card>
      ) : null}
      {completed.map((a) => {
        const invite = pendingFor(a.id);
        return (
          <Card
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="text-[13px] font-bold text-adm-ink">{a.label}</p>
              <p className="text-[11px] text-adm-ink-faint">
                {invite
                  ? `Invite pending · expires ${new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Report access not granted"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {invite ? (
                <Button
                  size="sm"
                  variant="danger"
                  loading={pending}
                  onClick={() => onRevoke(invite.id)}
                >
                  Revoke invite
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={pending && activeId === a.id}
                  onClick={() => onGrant(a.id)}
                >
                  Give free access
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
