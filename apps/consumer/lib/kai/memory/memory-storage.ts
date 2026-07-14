import type { KaiMemoryItem, KaiMemoryProfile, KaiMemoryProvider } from "@/lib/kai/memory/memory-types";

export const kaiMemoryStorageKey = "tareeq.kai.memory.v1";

export function emptyMemoryProfile(now = new Date().toISOString()): KaiMemoryProfile {
  return { items: [], personSummary: "", updatedAt: now };
}

function isKaiMemoryItem(value: unknown): value is KaiMemoryItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<KaiMemoryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.category === "string" &&
    typeof item.value === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function isKaiMemoryProfile(value: unknown): value is KaiMemoryProfile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KaiMemoryProfile>;
  return (
    Array.isArray(candidate.items) &&
    candidate.items.every(isKaiMemoryItem) &&
    typeof candidate.personSummary === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

/**
 * localStorage adapter behind KaiMemoryProvider. Every method returns a
 * Promise even though the implementation is synchronous — a future
 * SupabaseMemoryProvider is genuinely async, and no caller should need
 * to change when that swap happens (see lib/kai/memory/memory.ts).
 *
 * Malformed or legacy-shaped stored data (a corrupted write, a future
 * schema change) resolves to an empty profile rather than throwing —
 * same "never crash the Profile over storage" rule as
 * lib/results/storage.ts and lib/kai/chat-storage.ts.
 */
export class LocalMemoryProvider implements KaiMemoryProvider {
  async read(): Promise<KaiMemoryProfile> {
    if (typeof window === "undefined") return emptyMemoryProfile();
    const raw = window.localStorage.getItem(kaiMemoryStorageKey);
    if (!raw) return emptyMemoryProfile();

    try {
      const parsed: unknown = JSON.parse(raw);
      return isKaiMemoryProfile(parsed) ? parsed : emptyMemoryProfile();
    } catch {
      return emptyMemoryProfile();
    }
  }

  async write(profile: KaiMemoryProfile): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(kaiMemoryStorageKey, JSON.stringify(profile));
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(kaiMemoryStorageKey);
  }
}
