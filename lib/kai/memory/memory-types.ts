/**
 * Structured memory — what Kai remembers about the PERSON, across
 * conversations, as opposed to a single KaiConversation's transcript.
 * Every field here is intentionally small and structured; there is no
 * free-text conversation log anywhere in this file.
 */
export type KaiMemoryCategory =
  | "career_interest"
  | "learning_style"
  | "goal"
  | "question_topic"
  | "conversation_preference"
  | "assessment_history"
  | "recommendation";

export interface KaiMemoryItem {
  id: string;
  category: KaiMemoryCategory;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface KaiMemoryProfile {
  items: KaiMemoryItem[];
  /** A 2-3 paragraph rolling summary of the PERSON across every
   * conversation — distinct from a single KaiConversation's `summary`
   * (chat-types.ts), which only ever covers one thread. */
  personSummary: string;
  updatedAt: string;
}

/** What one Gemini turn can propose remembering — validated by
 * memory-builder.ts and merged by memory-updater.ts before anything
 * touches storage. Gemini never writes to storage directly. */
export interface KaiMemoryUpdateCandidate {
  category: KaiMemoryCategory;
  value: string;
}

/**
 * KaiMemoryProvider — the adapter seam. `LocalMemoryProvider`
 * (memory-storage.ts) is the only implementation today; a future
 * `SupabaseMemoryProvider` slots in here without any caller changing,
 * since every method is already async.
 */
export interface KaiMemoryProvider {
  read(): Promise<KaiMemoryProfile>;
  write(profile: KaiMemoryProfile): Promise<void>;
  clear(): Promise<void>;
}
