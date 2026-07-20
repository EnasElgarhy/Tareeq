export type InviteHashResult =
  | { kind: "none" }
  | { kind: "error" }
  | { kind: "session"; accessToken: string; refreshToken: string };

/**
 * Supabase admin invitations use the implicit flow and return the new session
 * in the URL fragment. Fragments never reach the server callback, so the
 * acceptance page must establish the browser session itself.
 */
export function parseInviteHash(hash: string): InviteHashResult {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!value) return { kind: "none" };

  const params = new URLSearchParams(value);
  if (params.has("error") || params.has("error_code")) return { kind: "error" };
  if (params.get("type") !== "invite") return { kind: "none" };

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return { kind: "error" };

  return { kind: "session", accessToken, refreshToken };
}
