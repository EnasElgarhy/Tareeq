import { MajorIcon } from "@/components/brand/DomainIcons";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";

/** Same trust rule as MemoryCard — Gemini signals the moment, the list
 * shown is always real "recommendation" category memory items. */
export function RecommendationHistoryCard({
  title,
  memory,
}: {
  title: string;
  memory: KaiMemoryProfile;
}) {
  const recommendations = memory.items.filter((item) => item.category === "recommendation");
  if (recommendations.length === 0) return null;

  return (
    <div className="daybreak-story-card rounded-story justify-self-start p-4 sm:max-w-[480px]">
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(255,107,61,0.14), rgba(255,165,61,0.06))" }}
        >
          <MajorIcon size={18} />
        </span>
        <p className="daybreak-heading text-[15px] leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <ul className="grid gap-1">
        {recommendations.map((item) => (
          <li key={item.id} className="text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
            • {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
