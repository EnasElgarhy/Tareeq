"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input } from "@/components/admin/ui/Field";
import { InlineStatus } from "@/components/admin/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EmailLinkForm } from "./EmailLinkForm";

/** Google stays hidden until the provider is enabled in Supabase. */
const GOOGLE_SIGN_IN = process.env.NEXT_PUBLIC_ADMIN_GOOGLE_SIGNIN === "true";

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
        <circle
          cx="300"
          cy="300"
          r="210"
          stroke="#9D7FF0"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
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
      <p className="adm-display text-3xl text-adm-paper">Map My CORE</p>
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
  const signInFailed = params.get("error") === "signin";

  const [mode, setMode] = useState<"link" | "password" | "forgot">("link");
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
    router.replace("/admin/content");
    router.refresh();
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    const { error: oauthError } =
      await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback?flow=login`,
        },
      });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
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
            Add{" "}
            <code className="rounded bg-adm-sand px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            ,{" "}
            <code className="rounded bg-adm-sand px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-adm-sand px-1">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            to <code className="rounded bg-adm-sand px-1">.env.local</code>,
            then restart. See{" "}
            <code className="rounded bg-adm-sand px-1">
              docs/ADMIN_SETUP.md
            </code>
            .
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Wordmark caption="Admin console" />
      <section
        className="rounded-adm-xl border border-adm-line bg-adm-card p-7 shadow-adm-lg"
        aria-labelledby="admin-sign-in-heading"
      >
        <h1
          id="admin-sign-in-heading"
          className="text-lg font-bold text-adm-ink"
        >
          Welcome back
        </h1>
        <p className="mb-6 mt-1 text-sm text-adm-ink-muted">
          Sign in to manage the compass.
        </p>

        <div className="space-y-4">
          {notAdmin && (
            <InlineStatus kind="error">
              That account isn&apos;t an admin. Ask an existing admin for
              access.
            </InlineStatus>
          )}

          {signInFailed && (
            <InlineStatus kind="error">
              That sign-in link didn&apos;t work. It may have expired or been
              opened in another browser. Send a new one.
            </InlineStatus>
          )}

          {GOOGLE_SIGN_IN && (
            <>
              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-adm-md border border-adm-line bg-white text-sm font-semibold text-adm-ink transition-colors hover:bg-adm-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-violet-soft disabled:opacity-60"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"
                  />
                  <path
                    fill="#FF3D00"
                    d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"
                  />
                </svg>
                Continue with Google
              </button>

              <div
                className="flex items-center gap-3 text-xs text-adm-ink-muted"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-adm-line" />
                or
                <span className="h-px flex-1 bg-adm-line" />
              </div>
            </>
          )}

          {mode === "password" ? (
            <form
              onSubmit={onSubmit}
              className="space-y-4"
              aria-label="Sign in with a password"
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
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                }}
                className="w-full text-center text-xs text-adm-ink-muted underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-violet-soft"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <>
              {mode === "forgot" && (
                <InlineStatus kind="info">
                  We&apos;ll email you a sign-in link. After you sign in, you
                  can set a new password.
                </InlineStatus>
              )}
              <EmailLinkForm
                key={mode}
                next={mode === "forgot" ? "password" : undefined}
                initialEmail={email}
              />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "password" ? "link" : "password"));
              setError(null);
            }}
            className="w-full text-center text-xs font-semibold text-adm-violet-soft underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-violet-soft"
          >
            {mode === "password"
              ? "Email me a sign-in link instead"
              : "Use a password instead"}
          </button>
        </div>

        <p className="mt-5 border-t border-adm-line pt-4 text-center text-xs text-adm-ink-muted">
          Access is invite-only. Ask your team lead for an account.
        </p>
      </section>
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
