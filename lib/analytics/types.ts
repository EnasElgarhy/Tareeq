/**
 * Shared structural types for the analytics library. The event-name
 * taxonomy and validation schema live in events.ts; this file is just the
 * shapes everything else (queue, flush, track) is built around.
 */

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export interface DeviceInfo {
  type: DeviceType;
  /** Truncated, never used to fingerprint — just coarse mobile/desktop UX context. */
  userAgent?: string;
}

/** The fully-assembled event, exactly as it's queued, flushed, and stored. No PII. */
export interface AnalyticsEvent {
  event_id: string;
  timestamp: string;
  event_name: string;
  session_id: string;
  user_id_hash: string | null;
  assessment_id: string | null;
  assessment_version: string | null;
  /**
   * `questions.external_id` (e.g. "Q5"), NOT `questions.id` — the consumer
   * app renders questions from a static seed file with no DB UUID at all
   * (`lib/assessment/questions.ts` / `lib/content/seed`), so the client
   * literally cannot emit a `questions.id` it doesn't have. `external_id`
   * is also the *better* key here regardless: it's stable across versions
   * (same `(version_id, external_id)` question re-created on every
   * clone-to-draft), matching how `assessments.answers` (jsonb keyed by
   * external_id) and version comparison already have to key on it. Admin
   * UI routes still use the version-scoped `questions.id` UUID (that's
   * what the admin's own question list actually has); resolving UUID →
   * external_id is one small lookup at the aggregation boundary. Null for
   * non-question events.
   */
  question_id: string | null;
  locale: string | null;
  device: DeviceInfo | null;
  country: string | null;
  metadata: Record<string, unknown>;
}

/**
 * What a caller passes to `trackEvent(name, payload)`. Context fields are
 * pulled out and placed on the envelope; everything else (including
 * `questionPosition`, `pillar`, `selectedAnswer`, `previousAnswer`,
 * `timeSpentMs`, `isFirstVisit`, `attemptNumber`, etc.) rides as metadata —
 * `questionId` is the one question-scoped field promoted to the envelope
 * (and its own indexed DB column) because it's the join key every
 * question-analytics query aggregates by; position/pillar are point-in-time
 * context that can shift across versions, so they stay in metadata rather
 * than implying a stable identity they don't have.
 */
export interface TrackEventPayload {
  assessmentId?: string | null;
  assessmentVersion?: string | null;
  questionId?: string | null;
  /** Raw id — hashed before it ever leaves the client, never sent or stored raw. */
  userId?: string | null;
  country?: string | null;
  [key: string]: unknown;
}

export interface QueuedEvent {
  event: AnalyticsEvent;
  /** Number of failed flush attempts so far. */
  attempts: number;
}

export interface FlushResult {
  ok: boolean;
  /** Events that should be retried (network/5xx failure) vs. dropped (4xx — malformed). */
  retryable: AnalyticsEvent[];
  error?: string;
}

/** A provider sends a batch somewhere — Supabase today, PostHog/GA4/etc. later. */
export interface AnalyticsProvider {
  name: string;
  send(events: AnalyticsEvent[]): Promise<FlushResult>;
}
