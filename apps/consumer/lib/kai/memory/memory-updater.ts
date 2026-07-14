import { capSummary } from "@/lib/kai/memory/memory-summary";
import type { KaiMemoryItem, KaiMemoryProfile, KaiMemoryUpdateCandidate } from "@/lib/kai/memory/memory-types";

export interface MemoryMergeResult {
  profile: KaiMemoryProfile;
  created: KaiMemoryItem[];
  updated: KaiMemoryItem[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Merges new candidates into an existing profile. Case-insensitive
 * dedup per category — an existing "Artificial Intelligence" absorbs a
 * later "artificial intelligence" instead of creating a second row; a
 * duplicate just refreshes `updatedAt`. Returns which items were
 * genuinely created vs. refreshed so callers can fire accurate
 * kai_memory_created / kai_memory_updated analytics.
 */
export function mergeMemoryCandidates(
  current: KaiMemoryProfile,
  candidates: KaiMemoryUpdateCandidate[],
  personSummary: string | undefined,
  now = new Date().toISOString(),
): MemoryMergeResult {
  const items = [...current.items];
  const created: KaiMemoryItem[] = [];
  const updated: KaiMemoryItem[] = [];

  for (const candidate of candidates) {
    const value = candidate.value.trim();
    if (!value) continue;

    const existingIndex = items.findIndex(
      (item) => item.category === candidate.category && normalize(item.value) === normalize(value),
    );

    if (existingIndex >= 0) {
      const refreshed = { ...items[existingIndex], updatedAt: now };
      items[existingIndex] = refreshed;
      updated.push(refreshed);
      continue;
    }

    const item: KaiMemoryItem = {
      id: `mem-${now}-${Math.random().toString(36).slice(2, 8)}`,
      category: candidate.category,
      value,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    created.push(item);
  }

  return {
    profile: {
      items,
      personSummary: personSummary ? capSummary(personSummary) : current.personSummary,
      updatedAt: now,
    },
    created,
    updated,
  };
}

export function removeMemoryItem(
  current: KaiMemoryProfile,
  id: string,
  now = new Date().toISOString(),
): KaiMemoryProfile {
  return {
    ...current,
    items: current.items.filter((item) => item.id !== id),
    updatedAt: now,
  };
}
