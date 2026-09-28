"use client";

import { ReflectionIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { groupMemoryItems } from "@/lib/kai/memory/memory-view";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";

/**
 * Gemini only signals "show what you remember" (a title) — the items
 * rendered are always the real stored memory, never LLM-authored, same
 * trust rule as JourneyCard.
 */
export function MemoryCard({ title, memory }: { title: string; memory: KaiMemoryProfile }) {
  const { t } = useLocale();
  const groups = groupMemoryItems(memory.items, t).slice(0, 3);
  if (groups.length === 0) return null;

  return (
    <div className="daybreak-story-card rounded-story-alt justify-self-start p-4 sm:max-w-[480px]">
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(157,127,240,0.14), rgba(110,72,228,0.06))" }}
        >
          <ReflectionIcon size={18} />
        </span>
        <p className="daybreak-heading text-[15px] leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <div className="grid gap-1.5">
        {groups.map((group) => (
          <p key={group.category} className="text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
            <span className="font-bold text-[color:var(--day-ink,#2a2118)]">{group.label}:</span>{" "}
            {group.items.map((item) => item.value).join(", ")}
          </p>
        ))}
      </div>
    </div>
  );
}
