import { Lock } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export type JourneyStatus = "completed" | "current" | "locked";

/** The same three journey states recur on both the Overview illustrated
 * cards and the Journey tab's module rows — one shared pill instead of
 * two copies of the same three-way switch drifting apart. */
export function JourneyStatusPill({ status }: { status: JourneyStatus }) {
  const { t } = useLocale();

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-bold text-[#2E9C82]">
        <span aria-hidden="true" className="size-1 rounded-full bg-current" />
        {t("profile.journey.status_done")}
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-[#8A6A16]">
        <span aria-hidden="true" className="size-1 rounded-full bg-current" />
        {t("profile.journey.status_current")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--day-inset,#efe7da)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--day-ink-3,#675d4e)]">
      <Lock size={9} />
      {t("profile.journey.status_soon")}
    </span>
  );
}
