import type { KaiLearningResource } from "@/lib/kai/resource-types";
import type { KaiMessageIntent } from "@/lib/kai/intent";

/**
 * Normalized shapes for the Kai conversation — Phase 2. These are the
 * ONLY shapes that ever touch localStorage or get returned by
 * `/api/kai/chat`. Raw Gemini payloads never leave the server route;
 * everything here is plain, serializable, and safe to migrate to a
 * Supabase table later without a rewrite.
 */

/** Every conversation starts with a goal — it's threaded into the system
 * prompt so Gemini's first reply is shaped around what the user actually
 * wants, not a generic "how can I help." */
export type KaiConversationGoal =
  | "explain_results"
  | "find_majors"
  | "compare_careers"
  | "build_plan"
  | "explain_to_parents"
  | "challenge_result";

export type KaiChatRole = "user" | "kai";

export type KaiMessageStatus = "pending" | "complete" | "failed";

export interface KaiCareerCardBlock {
  type: "career_card";
  title: string;
  description: string;
}

export interface KaiUniversityCardBlock {
  type: "university_card";
  title: string;
  description: string;
}

export interface KaiActionTask {
  id: string;
  text: string;
  estimatedTime?: string;
}

export interface KaiActionPlanBlock {
  type: "action_plan";
  title: string;
  durationLabel?: string;
  tasks: KaiActionTask[];
}

export interface KaiComparisonBlock {
  type: "comparison";
  leftLabel: string;
  leftPoints: string[];
  rightLabel: string;
  rightPoints: string[];
}

export interface KaiJourneyBlock {
  type: "journey";
  title: string;
}

/** Gemini can only signal "show what you remember" + an optional lead-in
 * line — the memory items actually rendered always come from real
 * stored memory (lib/kai/memory/), never from this block's own fields. */
export interface KaiMemoryCardBlock {
  type: "memory_card";
  title: string;
}

/** Same rule as memory_card — Gemini signals the moment, the client
 * renders real past "recommendation" category memory items. */
export interface KaiRecommendationHistoryBlock {
  type: "recommendation_history";
  title: string;
}

/** A continuity prompt referencing a real past topic/goal — Gemini
 * authors the specific line, since it's the one composing the callback. */
export interface KaiResumeConversationBlock {
  type: "resume_conversation";
  title: string;
  description: string;
}

/** A goal the person just stated, worth saving — genuinely
 * Gemini-authored since it's freshly extracted from what they said. */
export interface KaiGoalCardBlock {
  type: "goal_card";
  title: string;
  description: string;
}

/** Gemini can only caption this — the milestone itself always comes
 * from the real journey data (lib/profile/activity.ts), never invented. */
export interface KaiMilestoneCardBlock {
  type: "milestone_card";
  title: string;
}

/** Structured learning-resource recommendations — no search backend, no
 * retrieval, no URLs. Gemini proposes these from its own knowledge as
 * part of the normal turn; the client renders them as cards and owns
 * save/bookmark/action-plan state (lib/kai/resource-storage.ts). */
export interface KaiLearningResourcesBlock {
  type: "learning_resources";
  title: string;
  resources: KaiLearningResource[];
}

export interface KaiSourceCitation {
  title: string;
  url: string;
}

/** Verified web references attached from Gemini grounding metadata on the
 * server. The model cannot author this block or its URLs. */
export interface KaiSourceListBlock {
  type: "source_list";
  title: string;
  sources: KaiSourceCitation[];
}

/** The "Ground" step of the coaching framework — a short callout tying
 * the answer back to the learner's real cluster/archetype/driver/
 * ecosystem, distinct from the persistent KaiGroundingCard header
 * (which always shows the deterministic result, not a per-turn take). */
export interface KaiInsightBlock {
  type: "insight_block";
  title: string;
  body: string;
}

/** A lightweight structured list — for anything short of a full
 * checklist (no check-off state). */
export interface KaiBulletListBlock {
  type: "bullet_list";
  title?: string;
  items: string[];
}

/** An in-chat, session-only check-off list. Not persisted — saving and
 * tracking progress is reserved for action_plan (see KaiActionPlanBlock
 * + lib/kai/plans/). */
export interface KaiChecklistBlock {
  type: "checklist";
  title: string;
  items: string[];
}

export interface KaiTalkingPointsBlock {
  type: "talking_points";
  title: string;
  points: string[];
}

/** Literal lines the learner can say — e.g. to a parent. */
export interface KaiFamilyScriptBlock {
  type: "family_script";
  title: string;
  script: string[];
}

export interface KaiObjectionResponseItem {
  objection: string;
  response: string;
}

export interface KaiObjectionResponseBlock {
  type: "objection_response_list";
  title: string;
  items: KaiObjectionResponseItem[];
}

/** A single coaching question posed back to the learner — prompts
 * reflection rather than answering for them. */
export interface KaiReflectionQuestionBlock {
  type: "reflection_question";
  question: string;
}

/** An N-way comparison grid — for more than the two options
 * KaiComparisonBlock handles. */
export interface KaiComparisonTableBlock {
  type: "comparison_table";
  title: string;
  columns: string[];
  rows: Array<{ label: string; values: string[] }>;
}

export interface KaiDecisionMatrixRow {
  criterion: string;
  /** One score per option, same order as `options` — keeps each row
   * self-contained instead of a parallel criteria[]/scores[][] pair. */
  scores: number[];
}

export interface KaiDecisionMatrixBlock {
  type: "decision_matrix";
  title: string;
  options: string[];
  rows: KaiDecisionMatrixRow[];
  recommendation?: string;
}

export type KaiMessageBlock =
  | KaiCareerCardBlock
  | KaiUniversityCardBlock
  | KaiActionPlanBlock
  | KaiComparisonBlock
  | KaiJourneyBlock
  | KaiMemoryCardBlock
  | KaiRecommendationHistoryBlock
  | KaiResumeConversationBlock
  | KaiGoalCardBlock
  | KaiMilestoneCardBlock
  | KaiLearningResourcesBlock
  | KaiSourceListBlock
  | KaiInsightBlock
  | KaiBulletListBlock
  | KaiChecklistBlock
  | KaiTalkingPointsBlock
  | KaiFamilyScriptBlock
  | KaiObjectionResponseBlock
  | KaiReflectionQuestionBlock
  | KaiComparisonTableBlock
  | KaiDecisionMatrixBlock;

export interface KaiMessage {
  id: string;
  role: KaiChatRole;
  createdAt: string;
  text: string;
  /** Shared by the user turn and Kai reply so retries can be deduplicated. */
  requestId?: string;
  /** Stored on the user turn so an idempotent retry reuses the reply row. */
  assistantMessageId?: string;
  status?: KaiMessageStatus;
  errorCode?: string;
  blocks?: KaiMessageBlock[];
  quickReplies?: string[];
  /** What Gemini judged this turn's intent to be — for analytics/
   * debugging only; never used to gate rendering. */
  intent?: KaiMessageIntent;
}

export interface KaiConversation {
  id: string;
  goal: KaiConversationGoal;
  title?: string;
  messages: KaiMessage[];
  /** A short rolling summary of the conversation so far — sent to Gemini
   * instead of the full message history once it grows long. */
  summary: string;
  createdAt: string;
  lastOpened: string;
}

export interface KaiThreadStore {
  version: 2;
  activeThreadId: string | null;
  threads: KaiConversation[];
}
