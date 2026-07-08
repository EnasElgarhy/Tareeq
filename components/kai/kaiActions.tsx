import type { ReactNode } from "react";
import {
  CareerComparisonIcon,
  CareerCompassIcon,
  GoalIcon,
  MajorIcon,
  ParentsIcon,
  ResearchIcon,
} from "@/components/brand/DomainIcons";
import type { KaiConversationGoal } from "@/lib/kai/chat-types";
import type { StringKey } from "@/lib/i18n/strings";

export interface KaiAction {
  id: KaiConversationGoal;
  icon: ReactNode;
  key: StringKey;
}

/** Shared with the Kai tab's action grid and Overview's featured-action
 * card — one source of truth for what Kai can suggest. Which one leads
 * is decided by lib/kai/proactive/ (Phase E), not a fixed order here. */
export const KAI_ACTIONS: readonly KaiAction[] = [
  { id: "explain_results", icon: <CareerCompassIcon size={15} />, key: "kai.action.explain_results" },
  { id: "find_majors", icon: <MajorIcon size={15} />, key: "kai.action.find_majors" },
  { id: "compare_careers", icon: <CareerComparisonIcon size={15} />, key: "kai.action.compare_careers" },
  { id: "build_plan", icon: <GoalIcon size={15} />, key: "kai.action.build_plan" },
  { id: "explain_to_parents", icon: <ParentsIcon size={15} />, key: "kai.action.explain_to_parents" },
  { id: "challenge_result", icon: <ResearchIcon size={15} />, key: "kai.action.challenge_result" },
] as const;
