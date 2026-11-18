"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseSubjectGuide } from "./subject-guide";
import { SUBJECT_GUIDE_KEY } from "./subject-guide-store";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export type UploadState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "saved"; version: string };

/** Replaces the subject guide Kai reads. Checked first; nothing is saved if it fails. */
export async function uploadSubjectGuide(
  _previous: UploadState,
  form: FormData,
): Promise<UploadState> {
  const actor = await requirePermission("content.edit");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      kind: "error",
      message: "Choose the subject guide's JSON file first.",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      kind: "error",
      message:
        "That file is larger than 2 MB. Check it is the subject guide JSON.",
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return {
      kind: "error",
      message:
        "That file isn't valid JSON. Upload the platform JSON, not the Word file.",
    };
  }
  const parsed = parseSubjectGuide(json);
  if (!parsed.ok) {
    return {
      kind: "error",
      message: `This isn't a complete subject guide (${parsed.error}). Nothing was changed.`,
    };
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("kai_reference_documents").upsert({
    key: SUBJECT_GUIDE_KEY,
    version: parsed.guide.version,
    document: parsed.guide,
    updated_at: new Date().toISOString(),
    updated_by: actor.id,
  });
  if (error) {
    console.error("[admin/subject-guide] save failed", error.message);
    return {
      kind: "error",
      message:
        "The guide couldn't be saved. Try again, or ask the developer if it keeps failing.",
    };
  }
  await sb.from("admin_audit_log").insert({
    actor_user_id: actor.id,
    action: "kai.subject_guide_replaced",
    target_user_id: null,
    metadata: { version: parsed.guide.version },
  });
  revalidatePath("/admin/content/core/subject-guide");
  return { kind: "saved", version: parsed.guide.version };
}
