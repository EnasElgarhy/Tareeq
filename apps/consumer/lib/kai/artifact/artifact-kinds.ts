import type { KaiMessageIntent } from "@/lib/kai/intent";

/**
 * Phase 2 two-engine boundary (see docs/kai-audit/KAI_PHASE_2_ARCHITECTURE.md).
 *
 * A handful of intents produce HEAVY, nested-array structured outputs
 * (action plans with a tasks[] array, family scripts with objection lists,
 * career comparisons with row/column matrices). The Phase 1 audit measured
 * that exactly these trip gemini-2.5-flash into a repetition loop under the
 * full response schema. `needsArtifact` names that class, and each kind maps
 * to a single PRIMARY block type used for the simplified recovery retry — one
 * block type instead of a union means far less constrained-decoding branching,
 * which is what recovers the answer instead of failing to a generic fallback.
 */

export type ArtifactKind = "action_plan" | "family_script" | "comparison";

export interface ArtifactRequest {
  kind: ArtifactKind;
  /** The intent that triggered the heavy artifact. */
  intent: KaiMessageIntent;
}

/**
 * Intents whose answer is a heavy artifact. Deliberately limited to the
 * measured failure class — lighter intents (next_step, university_guidance)
 * stay on the normal single-call path and must NOT trigger a recovery retry.
 */
const INTENT_TO_ARTIFACT: Partial<Record<KaiMessageIntent, ArtifactKind>> = {
  action_plan: "action_plan",
  study_plan: "action_plan",
  family_conversation: "family_script",
  career_comparison: "comparison",
};

/**
 * Generic text-only recovery hint for a repetition loop on a LIGHT intent
 * (one with no dedicated artifact kind). The loop is stochastic and hits light
 * intents too (measured), so any `provider_repetition_loop` — not just heavy
 * artifacts — gets one text-only recovery attempt before the fallback.
 */
export const GENERIC_RECOVERY_HINT =
  "IMPORTANT: answer entirely in plain text — do NOT use structured blocks. Keep your reply short and concise.";

/**
 * Recovery instruction per kind. The recovery is TEXT-ONLY (see
 * buildRecoverySchema): structured blocks loop under constrained decoding for
 * these intents, so the model writes the whole short answer inline in `text`.
 */
export const ARTIFACT_SIMPLIFY_HINT: Record<ArtifactKind, string> = {
  action_plan:
    "IMPORTANT: answer entirely in plain text — do NOT use structured blocks. Give a SHORT plan as a numbered list of at most 5 steps, each one short line, written directly in your text reply.",
  family_script:
    "IMPORTANT: answer entirely in plain text — do NOT use structured blocks. Give a brief opener and at most 3 short lines they could say, written directly in your text reply.",
  comparison:
    "IMPORTANT: answer entirely in plain text — do NOT use structured blocks. Give a SHORT comparison as a few concise bullet lines per option, written directly in your text reply.",
};

/** Returns the artifact descriptor for an intent, or null when the intent's
 *  answer is a normal (light) conversational reply. */
export function needsArtifact(intent: KaiMessageIntent): ArtifactRequest | null {
  const kind = INTENT_TO_ARTIFACT[intent];
  return kind ? { kind, intent } : null;
}
