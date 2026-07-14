import type { KaiMessageBlock } from "@/lib/kai/chat-types";
import type { KaiMessageIntent } from "@/lib/kai/intent";

type BlockType = KaiMessageBlock["type"];

/**
 * Intents where coaching content must land in specific blocks, not
 * conversational prose. Missing any of these triggers the repair →
 * retry → fallback pipeline in chat-server.ts / route.ts.
 *
 * Deliberately lean, not exhaustive: the brief's per-intent lists name
 * several roles (e.g. family_conversation: empathy + family-concerns +
 * talking points + script + objections + checklist) that map onto the
 * SAME already-built block types rather than 6 distinct ones —
 * `insight_block` already carries both "empathy" and "naming what the
 * family worries about" in one card, so it isn't listed twice. Kept
 * intentionally short for a second reason: every additional required
 * block raises the odds of the Gemini repetition-loop failure mode
 * documented in KAI_RESPONSE_ENGINE_SUMMARY.md — requiring the full
 * 5-6 block set every single turn would fight directly against the
 * reliability work already done. Blocks not listed here are still
 * ALLOWED (see chat-prompt.ts's INTENT_BLOCK_TYPES) — Gemini can still
 * include an objection_response_list, it's just not force-required.
 *
 * Intents absent from this map (career_comparison, university_guidance,
 * challenge_result, confidence_building, next_step, general_question)
 * have no hard requirement — matches the brief's "unless it is
 * genuinely simple" carve-out.
 */
export const INTENT_REQUIRED_BLOCKS: Partial<Record<KaiMessageIntent, readonly BlockType[]>> = {
  explain_result: ["insight_block"],
  family_conversation: ["talking_points", "family_script", "checklist"],
  resource_recommendation: ["learning_resources"],
  action_plan: ["action_plan"],
  study_plan: ["action_plan"],
};

/** Returns the required block types for `intent` that are absent from
 * `blocks` — empty when the contract is already satisfied (including
 * when `intent` has no requirement at all). */
export function getMissingRequiredBlocks(
  intent: KaiMessageIntent,
  blocks: KaiMessageBlock[] | undefined,
): BlockType[] {
  const required = INTENT_REQUIRED_BLOCKS[intent];
  if (!required || required.length === 0) return [];

  const present = new Set((blocks ?? []).map((block) => block.type));
  return required.filter((type) => !present.has(type));
}
