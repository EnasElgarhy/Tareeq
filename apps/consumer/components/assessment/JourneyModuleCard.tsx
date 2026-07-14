"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { JourneyStatusPill, type JourneyStatus } from "@/components/kai/JourneyStatusPill";
import type { StringKey } from "@/lib/i18n/strings";
import type { ModuleStatus } from "@/lib/profile/journey";

const STATUS_MAP: Record<ModuleStatus, JourneyStatus> = {
  available: "current",
  completed: "completed",
  locked: "locked",
};

const TINT_BY_STATUS: Record<JourneyStatus, string> = {
  completed: "linear-gradient(135deg, rgba(111,224,192,0.22), rgba(111,224,192,0.08))",
  current: "linear-gradient(135deg, rgba(244,198,96,0.22), rgba(253,231,168,0.09))",
  locked: "rgba(20,16,31,0.05)",
};

/**
 * One full-width illustrated card per journey module — replaces the
 * compact icon-row for the Overview tab specifically. The Journey tab
 * itself keeps its own ModuleRow list (more detail: duration, completed
 * date) and the compact JourneyPath progress strip; this is Overview's
 * lighter-weight, larger-footprint version of the same data.
 */
export function JourneyModuleCard({
  id,
  icon,
  name,
  status,
}: {
  id: string;
  icon: ReactNode;
  name: string;
  status: ModuleStatus;
}) {
  const { t } = useLocale();
  const pillStatus = STATUS_MAP[status];
  const captionKey = (
    status === "locked" ? "profile.journey.locked_hint" : `profile.journey.caption.${id}`
  ) as StringKey;

  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
      <span
        className="grid size-14 shrink-0 place-items-center rounded-2xl"
        style={{ background: TINT_BY_STATUS[pillStatus] }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{name}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">{t(captionKey)}</p>
        <div className="mt-1.5">
          <JourneyStatusPill status={pillStatus} />
        </div>
      </div>
    </div>
  );
}
