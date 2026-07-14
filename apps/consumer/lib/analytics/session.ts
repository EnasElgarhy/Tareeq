const SESSION_KEY = "tareeq_analytics_session_id";
const SESSION_TTL_MS = 30 * 60 * 1000;

interface StoredSession {
  id: string;
  lastActiveAt: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Extremely old runtimes only — crypto.randomUUID is available in every
  // target this library actually ships to (browsers + Node 19+).
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** One id per server process — there's no browser session to persist server-side. */
let serverSessionId: string | null = null;

/**
 * A session is "the same browser tab, active within the last 30 minutes" —
 * sessionStorage-backed so it survives reloads within a tab but not across
 * tabs or after the tab closes. Server-side callers (e.g. an admin Server
 * Action) get one id per process lifetime instead.
 */
export function getOrCreateSessionId(): string {
  if (!isBrowser()) {
    if (!serverSessionId) serverSessionId = generateId();
    return serverSessionId;
  }

  const now = Date.now();
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as StoredSession;
      if (now - stored.lastActiveAt < SESSION_TTL_MS) {
        window.sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ ...stored, lastActiveAt: now }),
        );
        return stored.id;
      }
    } catch {
      // Corrupt value — fall through and mint a new session.
    }
  }

  const id = generateId();
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastActiveAt: now }));
  return id;
}

/** Test/teardown hook — forces the next call to mint a fresh session. */
export function resetSession(): void {
  if (isBrowser()) window.sessionStorage.removeItem(SESSION_KEY);
  serverSessionId = null;
}
