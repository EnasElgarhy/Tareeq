"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notAdmin = params.get("error") === "not_admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
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

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-[17px] font-bold text-amber-900">
            Supabase isn&apos;t configured
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-amber-800">
            Add{" "}
            <code className="rounded bg-amber-100 px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            ,{" "}
            <code className="rounded bg-amber-100 px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            to <code className="rounded bg-amber-100 px-1">.env.local</code>,
            then restart. See{" "}
            <code className="rounded bg-amber-100 px-1">docs/ADMIN_SETUP.md</code>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-[#6E48E4] text-[15px] font-black text-white">
            T
          </div>
          <h1 className="text-[20px] font-bold text-slate-900">Tareeq Admin</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Sign in to manage content, users, and insights.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {notAdmin ? (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
              That account isn&apos;t an admin. Ask an existing admin to grant
              access.
            </p>
          ) : null}

          <label className="block text-[12px] font-semibold text-slate-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20"
          />

          <label className="mt-4 block text-[12px] font-semibold text-slate-700">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-[#6E48E4] focus:ring-2 focus:ring-[#6E48E4]/20"
          />

          {error ? (
            <p className="mt-3 text-[12.5px] text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-[#6E48E4] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#5b39c9] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
