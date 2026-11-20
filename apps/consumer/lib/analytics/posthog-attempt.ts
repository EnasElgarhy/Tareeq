import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { attributionLabels } from "@/lib/analytics/attribution";
import {
  attemptDistinctId,
  profileProperties,
  utmProperties,
  type LaunchEventName,
  type LaunchProperties,
} from "@/lib/analytics/launch-events";
import { capturePostHogServerEvent } from "@/lib/analytics/posthog-server";

/** The student's source labels as stored on a Stripe session or a parent link. */
type StoredLabels = Readonly<Record<string, string | null | undefined>> | null | undefined;

/**
 * Sends a server-side event for one attempt: the student's first-visit link
 * tags (kept on the Stripe session or the parent link) plus language and the
 * background groups read from the saved attempt. Never throws.
 */
export async function captureAttemptEvent(
  admin: SupabaseClient,
  name: LaunchEventName,
  assessmentId: string,
  labels: StoredLabels,
  extra: LaunchProperties = {},
): Promise<void> {
  try {
    const { data, error } = await admin
      .from("assessments")
      .select("locale, answers")
      .eq("id", assessmentId)
      .maybeSingle();
    if (error) console.error(`[posthog] Attempt read failed for ${name}`, error.message);
    const answers =
      data?.answers && typeof data.answers === "object" ? (data.answers as Record<string, unknown>) : null;
    await capturePostHogServerEvent(name, await attemptDistinctId(assessmentId), {
      ...utmProperties(
        attributionLabels({
          src: labels?.src ?? undefined,
          post: labels?.post,
          medium: labels?.medium,
          campaign: labels?.campaign,
        }),
      ),
      ...profileProperties({ locale: typeof data?.locale === "string" ? data.locale : null, answers }),
      ...extra,
    });
  } catch (error) {
    console.error(`[posthog] ${name} not recorded`, error instanceof Error ? error.message : error);
  }
}
