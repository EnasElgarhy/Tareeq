const PRIVATE_REPLAY_ROUTES = [
  "/q/",
  "/contract",
  "/register",
  "/signin",
  "/results",
  "/share/",
  "/home",
  "/explore",
  "/you",
  "/profile",
  "/kai",
] as const;

const EMAIL_PATTERN = /\b\S+@\S+\.\S+\b/g;
const TOKEN_PATTERN = /\b[A-Za-z0-9_-]{32,}\b/g;

export function shouldMaskReplayText(pathname: string): boolean {
  return PRIVATE_REPLAY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  );
}

export function maskReplayText(text: string, pathname: string): string {
  if (shouldMaskReplayText(pathname)) {
    return text.replace(/\S/g, "•");
  }
  return text
    .replace(EMAIL_PATTERN, "[email hidden]")
    .replace(TOKEN_PATTERN, "[token hidden]");
}

export function sanitizeReplayUrl(value: string): string {
  try {
    const url = new URL(
      value,
      typeof window === "undefined"
        ? "https://staging.tareek.me"
        : window.origin,
    );
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0] ?? "/";
  }
}
