import { z } from "zod";
import type { AnalyticsEvent } from "@/lib/analytics/types";

/**
 * The full event taxonomy. Grouped by domain for readability; flattened
 * into one `EventName` union for the rest of the library.
 */
export const ASSESSMENT_EVENT_NAMES = [
  "assessment_started",
  "question_viewed",
  "question_answered",
  "question_answer_changed",
  "question_completed",
  "question_time_spent",
  "question_skipped",
  "question_revisited",
  "question_abandoned",
  "question_auto_advanced",
  "assessment_completed",
  "assessment_abandoned",
  "assessment_resumed",
  "assessment_retaken",
] as const;

export const RESULTS_EVENT_NAMES = [
  "results_generated",
  "results_viewed",
  "results_downloaded",
  "results_shared",
  "recommendations_opened",
  "career_profile_opened",
] as const;

export const AI_EVENT_NAMES = [
  "ai_generation_started",
  "ai_generation_completed",
  "ai_generation_failed",
  "translation_generated",
  "assessment_import_generated",
] as const;

export const ADMIN_EVENT_NAMES = [
  "assessment_created",
  "assessment_updated",
  "assessment_published",
  "assessment_archived",
  "rule_updated",
  "profile_updated",
] as const;

export const SESSION_EVENT_NAMES = [
  "session_started",
  "session_ended",
  "page_view",
  "navigation",
] as const;

/**
 * Kai Landing (Profile > Kai) — Phase 1: greeting/insight/actions/
 * grounding/locked tools.
 */
export const KAI_EVENT_NAMES = [
  "kai_opened",
  "kai_action_clicked",
  "kai_grounding_opened",
  "kai_locked_tool_clicked",
] as const;

/** Kai Conversation — Phase 2. */
export const KAI_CHAT_EVENT_NAMES = [
  "kai_chat_started",
  "kai_message_sent",
  "kai_message_received",
  "kai_quick_reply_clicked",
  "kai_recommendation_clicked",
  "kai_conversation_finished",
] as const;

/** Kai Memory & Personalization — Phase 3. */
export const KAI_MEMORY_EVENT_NAMES = [
  "kai_memory_created",
  "kai_memory_updated",
  "kai_memory_deleted",
  "kai_resume_clicked",
  "kai_goal_saved",
] as const;

/** Kai Learning Resources. */
export const KAI_RESOURCE_EVENT_NAMES = [
  "kai_resource_saved",
  "kai_resource_added_to_plan",
  "kai_resource_search_opened",
] as const;

/** Kai Proactive Layer — Phase E. */
export const KAI_PROACTIVE_EVENT_NAMES = [
  "kai_proactive_shown",
  "kai_proactive_clicked",
  "kai_goal_chip_clicked",
] as const;

/** Kai Response Engine v2 — coaching framework, intent detection, and
 * saved/trackable action plans. */
export const KAI_COACHING_EVENT_NAMES = [
  "kai_intent_detected",
  "kai_block_rendered",
  "kai_plan_saved",
  "kai_task_completed",
  "kai_family_script_generated",
] as const;

export const EVENT_NAMES = [
  ...ASSESSMENT_EVENT_NAMES,
  ...RESULTS_EVENT_NAMES,
  ...AI_EVENT_NAMES,
  ...ADMIN_EVENT_NAMES,
  ...SESSION_EVENT_NAMES,
  ...KAI_EVENT_NAMES,
  ...KAI_CHAT_EVENT_NAMES,
  ...KAI_MEMORY_EVENT_NAMES,
  ...KAI_RESOURCE_EVENT_NAMES,
  ...KAI_PROACTIVE_EVENT_NAMES,
  ...KAI_COACHING_EVENT_NAMES,
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && (EVENT_NAMES as readonly string[]).includes(value);
}

const deviceSchema = z
  .object({
    type: z.enum(["mobile", "tablet", "desktop", "unknown"]),
    userAgent: z.string().max(300).optional(),
  })
  .nullable();

/**
 * Validates one event on the way into the ingestion endpoint. Deliberately
 * strict on shape (reject malformed events) but permissive on `metadata`
 * (event-specific, evolves without a migration).
 */
export const analyticsEventSchema = z.object({
  event_id: z.string().uuid(),
  timestamp: z.string().datetime({ offset: true }),
  event_name: z.enum(EVENT_NAMES),
  session_id: z.string().min(1).max(100),
  user_id_hash: z.string().max(128).nullable(),
  assessment_id: z.string().max(100).nullable(),
  assessment_version: z.string().max(50).nullable(),
  // Optional (unlike assessment_id/version): only question-scoped events
  // set this, and older/other producers that predate this field shouldn't
  // be rejected for omitting it.
  question_id: z.string().max(100).nullable().optional(),
  locale: z.string().max(20).nullable(),
  device: deviceSchema,
  country: z.string().max(56).nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

export const analyticsBatchSchema = z.object({
  events: z.array(z.unknown()).min(1).max(200),
});

export type AnalyticsBatch = z.infer<typeof analyticsBatchSchema>;

export interface PartitionedEvents {
  valid: AnalyticsEvent[];
  rejectedCount: number;
}

/**
 * Validates each event independently so one malformed event in a batch
 * doesn't sink the rest — partial success is the point of batching.
 */
export function partitionValidEvents(rawEvents: unknown[]): PartitionedEvents {
  const valid: AnalyticsEvent[] = [];
  let rejectedCount = 0;
  for (const raw of rawEvents) {
    const result = analyticsEventSchema.safeParse(raw);
    if (result.success) valid.push(result.data as AnalyticsEvent);
    else rejectedCount += 1;
  }
  return { valid, rejectedCount };
}
