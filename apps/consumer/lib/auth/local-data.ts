/**
 * Device-local account data — what sign-out must wipe.
 *
 * The assessment, report, registration, Kai (memory, threads, plans,
 * resources), report access and streaks all live in browser storage so the
 * flow works before an account exists. Once someone signs out, that copy
 * belongs to the account they left: leaving it would keep the dashboard
 * open on a shared device. Signing back in restores it from Supabase.
 *
 * Everything under the `tareeq.` / `tareeq:` namespaces is removed except
 * the device preferences below. Analytics keys (`tareeq_…`) are outside the
 * namespace and untouched.
 */
const DEVICE_PREFERENCE_KEYS: ReadonlySet<string> = new Set([
  "tareeq.locale",
  "tareeq:sound",
  "tareeq.staging-replay-consent.v1",
]);

const ACCOUNT_KEY_PATTERN = /^tareeq[.:]/;

function isAccountKey(key: string): boolean {
  return ACCOUNT_KEY_PATTERN.test(key) && !DEVICE_PREFERENCE_KEYS.has(key);
}

export function clearLocalUserData(storages: readonly Storage[]): void {
  for (const storage of storages) {
    const keys = Array.from({ length: storage.length }, (_, i) =>
      storage.key(i),
    ).filter((key): key is string => key !== null && isAccountKey(key));
    for (const key of keys) storage.removeItem(key);
  }
}

/** Browser entry point: clears localStorage and sessionStorage. */
export function clearBrowserUserData(): void {
  if (typeof window === "undefined") return;
  try {
    clearLocalUserData([window.localStorage, window.sessionStorage]);
  } catch {
    // Storage can be blocked (private mode, disabled cookies) — nothing
    // was persisted there in that case, so there is nothing to clear.
  }
}
