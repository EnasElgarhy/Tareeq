import { JourneyPath } from "@/components/kai/JourneyPath";
import type { ProfileSnapshot } from "@/lib/profile/journey";

/**
 * Gemini can only ever caption this block (`title`) — the progress shown
 * is always the real, current module data, never something the model
 * invents. Same trust rule as grounding: factual state stays deterministic.
 */
export function JourneyCard({ title, modules }: { title: string; modules: ProfileSnapshot["modules"] }) {
  return (
    <div className="grid justify-self-start gap-1.5 sm:max-w-[480px]">
      <p className="ps-1 text-[11px] font-bold text-[color:var(--day-ink-3,#675d4e)]">{title}</p>
      <JourneyPath modules={modules} />
    </div>
  );
}
