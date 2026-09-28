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
      className="rounded-story-alt flex items-start gap-3 border border-[color:var(--day-line)] bg-[color:var(--day-inset,#efe7da)] p-4 text-start opacity-85 transition hover:bg-[color:var(--day-card)] hover:opacity-100"
    >
      <span className="daybreak-icon-tile size-10 bg-[color:var(--day-line)] text-[color:var(--day-ink-3,#675d4e)]">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="daybreak-heading truncate text-[15px] leading-tight text-[color:var(--day-ink-2,#5c5142)]">
            {t(titleKey)}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--day-line-strong,rgba(43,36,28,0.2))] bg-[color:var(--day-line,rgba(43,36,28,0.1))] px-1.5 py-0.5 text-[8.5px] font-bold uppercase text-[color:var(--day-ink-3,#675d4e)]">
            <Lock size={9} />
            {t("kai.panel.coming_soon_badge")}
          </span>
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[color:var(--day-ink-3,#675d4e)]">{t(bodyKey)}</p>
      </div>
    </button>
  );
}
