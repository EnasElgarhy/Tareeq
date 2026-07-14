"use client";

import { ChevronRight, LogOut, Mail } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KaiIcon } from "@/components/brand/DomainIcons";
import type { Locale } from "@/lib/i18n/locale";

/**
 * The Settings tab — extracted out of ProfileScreen.tsx (which had grown
 * past the file-size guideline) since this block is fully self-contained
 * and doesn't touch any of the other tabs' state.
 */
export function SettingsPanel({
  displayName,
  email,
  onViewMemory,
  onSignOut,
}: {
  displayName: string;
  email: string;
  /** Routes to the Kai tab, where the memory-transparency card lives. */
  onViewMemory: () => void;
  onSignOut: () => void;
}) {
  const { locale, setLocale, t } = useLocale();

  return (
    <section className="grid gap-4">
      <div className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("profile.settings.account_label")}
        </p>
        <p className="mt-1.5 text-[14px] font-black text-[color:var(--day-ink,#2a2118)]">{displayName}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[color:var(--day-ink-2,#5c5142)]">
          <Mail size={11} />
          {email}
        </p>
      </div>

      <div className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--day-ink-3,#675d4e)]">
          {t("profile.settings.language_label")}
        </p>
        <div className="mt-2 flex gap-2">
          {(["en", "ar"] satisfies Locale[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLocale(option)}
              aria-pressed={locale === option}
              className={`flex-1 rounded-[14px] border px-3 py-2 text-[12.5px] font-bold transition ${
                locale === option
                  ? "border-violet/35 bg-violet/10 text-violet"
                  : "border-[color:var(--day-line,rgba(43,36,28,0.1))] text-[color:var(--day-ink-2,#5c5142)] hover:bg-[color:var(--day-inset,#efe7da)]"
              }`}
            >
              {t(option === "en" ? "profile.settings.language_en" : "profile.settings.language_ar")}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onViewMemory}
        className="flex items-center gap-2.5 rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 text-start shadow-[0_8px_20px_rgba(43,36,28,0.05)] transition hover:bg-[color:var(--day-inset,#efe7da)]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/[0.08]">
          <KaiIcon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-black text-[color:var(--day-ink,#2a2118)]">{t("profile.settings.memory_title")}</span>
          <span className="block text-[11.5px] text-[color:var(--day-ink-2,#5c5142)]">{t("profile.settings.memory_subtitle")}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-[color:var(--day-ink-3,#675d4e)]" />
      </button>

      <button
        type="button"
        onClick={onSignOut}
        className="mx-auto flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--day-ink-3,#675d4e)] transition-colors hover:text-[color:var(--day-ink,#2a2118)]"
      >
        <LogOut size={13} />
        {t("profile.settings.sign_out")}
      </button>

      <p className="text-center text-[11px] leading-snug text-[color:var(--day-ink-3,#675d4e)]">{t("profile.settings.footer")}</p>
    </section>
  );
}
