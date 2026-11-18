import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BUNDLED_SUBJECT_GUIDE, parseSubjectGuide, type SubjectGuide } from "./subject-guide";

/** The row Enas replaces from the admin (kai_reference_documents). */
export const SUBJECT_GUIDE_KEY = "subject_guide";
const CACHE_MS = 5 * 60_000;

let cached: { guide: SubjectGuide; at: number } | null = null;

/**
 * The current subject guide: the admin's upload when there is a valid one,
 * otherwise the approved version that ships with the app. Read at most every
 * five minutes per instance; any failure falls back rather than failing Kai.
 */
export async function loadSubjectGuide(now: number = Date.now()): Promise<SubjectGuide> {
  if (cached && now - cached.at < CACHE_MS) return cached.guide;
  let guide = BUNDLED_SUBJECT_GUIDE;
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("kai_reference_documents")
      .select("document")
      .eq("key", SUBJECT_GUIDE_KEY)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.document) {
      const parsed = parseSubjectGuide(data.document);
      if (parsed.ok) guide = parsed.guide;
      else console.error("[kai/subject-guide] stored guide is invalid; using bundled", parsed.error);
    }
  } catch (error) {
    console.warn("[kai/subject-guide] could not read the stored guide; using bundled", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  cached = { guide, at: now };
  return guide;
}
