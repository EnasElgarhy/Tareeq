"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input } from "@/components/admin/ui/Field";
import { InlineStatus } from "@/components/admin/ui/Toast";
import { finalizeInvite } from "@/lib/admin/team/accept-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Phase = "checking" | "ready" | "submitting" | "done" | "error";

/**
 * Invite acceptance. The Supabase invite link → /admin/auth/callback (exchanges
 * the code, sets the session) → here. The invitee sets a password, then we
 * finalize their team membership and drop them into the admin.
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("error") ===
      "invalid_or_expired"
    ) {
      setError(
        "This invitation link is invalid or has expired. Ask an admin to resend it.",
      );
      setPhase("error");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email);
        setPhase("ready");
      } else {
        setError(
          "We couldn't verify your invitation. Open the link directly from your invitation email.",
        );
        setPhase("error");
      }
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Choose a password of at least 8 characters.");
      return;
    }
    setError(null);
    setPhase("submitting");
    const supabase = createSupabaseBrowserClient();
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      setError(pwErr.message);
      setPhase("ready");
      return;
    }
    const result = await finalizeInvite();
    if (!result.ok) {
      setError(
        result.error ?? "Something went wrong finalizing your invitation.",
      );
      setPhase("ready");
      return;
    }
    setPhase("done");
    router.replace("/admin/content");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-adm-paper p-6">
      <div className="w-full max-w-sm rounded-adm-xl border border-adm-line bg-adm-card p-7 shadow-adm-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-adm-violet">
          Tareeq Admin
        </p>
        <h1 className="mt-1 text-lg font-bold text-adm-ink">
          Accept your invitation
        </h1>

        {phase === "checking" ? (
          <p className="mt-3 text-sm text-adm-ink-muted">
            Verifying your invitation…
          </p>
        ) : phase === "error" ? (
          <div className="mt-3">
            <InlineStatus kind="error">{error}</InlineStatus>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            <p className="text-sm leading-relaxed text-adm-ink-muted">
              You&apos;re joining as{" "}
              <span className="font-semibold text-adm-ink">{email}</span>. Set a
              password to finish.
            </p>
            <Field label="Password">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              )}
            </Field>
            {error ? <InlineStatus kind="error">{error}</InlineStatus> : null}
            <Button
              type="submit"
              loading={phase === "submitting" || phase === "done"}
            >
              Set password &amp; enter
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
