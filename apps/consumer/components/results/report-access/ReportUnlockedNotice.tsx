"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** The "your complete report is unlocked" status, in the app's language.
 *  Dismissible — the user can close it once they've read it. */
export function ReportUnlockedNotice() {
  const { t } = useLocale();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="rounded-story-alt flex items-start gap-3 border border-[rgba(61,138,115,0.28)] bg-[rgba(61,138,115,0.08)] p-4"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[color:var(--daybreak-green,#3d8a73)] text-white">
        <Check size={17} strokeWidth={2.5} aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-bold text-[color:var(--day-ink)]">
          {t("paywall.success")}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {t("paywall.success.description")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("paywall.success.dismiss_aria")}
        className="grid size-8 shrink-0 place-items-center rounded-full text-[color:var(--day-ink-3,#675D4E)] transition hover:bg-black/[0.06] hover:text-[color:var(--day-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--daybreak-green,#3d8a73)]"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
