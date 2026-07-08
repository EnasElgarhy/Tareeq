import { LocalMemoryProvider } from "@/lib/kai/memory/memory-storage";
import type {
  KaiMemoryProfile,
  KaiMemoryProvider,
  KaiMemoryUpdateCandidate,
} from "@/lib/kai/memory/memory-types";
import { mergeMemoryCandidates, type MemoryMergeResult, removeMemoryItem } from "@/lib/kai/memory/memory-updater";

/**
 * KaiMemoryProvider ↓ LocalMemoryProvider ↓ (future) SupabaseMemoryProvider.
 *
 * Everything else in the app calls the functions below, never a
 * provider or localStorage directly. Swapping in a Supabase-backed
 * provider later is a one-line change to `provider`, not a UI rewrite —
 * every function here already returns a Promise.
 */
let provider: KaiMemoryProvider = new LocalMemoryProvider();

/** Test/DI seam only — production code never calls this. */
export function setMemoryProvider(next: KaiMemoryProvider): void {
  provider = next;
}

export function readMemory(): Promise<KaiMemoryProfile> {
  return provider.read();
}

export async function applyMemoryUpdates(
  candidates: KaiMemoryUpdateCandidate[],
  personSummary?: string,
): Promise<MemoryMergeResult> {
  const current = await provider.read();
  const result = mergeMemoryCandidates(current, candidates, personSummary);
  await provider.write(result.profile);
  return result;
}

export async function forgetMemoryItem(id: string): Promise<KaiMemoryProfile> {
  const current = await provider.read();
  const next = removeMemoryItem(current, id);
  await provider.write(next);
  return next;
}

export async function clearAllMemory(): Promise<void> {
  await provider.clear();
}
