import type { StringKey } from "@/lib/i18n/strings";
import type { KaiMemoryCategory, KaiMemoryItem } from "@/lib/kai/memory/memory-types";

/** English-only labels for the Gemini prompt (lib/kai/chat-prompt.ts) —
 * that's machine-facing context, not UI, so it always stays in English
 * regardless of the app's locale. For the UI label shown to the user,
 * see groupMemoryItems()'s `t` parameter below. */
export const MEMORY_CATEGORY_LABELS: Record<KaiMemoryCategory, string> = {
  career_interest: "Career interests",
  learning_style: "Preferred learning style",
  goal: "Goals",
  question_topic: "Questions asked about",
  conversation_preference: "Conversation preferences",
  assessment_history: "Assessment history",
  recommendation: "Recent recommendations",
};

const MEMORY_CATEGORY_LABEL_KEYS: Record<KaiMemoryCategory, StringKey> = {
  career_interest: "kai.memory.category.career_interest",
  learning_style: "kai.memory.category.learning_style",
  goal: "kai.memory.category.goal",
  question_topic: "kai.memory.category.question_topic",
  conversation_preference: "kai.memory.category.conversation_preference",
  assessment_history: "kai.memory.category.assessment_history",
  recommendation: "kai.memory.category.recommendation",
};

export interface MemoryGroup {
  category: KaiMemoryCategory;
  label: string;
  items: KaiMemoryItem[];
}

/** Groups memory items by category, most-recently-updated group first —
 * shared by the in-chat MemoryCard and the profile transparency card so
 * both present memory identically. */
export function groupMemoryItems(items: KaiMemoryItem[], t: (key: StringKey) => string): MemoryGroup[] {
  const byCategory = new Map<KaiMemoryCategory, KaiMemoryItem[]>();
  for (const item of items) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }

  const groups: MemoryGroup[] = Array.from(byCategory.entries()).map(([category, groupItems]) => ({
    category,
    label: t(MEMORY_CATEGORY_LABEL_KEYS[category]),
    items: [...groupItems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  }));

  const latestUpdate = (group: MemoryGroup) => group.items[0]?.updatedAt ?? "";
  return groups.sort((a, b) => latestUpdate(b).localeCompare(latestUpdate(a)));
}
