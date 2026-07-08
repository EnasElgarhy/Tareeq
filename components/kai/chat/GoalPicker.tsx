"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { KAI_ACTIONS } from "@/components/kai/kaiActions";
import { SuggestionChip } from "@/components/kai/chat/SuggestionChip";
import type { KaiConversationGoal } from "@/lib/kai/chat-types";

/** Every conversation starts with a goal — shown once, before the first
 * message, so Gemini's opener is shaped around what the user actually
 * wants instead of a generic "how can I help." */
export function GoalPicker({ onSelect }: { onSelect: (goal: KaiConversationGoal) => void }) {
  const { t } = useLocale();

  return (
    <div className="grid gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--day-ink-3,#675d4e)]">
        {t("kai.chat.goal_prompt")}
      </p>
      <div className="flex flex-wrap gap-2">
        {KAI_ACTIONS.map((action) => (
          <SuggestionChip
            key={action.id}
            label={t(action.key)}
            onSelect={() => onSelect(action.id as KaiConversationGoal)}
          />
        ))}
      </div>
    </div>
  );
}
