import type { KaiConversationGoal } from "@/lib/kai/chat-types";

/**
 * A single proactive recommendation Kai can lead with. Deliberately a
 * discriminated union with raw interpolation values in `params`, never
 * pre-rendered text — this stays pure TypeScript with no locale
 * dependency; `proactive-render.ts` is where a `t()` function turns one
 * of these into an actual EN/AR sentence. `next_step` has no `goal`
 * because it routes to `/start` (a real assessment), not a chat goal.
 */
export type KaiProactiveMoment =
  | { kind: "resume_conversation"; params: { summary: string } }
  | { kind: "resume_topic"; goal: KaiConversationGoal; params: { topic: string } }
  | { kind: "next_step"; params: { module: string; duration: string } }
  | { kind: "compass_highlight"; goal: KaiConversationGoal; params: { cluster: string; archetype: string } };

export type KaiProactiveMomentKind = KaiProactiveMoment["kind"];

export interface KaiProactiveContext {
  greetingKey: "kai.panel.greeting_morning" | "kai.panel.greeting_afternoon" | "kai.panel.greeting_evening";
  /** The one thing Kai leads with — null only for the rare state where
   * nothing applies (handled by existing empty states instead). */
  primaryMoment: KaiProactiveMoment | null;
  /** A separate, additive signal — never competes with primaryMoment for
   * the "one recommended action" slot, just tells the caller whether to
   * layer in a gentle "it's been a while" note. */
  showInactivityNudge: boolean;
  daysSinceLastSeen: number | null;
  /** KAI_ACTIONS ids, reordered so whatever primaryMoment points at (if
   * anything) leads the goal-chip row — never removes any action. */
  goalOrder: KaiConversationGoal[];
}
