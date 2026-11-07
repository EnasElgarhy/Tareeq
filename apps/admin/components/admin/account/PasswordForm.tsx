"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Field, Input } from "@/components/admin/ui/Field";
import { InlineStatus } from "@/components/admin/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Same rule as accepting an invite. */
const MIN_PASSWORD_LENGTH = 8;

export function passwordProblem(
  password: string,
  confirmation: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmation) return "The two passwords don't match.";
  return null;
}

/** Sets a new password for whoever is signed in (also the end of "Forgot password"). */
export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const problem = passwordProblem(password, confirmation);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setLoading(true);
    const { error: updateError } =
      await createSupabaseBrowserClient().auth.updateUser({
        password,
      });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirmation("");
    setSaved(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-sm space-y-4"
      aria-label="Set a new password"
    >
      <Field
        label="New password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      >
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
      </Field>
      <Field label="Type it again">
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />
        )}
      </Field>
      {error && <InlineStatus kind="error">{error}</InlineStatus>}
      {saved && (
        <InlineStatus kind="success">
          Password saved. Use it next time, or keep signing in by email link.
        </InlineStatus>
      )}
      <Button type="submit" loading={loading}>
        {loading ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
