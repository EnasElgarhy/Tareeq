import { GoalIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** A goal the person just stated — genuinely Gemini-authored, since it's
 * freshly extracted from what they said in this turn. */
export function GoalCard({ title, description }: { title: string; description: string }) {
  const { t } = useLocale();

  return (
    <div className="justify-self-start rounded-[18px] border border-gold/30 bg-gold/[0.07] p-3.5 sm:max-w-[480px]">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15">
          <GoalIcon size={18} />
        </span>
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      {description ? <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">{description}</p> : null}
      <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--day-ink-3,#675d4e)]">
        {t("kai.memory.goal_saved")}
      </span>
    </div>
  );
}
