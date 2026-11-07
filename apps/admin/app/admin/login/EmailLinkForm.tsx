"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input } from "@/components/admin/ui/Field";
import { InlineStatus } from "@/components/admin/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Supabase lets one address request an email this often. */
const RESEND_AFTER_SECONDS = 60;
const CODE_PATTERN = /^\d{6}$/;

type Stage = { kind: "enter" } | { kind: "sent"; email: string };

interface EmailLinkFormProps {
  /** "password" after "Forgot password?": land on the new-password page. */
  next?: "password";
  initialEmail?: string;
}

/**
 * Passwordless sign-in: an emailed link, or the 6-digit code in the same
 * email (the template is shared with the student site, which uses the code).
 * Only existing accounts get an email; requireAdmin then decides who gets in.
 */
export function EmailLinkForm({ next, initialEmail = "" }: EmailLinkFormProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "enter" });
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function sendLink(address: string) {
    setError(null);
    setLoading(true);
    const { error: sendError } =
      await createSupabaseBrowserClient().auth.signInWithOtp({
        email: address,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/admin/auth/callback?flow=login${next ? `&next=${next}` : ""}`,
        },
      });
    setLoading(false);
    // An unknown address gets the same screen as a known one, so the form
    // never says who has an account. Only a rate limit is worth telling.
    if (sendError?.status === 429) {
      setError("Too many emails requested. Wait a minute, then try again.");
      return;
    }
    setStage({ kind: "sent", email: address });
    setResendIn(RESEND_AFTER_SECONDS);
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    await sendLink(email.trim().toLowerCase());
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (stage.kind !== "sent") return;
    const token = code.trim();
    if (!CODE_PATTERN.test(token)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error: verifyError } =
      await createSupabaseBrowserClient().auth.verifyOtp({
        email: stage.email,
        token,
        type: "email",
      });
    if (verifyError) {
      setError("That code didn't work. It may have expired; send a new email.");
      setLoading(false);
      return;
    }
    router.replace(next === "password" ? "/admin/password" : "/admin/content");
    router.refresh();
  }

  if (stage.kind === "enter") {
    return (
      <form
        onSubmit={onSend}
        className="space-y-4"
        aria-label="Email me a sign-in link"
      >
        <Field label="Work email">
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="email"
              placeholder="you@mapmycore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
        </Field>
        {error && <InlineStatus kind="error">{error}</InlineStatus>}
        <Button type="submit" loading={loading} className="w-full">
          {loading ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onVerify}
      className="space-y-4"
      aria-label="Enter your sign-in code"
    >
      <InlineStatus kind="success">
        If {stage.email} has admin access, a sign-in email is on its way. Open
        the link in this browser, or enter the code from the email below.
      </InlineStatus>
      <Field label="6-digit code">
        {(p) => (
          <Input
            {...p}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        )}
      </Field>
      {error && <InlineStatus kind="error">{error}</InlineStatus>}
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in with code"}
      </Button>
      <div className="flex items-center justify-between text-xs text-adm-ink-muted">
        <button
          type="button"
          className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
          disabled={resendIn > 0 || loading}
          onClick={() => sendLink(stage.email)}
        >
          {resendIn > 0 ? `Send again in ${resendIn}s` : "Send again"}
        </button>
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={() => {
            setStage({ kind: "enter" });
            setCode("");
            setError(null);
          }}
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}
