"use client";

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
    <div className="overflow-hidden rounded-[22px] border border-carbon/8 bg-white p-4 shadow-[0_10px_28px_rgba(43,36,28,0.06)]">
      <div className="relative h-[3px] rounded-full bg-carbon/8">
        <div
          className="h-full rounded-full bg-grad-warm transition-[width] duration-500"
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
                    ? "text-white"
                    : isCurrent
                      ? "text-white"
                      : "bg-carbon/6 text-carbon/32"
                }`}
                style={
                  isDone
                    ? { background: "linear-gradient(150deg,#40C4A4,#6FE0C0)" }
                    : isCurrent
                      ? { background: "var(--grad-warm)" }
                      : undefined
                }
              >
                {isDone ? "✓" : isCurrent ? index + 1 : "🔒"}
                {isCurrent ? (
                  <span
                    aria-hidden
                    className="absolute inset-[-4px] rounded-full"
                    style={{ animation: "kai-signal-pulse-ring 2s ease-out infinite", border: "1.5px solid #FF6B3D" }}
                  />
                ) : null}
              </span>
              <span
                className={`text-[9.5px] font-bold leading-tight ${isDone || isCurrent ? "text-carbon-soft" : "text-carbon/38"}`}
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
