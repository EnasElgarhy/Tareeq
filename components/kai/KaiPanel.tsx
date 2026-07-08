"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ActionPlanIcon, DeepDiveIcon, FutureIcon } from "@/components/brand/DomainIcons";
import { KaiActionCard } from "@/components/kai/KaiActionCard";
import { KaiGroundingCard } from "@/components/kai/KaiGroundingCard";
import { KaiInsightCard } from "@/components/kai/KaiInsightCard";
import { KAI_ACTIONS, type KaiAction } from "@/components/kai/kaiActions";
import { KaiLockedToolCard } from "@/components/kai/KaiLockedToolCard";
import { MemoryTransparencyCard } from "@/components/kai/memory/MemoryTransparencyCard";
import { ProactiveMomentCard } from "@/components/kai/ProactiveMomentCard";
import { trackEvent } from "@/lib/analytics/track";
import type { KaiConversationGoal } from "@/lib/kai/chat-types";
import type { KaiProactiveContext } from "@/lib/kai/proactive/proactive-types";
import type { KaiContext } from "@/lib/kai/types";

/**
 * Kai Landing. Continue-with-Kai and every action button now enter the
 * real conversation at /kai-chat (Phase 2) — see KAI_PHASE_2_SUMMARY.md.
 */
export function KaiPanel({
  context,
  proactiveContext,
  onProactiveClick,
}: {
  context: KaiContext;
  proactiveContext: KaiProactiveContext | null;
  onProactiveClick: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    trackEvent("kai_opened", { hasResult: context.assessment !== null });
    // Fire once per mount only — not on every context identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleActionSelect(actionId: KaiConversationGoal) {
    trackEvent("kai_action_clicked", { action: actionId });
    trackEvent("kai_goal_chip_clicked", { goal: actionId });
    router.push(`/kai-chat?goal=${actionId}`);
  }

  function handleLockedTool(tool: string) {
    trackEvent("kai_locked_tool_clicked", { tool });
  }

  // KAI_ACTIONS reordered so whatever the proactive layer picked (if
  // anything) leads the row — falls back to the fixed order when there's
  // no proactive context yet (e.g. memory is still loading).
  const orderedActions: KaiAction[] = proactiveContext
    ? proactiveContext.goalOrder
        .map((id) => KAI_ACTIONS.find((a) => a.id === id))
        .filter((a): a is KaiAction => Boolean(a))
    : [...KAI_ACTIONS];

  return (
    <div className="grid gap-4">
      {/* Greeting + inactivity nudge live in the shared header above the
          tabs now (ProfileScreen) — this tab starts straight at content. */}

      {/* Overview owns the daily insight moment when it's a plain compass
          highlight (see ProfileScreen's OverviewDashboard) — but a resume
          prompt is a genuine action, distinct from a goal chip, so it
          still gets its own card here. */}
      {!context.assessment ? (
        <KaiInsightCard assessment={null} />
      ) : proactiveContext?.primaryMoment ? (
        <ProactiveMomentCard
          moment={proactiveContext.primaryMoment}
          eyebrowKey="kai.panel.todays_move"
          onCtaClick={onProactiveClick}
        />
      ) : null}

      {context.assessment ? (
        <section className="grid gap-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-carbon/40">
              {t("kai.panel.actions_title")}
            </p>
            <p className="mt-0.5 text-[11.5px] text-carbon/55">
              {t("kai.panel.actions_subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {orderedActions.map((action) => (
              <KaiActionCard
                key={action.id}
                icon={action.icon}
                label={t(action.key)}
                active={false}
                onSelect={() => handleActionSelect(action.id)}
              />
            ))}
          </div>

          <KaiGroundingCard
            assessment={context.assessment}
            onOpen={() => trackEvent("kai_grounding_opened", {})}
          />
        </section>
      ) : null}

      <MemoryTransparencyCard />

      <section className="grid gap-2">
        <KaiLockedToolCard
          icon={ActionPlanIcon}
          titleKey="kai.panel.locked.action_plans.title"
          bodyKey="kai.panel.locked.action_plans.body"
          onTap={() => handleLockedTool("action_plans")}
        />
        <KaiLockedToolCard
          icon={FutureIcon}
          titleKey="kai.panel.locked.explore.title"
          bodyKey="kai.panel.locked.explore.body"
          onTap={() => handleLockedTool("explore")}
        />
        <KaiLockedToolCard
          icon={DeepDiveIcon}
          titleKey="kai.panel.locked.deep_dive.title"
          bodyKey="kai.panel.locked.deep_dive.body"
          onTap={() => handleLockedTool("deep_dive_interview")}
        />
      </section>
    </div>
  );
}
