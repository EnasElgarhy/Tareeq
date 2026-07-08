"use client";

import { Lock } from "lucide-react";
import type { ComponentType } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";

/**
 * A locked, "coming soon" future tool inside Kai — Action Plans, Career
 * Explore, Deep Dive Interview. Per this phase's brief: build the
 * placeholder only, no functionality behind it yet.
 */
export function KaiLockedToolCard({
  icon: Icon,
  titleKey,
  bodyKey,
  onTap,
}: {
  icon: ComponentType<{ size?: number | string }>;
  titleKey: StringKey;
  bodyKey: StringKey;
  onTap: () => void;
}) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={onTap}
      className="flex items-start gap-3 rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-inset,#efe7da)] p-3.5 text-start opacity-85 transition hover:opacity-100 hover:bg-[color:var(--day-line-strong,rgba(43,36,28,0.2))]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--day-line,rgba(43,36,28,0.1))] text-[color:var(--day-ink-3,#675d4e)]">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-black leading-tight text-[color:var(--day-ink-2,#5c5142)]">
            {t(titleKey)}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--day-line-strong,rgba(43,36,28,0.2))] bg-[color:var(--day-line,rgba(43,36,28,0.1))] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--day-ink-3,#675d4e)]">
            <Lock size={9} />
            {t("kai.panel.coming_soon_badge")}
          </span>
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[color:var(--day-ink-3,#675d4e)]">{t(bodyKey)}</p>
      </div>
    </button>
  );
}
