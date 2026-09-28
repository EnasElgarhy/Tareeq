import { JourneyIcon } from "@/components/brand/DomainIcons";
import type { NextMilestone } from "@/lib/profile/activity";

/** Gemini can only caption this — the milestone itself always comes
 * from the real journey data, never invented, same rule as JourneyCard. */
export function MilestoneCard({ title, milestone }: { title: string; milestone: NextMilestone | null }) {
  if (!milestone) return null;

  return (
    <div className="daybreak-story-card rounded-story-alt flex items-center justify-self-start gap-3 border-[#BEB2DF] bg-[#F7F2FF] p-4 sm:max-w-[480px]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/12">
        <JourneyIcon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase text-[#57458D]">{title}</p>
        <p className="truncate text-[12.5px] font-bold text-[color:var(--day-ink,#2a2118)]">{milestone.name}</p>
      </div>
    </div>
  );
}
