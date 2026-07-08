import type { KaiConversation, KaiConversationGoal } from "@/lib/kai/chat-types";
import type { KaiMemoryCategory, KaiMemoryItem, KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import type { KaiProactiveContext, KaiProactiveMoment } from "@/lib/kai/proactive/proactive-types";
import type { KaiContext } from "@/lib/kai/types";
import type { ProfileSnapshot } from "@/lib/profile/journey";

const INACTIVITY_THRESHOLD_DAYS = 3;

/** Which chat goal a remembered topic naturally leads back into — a
 * simple, deterministic default per category, not a perfect mapping. */
const CATEGORY_TO_GOAL: Record<KaiMemoryCategory, KaiConversationGoal> = {
  career_interest: "find_majors",
  learning_style: "build_plan",
  goal: "build_plan",
  question_topic: "compare_careers",
  conversation_preference: "explain_results",
  assessment_history: "explain_results",
  recommendation: "find_majors",
};

const BASE_GOAL_ORDER: KaiConversationGoal[] = [
  "explain_results",
  "find_majors",
  "compare_careers",
  "build_plan",
  "explain_to_parents",
  "challenge_result",
];

export function pickGreetingKey(now: Date): KaiProactiveContext["greetingKey"] {
  const hour = now.getHours();
  if (hour < 12) return "kai.panel.greeting_morning";
  if (hour < 18) return "kai.panel.greeting_afternoon";
  return "kai.panel.greeting_evening";
}

/** More than the one opening message means the user actually engaged —
 * worth a "continue where we left off," not just an unread opener. */
function hasSubstantiveConversation(conversation: KaiConversation | null): boolean {
  return Boolean(conversation && conversation.messages.length > 1);
}

function mostRecentMemoryItem(memory: KaiMemoryProfile): KaiMemoryItem | null {
  if (memory.items.length === 0) return null;
  return [...memory.items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0]!;
}

/**
 * Priority, most to least specific:
 * 1. No assessment yet → the only honest "next step" is CORE Compass
 *    itself (checked first: chat is gated behind having an assessment,
 *    so conversation/memory can't meaningfully exist before this anyway
 *    — checking it first is correct even if that invariant ever slips).
 * 2. A conversation with real back-and-forth → resume it.
 * 3. A remembered topic → pick up there.
 * 4. Otherwise → highlight one real fact from their Compass result.
 *
 * Deliberately does NOT recommend "the next module" once CORE is done —
 * every other module is a locked placeholder today (see
 * lib/profile/journey.ts), so that would point at something the user
 * can't actually do yet.
 */
function buildPrimaryMoment(input: {
  kaiContext: KaiContext;
  snapshot: ProfileSnapshot;
  memory: KaiMemoryProfile;
  conversation: KaiConversation | null;
}): KaiProactiveMoment | null {
  const { kaiContext, snapshot, memory, conversation } = input;

  if (!kaiContext.assessment) {
    const coreModule = snapshot.modules.find((m) => m.id === "core-compass");
    return {
      kind: "next_step",
      params: {
        module: coreModule?.name ?? "CORE Compass",
        duration: coreModule?.durationLabel ?? "12 min",
      },
    };
  }

  if (hasSubstantiveConversation(conversation)) {
    return { kind: "resume_conversation", params: { summary: conversation?.summary ?? "" } };
  }

  const recentMemory = mostRecentMemoryItem(memory);
  if (recentMemory) {
    return {
      kind: "resume_topic",
      goal: CATEGORY_TO_GOAL[recentMemory.category],
      params: { topic: recentMemory.value },
    };
  }

  return {
    kind: "compass_highlight",
    goal: "explain_results",
    params: { cluster: kaiContext.assessment.primaryCluster, archetype: kaiContext.assessment.archetype },
  };
}

function buildGoalOrder(primaryMoment: KaiProactiveMoment | null): KaiConversationGoal[] {
  const order = [...BASE_GOAL_ORDER];
  const leadGoal = primaryMoment && "goal" in primaryMoment ? primaryMoment.goal : null;
  if (!leadGoal) return order;

  const index = order.indexOf(leadGoal);
  if (index > 0) {
    order.splice(index, 1);
    order.unshift(leadGoal);
  }
  return order;
}

/**
 * Pure over already-loaded data — same philosophy as buildKaiContext():
 * the caller reads localStorage/memory/conversation, this just decides
 * what Kai should lead with. No Gemini call, no network, fully
 * deterministic and unit-testable without touching the DOM.
 */
export function buildProactiveContext(input: {
  now: Date;
  kaiContext: KaiContext;
  snapshot: ProfileSnapshot;
  memory: KaiMemoryProfile;
  conversation: KaiConversation | null;
  daysSinceLastSeen: number | null;
}): KaiProactiveContext {
  const primaryMoment = buildPrimaryMoment(input);

  return {
    greetingKey: pickGreetingKey(input.now),
    primaryMoment,
    showInactivityNudge:
      input.daysSinceLastSeen !== null && input.daysSinceLastSeen >= INACTIVITY_THRESHOLD_DAYS,
    daysSinceLastSeen: input.daysSinceLastSeen,
    goalOrder: buildGoalOrder(primaryMoment),
  };
}
