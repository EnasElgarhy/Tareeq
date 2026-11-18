import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  BUNDLED_SUBJECT_GUIDE,
  parseSubjectGuide,
  type SubjectGuide,
} from "./subject-guide";

export const SUBJECT_GUIDE_KEY = "subject_guide";

export type CurrentSubjectGuide =
  | {
      source: "uploaded";
      guide: SubjectGuide;
      updatedAt: string;
      updatedBy: string | null;
    }
  | {
      source: "bundled";
      guide: SubjectGuide;
      reason: "none" | "unavailable" | "invalid";
    };

/** The guide Kai is using right now, as the student site resolves it. */
export async function getCurrentSubjectGuide(): Promise<CurrentSubjectGuide> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("kai_reference_documents")
    .select("document, updated_at, updated_by")
    .eq("key", SUBJECT_GUIDE_KEY)
    .maybeSingle();
  if (error)
    return {
      source: "bundled",
      guide: BUNDLED_SUBJECT_GUIDE,
      reason: "unavailable",
    };
  if (!data)
    return { source: "bundled", guide: BUNDLED_SUBJECT_GUIDE, reason: "none" };
  const parsed = parseSubjectGuide(data.document);
  if (!parsed.ok)
    return {
      source: "bundled",
      guide: BUNDLED_SUBJECT_GUIDE,
      reason: "invalid",
    };

  let updatedBy: string | null = null;
  if (data.updated_by) {
    const { data: user } = await sb.auth.admin.getUserById(
      data.updated_by as string,
    );
    updatedBy = user.user?.email ?? null;
  }
  return {
    source: "uploaded",
    guide: parsed.guide,
    updatedAt: data.updated_at as string,
    updatedBy,
  };
}
