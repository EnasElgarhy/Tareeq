"use client";

import { useEffect, useState } from "react";
import { LearningResourceCard } from "@/components/kai/chat/LearningResourceCard";
import { trackEvent } from "@/lib/analytics/track";
import {
  findSavedResource,
  readSavedResources,
  saveResource,
  toggleActionPlan,
  unsaveResource,
} from "@/lib/kai/resource-storage";
import type { KaiLearningResource, KaiSavedResource } from "@/lib/kai/resource-types";

/**
 * Wraps one turn's `learning_resources` block. Owns save/action-plan
 * state itself (reads/writes lib/kai/resource-storage.ts directly) so
 * KaiMessageBlocks doesn't need to thread yet another piece of state
 * through its prop list — same self-contained pattern as
 * MemoryTransparencyCard.
 */
export function LearningResourcesCard({ title, resources }: { title: string; resources: KaiLearningResource[] }) {
  const [saved, setSaved] = useState<KaiSavedResource[]>([]);

  useEffect(() => {
    setSaved(readSavedResources());
  }, []);

  function handleToggleSave(resource: KaiLearningResource) {
    const existing = findSavedResource(saved, resource);
    if (existing) {
      setSaved(unsaveResource(existing.id));
    } else {
      setSaved(saveResource(resource));
      trackEvent("kai_resource_saved", { type: resource.type });
    }
  }

  function handleToggleActionPlan(resource: KaiLearningResource) {
    const existing = findSavedResource(saved, resource);
    // Adding to a plan implies keeping it — save first if it isn't yet.
    const withSave = existing ? saved : saveResource(resource);
    const target = existing ?? findSavedResource(withSave, resource);
    if (!target) return;

    const next = toggleActionPlan(target.id);
    setSaved(next);
    const nowInPlan = next.find((item) => item.id === target.id)?.inActionPlan;
    if (nowInPlan) trackEvent("kai_resource_added_to_plan", { type: resource.type });
  }

  if (resources.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="ps-1 text-[11px] font-bold text-[color:var(--day-ink-3,#675d4e)]">{title}</p>
      {/* A gallery of recommendations, not a single message bubble — lets
          this use the full content column and wrap into a 2-up grid once
          there's room, instead of capping to the narrower message-card
          width the rest of the block types share. */}
      <div className="grid gap-2 md:grid-cols-2 md:gap-3">
        {resources.map((resource) => {
          const existing = findSavedResource(saved, resource);
          return (
            <LearningResourceCard
              key={`${resource.type}-${resource.title}`}
              resource={resource}
              saved={Boolean(existing)}
              inActionPlan={Boolean(existing?.inActionPlan)}
              onToggleSave={() => handleToggleSave(resource)}
              onToggleActionPlan={() => handleToggleActionPlan(resource)}
            />
          );
        })}
      </div>
    </div>
  );
}
