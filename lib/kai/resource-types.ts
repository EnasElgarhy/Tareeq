/**
 * Learning resource recommendations — Gemini proposes these as part of
 * its normal structured turn (see chat-prompt.ts's KAI_CHAT_RESPONSE_SCHEMA),
 * no separate search/retrieval call. Deliberately no URL field: the brief
 * asks for premium recommendation cards, not a link directory, and
 * omitting URLs also sidesteps ever needing to validate a Gemini-invented
 * link. Swapping this for a real retrieval-backed source later only means
 * changing what populates these same fields server-side — the card UI
 * never needs to change.
 */
export type KaiResourceType =
  | "book"
  | "course"
  | "youtube_video"
  | "article"
  | "podcast"
  | "community"
  | "website"
  | "project"
  | "competition";

export type KaiResourceDifficulty = "beginner" | "intermediate" | "advanced";

export interface KaiLearningResource {
  type: KaiResourceType;
  title: string;
  authorOrProvider: string;
  reason: string;
  difficulty: KaiResourceDifficulty;
  estimatedTime: string;
  /** Gemini's proposed search phrase, when a better one than the
   * default `${title} ${authorOrProvider}` derivation exists — e.g.
   * "day in the life of a marine biologist" for a youtube_video. */
  searchQuery?: string;
}

/** A resource the user chose to keep. Fields are snapshotted at
 * save-time — Kai isn't asked about it again later. */
export interface KaiSavedResource extends KaiLearningResource {
  id: string;
  savedAt: string;
  inActionPlan: boolean;
}
