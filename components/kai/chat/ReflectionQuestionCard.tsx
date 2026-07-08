"use client";

import { ReflectionIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** A single coaching question posed back to the learner — prompts
 * reflection rather than answering for them. Not meant to be answered
 * inline; the learner replies (or doesn't) through the normal input. */
export function ReflectionQuestionCard({ question }: { question: string }) {
  const { t } = useLocale();
  return (
    <div className="justify-self-start rounded-[18px] border border-violet/20 bg-violet/[0.04] p-3.5 sm:max-w-[480px]">
      <div className="flex items-center gap-2">
        <ReflectionIcon size={16} />
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("kai.chat.reflection_eyebrow")}
        </p>
      </div>
      <p className="mt-1.5 text-[13.5px] font-bold italic leading-snug text-[color:var(--day-ink,#2a2118)]">{question}</p>
    </div>
  );
}
