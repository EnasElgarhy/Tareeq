"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";
import { Field, Input } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import {
  createEmailInvite,
  revokeReportInvite,
  type InviteKind,
  type ReportInviteRow,
} from "@/lib/admin/access/actions";

/**
 * Report-access invites for people who may not have signed up yet. The admin
 * picks free or paid, types an address, and gets a link to share. Free links
 * unlock the recipient's latest completed assessment without payment; paid
 * links route them into the normal take-and-pay flow instead. The full token
 * is shown once (only its hash is stored).
 */
export function EmailInviteManager({
  invites,
}: {
  invites: ReportInviteRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<InviteKind>("free");
  const [freshLink, setFreshLink] = useState<{
    link: string;
    email: string;
    kind: InviteKind;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const pendingInvites = invites.filter((i) => i.status === "pending");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setFreshLink(null);
    const chosen = kind;
    startTransition(async () => {
      try {
        const res = await createEmailInvite(value, chosen);
        setFreshLink({
          link: res.link,
          email: value.toLowerCase(),
          kind: chosen,
        });
        setEmail("");
        toast(
          "success",
          chosen === "free"
            ? "Free-access link created. Share it with the student."
            : "Paid invite link created. They will pay as a normal user.",
        );
        router.refresh();
      } catch (err) {
        toast(
          "error",
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    });
  }

  function onRevoke(invitationId: string) {
    startTransition(async () => {
      try {
        await revokeReportInvite(invitationId);
        toast("success", "Invitation revoked.");
        router.refresh();
      } catch (err) {
        toast(
          "error",
          err instanceof Error ? err.message : "Something went wrong.",
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

  return (
    <div className="grid gap-3">
      <div
        className="flex flex-wrap items-center gap-1.5"
        aria-label="Access type: free or paid access to the premium report"
      >
        <Badge>Premium report</Badge>
      </div>
      <fieldset>
        <legend className="text-[11px] font-bold uppercase tracking-wider text-adm-ink-muted">
          Access type
        </legend>
        <div className="mt-1.5 grid gap-1.5">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-adm-sm border border-adm-line px-2.5 py-2 has-checked:border-adm-violet has-checked:bg-adm-violet/5">
            <input
              type="radio"
              name="invite-kind"
              value="free"
              checked={kind === "free"}
              onChange={() => setKind("free")}
              className="mt-0.5 accent-[var(--adm-violet)]"
            />
            <span>
              <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-adm-ink">
                Free <Badge tone="success">No payment</Badge>
              </span>
              <span className="mt-0.5 block text-[12px] text-adm-ink-muted">
                Unlocks their latest finished report instantly. Single use.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-adm-sm border border-adm-line px-2.5 py-2 has-checked:border-adm-violet has-checked:bg-adm-violet/5">
            <input
              type="radio"
              name="invite-kind"
              value="paid"
              checked={kind === "paid"}
              onChange={() => setKind("paid")}
              className="mt-0.5 accent-[var(--adm-violet)]"
            />
            <span>
              <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-adm-ink">
                Paid <Badge>Stripe checkout</Badge>
              </span>
              <span className="mt-0.5 block text-[12px] text-adm-ink-muted">
                They take the assessment and pay as a normal user. Reusable
                until expiry or revoke.
              </span>
            </span>
          </label>
        </div>
      </fieldset>
      <p className="text-[12px] leading-relaxed text-adm-ink-muted">
        They don&apos;t need an account yet. The link works once they sign in
        with the address below.
      </p>
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-2">
        <Field label="Email">
          {(p) => (
            <Input
              {...p}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-64"
              required
            />
          )}
        </Field>
        <Button type="submit" size="sm" loading={pending}>
          Generate link
        </Button>
      </form>

      {freshLink ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-adm-sm bg-adm-sand px-2 py-1.5 font-mono text-[11.5px] text-adm-ink">
            {freshLink.link}
          </code>
          <Button size="sm" variant="ghost" onClick={onCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}
      {freshLink ? (
        <p className="mt-1.5 text-[11.5px] text-adm-ink-faint">
          For {freshLink.email} ·{" "}
          {freshLink.kind === "paid" ? "reusable" : "single use"} · expires in 7
          days · won&apos;t be shown again.
        </p>
      ) : null}

      {pendingInvites.length > 0 ? (
        <ul className="grid gap-1.5">
          {pendingInvites.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-adm-sm border border-adm-line px-2.5 py-1.5 text-[12px]"
            >
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                {inv.kind === "paid" ? (
                  <Badge>Paid</Badge>
                ) : (
                  <Badge tone="success">Free</Badge>
                )}
                <span className="truncate font-semibold text-adm-ink">
                  {inv.email}
                </span>
              </span>
              <span className="text-adm-ink-faint">
                expires{" "}
                {new Date(inv.expiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => onRevoke(inv.id)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
