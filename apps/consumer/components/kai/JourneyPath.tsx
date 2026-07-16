"use client";

import { Check, LockKeyhole } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getModuleNameKey, type ProfileSnapshot } from "@/lib/profile/journey";

interface JourneyPathProps {
  modules: ProfileSnapshot["modules"];
}

/**
 * A journey-at-a-glance path — same "pure function of progress data" API
 * as CompassProgress, new shape for a sequence instead of quadrants. The
 * next meaningful step (the in-progress module, or the first locked one
 * once nothing is actionable yet) gets a soft pulsing ring so the path
 * reads as "you are here," not just another row of dots. Sits above the
 * existing module list — that list keeps the actionable detail, this is
 * the at-a-glance summary.
 */
export function JourneyPath({ modules }: JourneyPathProps) {
  const { t } = useLocale();
  const nextIndex = modules.findIndex((m) => m.status !== "completed");

  return (
    <div className="daybreak-story-card rounded-story-alt overflow-hidden p-4">
      <div className="relative h-[3px] rounded-full bg-[color:var(--day-line)]">
        <div
          className="h-full rounded-full bg-[#6D5BA8] transition-[width] duration-500"
          style={{
            width: `${modules.length > 1 ? (modules.filter((m) => m.status === "completed").length / (modules.length - 1)) * 100 : 0}%`,
          }}
        />
      </div>
      <ol className="relative mt-2.5 flex items-start justify-between">
        {modules.map((mod, index) => {
          const isCurrent = index === nextIndex;
          const isDone = mod.status === "completed";
          return (
            <li key={mod.id} className="flex w-[70px] flex-col items-center gap-1.5 text-center">
              <span
                className={`relative grid size-9 place-items-center rounded-full text-[11px] font-black ${
                  isDone
                    ? "bg-[#3D8A73] text-white"
                    : isCurrent
                      ? "bg-[#6D5BA8] text-white"
                      : "bg-[color:var(--day-inset)] text-[color:var(--day-ink-3)]"
                }`}
              >
                {isDone ? <Check size={15} /> : isCurrent ? index + 1 : <LockKeyhole size={13} />}
                {isCurrent ? (
                  <span
                    aria-hidden
                    className="absolute inset-[-4px] rounded-full"
                    style={{ animation: "kai-signal-pulse-ring 2s ease-out infinite", border: "1.5px solid #F2C94C" }}
                  />
                ) : null}
              </span>
              <span
                className={`text-[9.5px] font-bold leading-tight ${isDone || isCurrent ? "text-[color:var(--day-ink-2)]" : "text-[color:var(--day-ink-3)]"}`}
              >
                {t(getModuleNameKey(mod.id))}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
