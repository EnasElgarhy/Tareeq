"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input } from "@/components/admin/ui/Field";
import { InlineStatus } from "@/components/admin/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Night backdrop with a faint, static compass-ring motif. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-on-dark adm-night-glow relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <svg
        viewBox="0 0 600 600"
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] opacity-[0.16]"
        fill="none"
      >
        <circle cx="300" cy="300" r="280" stroke="#9D7FF0" strokeWidth="1" />
        <circle cx="300" cy="300" r="210" stroke="#9D7FF0" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="300" cy="300" r="140" stroke="#C8B6F0" strokeWidth="1" />
        <path d="M300 80 L320 300 L300 520 L280 300 Z" fill="#6E48E4" />
      </svg>
      <div className="adm-fade-up relative w-full max-w-sm">{children}</div>
    </div>
  );
}

function Wordmark({ caption }: { caption: string }) {
  return (
    <div className="mb-6 text-center">
      <p className="adm-display text-3xl text-adm-paper">Tareeq</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-adm-violet-soft">
        {caption}
      </p>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notAdmin = params.get("error") === "not_admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  if (!configured) {
    return (
      <Shell>
        <Wordmark caption="Admin console" />
        <div className="rounded-adm-xl border border-adm-line bg-adm-card p-7 shadow-adm-lg">
          <h1 className="text-lg font-bold text-adm-ink">
            Supabase isn&apos;t configured
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-adm-ink-muted">
            Add <code className="rounded bg-adm-sand px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-adm-sand px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            and{" "}
            <code className="rounded bg-adm-sand px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            to <code className="rounded bg-adm-sand px-1">.env.local</code>, then
            restart. See{" "}
            <code className="rounded bg-adm-sand px-1">docs/ADMIN_SETUP.md</code>.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Wordmark caption="Admin console" />
      <form
        onSubmit={onSubmit}
        className="rounded-adm-xl border border-adm-line bg-adm-card p-7 shadow-adm-lg"
        aria-label="Sign in"
      >
        <h1 className="text-lg font-bold text-adm-ink">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-adm-ink-muted">
          Sign in to manage the compass.
        </p>

        <div className="space-y-4">
          {notAdmin && (
            <InlineStatus kind="error">
              That account isn&apos;t an admin. Ask an existing admin for access.
            </InlineStatus>
          )}

          <Field label="Work email">
            {(p) => (
              <Input
                {...p}
                type="email"
                autoComplete="email"
                placeholder="you@tareeq.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Password">
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
          </Field>

          {error && <InlineStatus kind="error">{error}</InlineStatus>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>

        <p className="mt-5 border-t border-adm-line pt-4 text-center text-xs text-adm-ink-muted">
          Access is invite-only. Ask your team lead for an account.
        </p>
      </form>
    </Shell>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
