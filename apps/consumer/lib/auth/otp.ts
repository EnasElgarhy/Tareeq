import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Email one-time-password (OTP) auth helpers for the consumer app.
 *
 * `sendEmailOtp` triggers Supabase to email a code (the email template must
 * include `{{ .Token }}`). `verifyEmailOtp` exchanges the code for a real
 * session (stored in cookies by the @supabase/ssr browser client).
 */

/**
 * Accepted length range for the emailed OTP code. Supabase's Auth → Email OTP
 * length is a project setting in the 6–10 range (target: 6). The input accepts
 * up to OTP_MAX_LENGTH and only guards submits shorter than OTP_MIN_LENGTH, so
 * login keeps working across a length change without a coordinated deploy —
 * Supabase remains the source of truth for the exact code.
 */
export const OTP_MIN_LENGTH = 6;
export const OTP_MAX_LENGTH = 10;

interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function sendEmailOtp(
  email: string,
  name?: string,
): Promise<AuthResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: name ? { display_name: name, full_name: name } : undefined,
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<AuthResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}
