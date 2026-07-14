import { useLocale } from "@/components/i18n/LocaleProvider";
import { KaiSignal } from "@/components/kai/KaiSignal";

/** The "yesterday we explored X, want to continue?" moment — Gemini
 * authors the specific line since it's the one composing the callback,
 * but only ever after being told the real memory it's referencing. */
export function ResumeConversationCard({
  title,
  description,
  onContinue,
}: {
  title: string;
  description: string;
  onContinue: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="justify-self-start rounded-[18px] border border-violet/20 bg-violet/[0.05] p-3.5 sm:max-w-[480px]">
      <div className="mb-1.5 flex items-center gap-2">
        <KaiSignal mood="curious" size={22} />
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      {description ? <p className="mb-2.5 text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">{description}</p> : null}
      <button
        type="button"
        onClick={onContinue}
        className="btn-v2 btn-v2--ghost-on-light w-fit"
        data-size="sm"
      >
        {t("kai.memory.resume_cta")}
      </button>
    </div>
  );
}
