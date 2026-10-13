/**
 * Who may see the dashboard, given the auth session and what this device
 * has saved locally.
 *
 * Every real route to a result passes the emailed-code step at
 * registration, so a local result without a session is always stale
 * (signed out, expired session, or the /home-preview seed). It is kept —
 * signing back in restores it — but it never opens the dashboard alone.
 * A local result owned by a different email than the session is another
 * person's data on a shared device and must be cleared.
 */
export type DashboardAccessDecision =
  | "signed-out"
  | "allow-local"
  | "restore"
  | "clear-and-restore";

export interface DashboardAccessInput {
  sessionEmail: string | null;
  localEmail: string | null;
  hasLocalResult: boolean;
}

function normalizeEmail(email: string | null): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export function decideDashboardAccess({
  sessionEmail,
  localEmail,
  hasLocalResult,
}: DashboardAccessInput): DashboardAccessDecision {
  const session = normalizeEmail(sessionEmail);
  if (!session) return "signed-out";
  if (!hasLocalResult) return "restore";
  return normalizeEmail(localEmail) === session
    ? "allow-local"
    : "clear-and-restore";
}
