import { z } from "zod";
import bundledGuide from "@/lib/admin/core/data/kai-subject-guide-1.0.json";

/**
 * The Kai subject guide as the admin checks it before saving an upload.
 * Must accept exactly what apps/consumer/lib/kai/core/subject-guide.ts
 * accepts: Kai falls back to its bundled copy if a stored file fails there.
 */
const subjectGuideSchema = z.object({
  name: z.string(),
  version: z.string().min(1),
  status: z.string(),
  rule_for_kai: z.array(z.string()).min(1),
  field_groups: z.record(
    z.string(),
    z.object({ name: z.string(), study_fields: z.array(z.string()) }),
  ),
  job_families: z
    .array(
      z.object({
        id: z.string(),
        family: z.string(),
        family_ar: z.string(),
        study_fields: z.string(),
        study_fields_ar: z.string(),
        field_groups: z.array(z.string()),
      }),
    )
    .min(1),
  countries: z.record(
    z.string(),
    z.object({
      note: z.string(),
      by_field_group: z.record(z.string(), z.record(z.string(), z.string())),
    }),
  ),
});

export type SubjectGuide = z.infer<typeof subjectGuideSchema>;

export function parseSubjectGuide(
  value: unknown,
): { ok: true; guide: SubjectGuide } | { ok: false; error: string } {
  const parsed = subjectGuideSchema.safeParse(value);
  if (parsed.success) return { ok: true, guide: parsed.data };
  const issue = parsed.error.issues[0];
  return {
    ok: false,
    error: `${issue?.path.join(".") || "file"}: ${issue?.message ?? "not a subject guide"}`,
  };
}

const parsedBundle = parseSubjectGuide(bundledGuide);
if (!parsedBundle.ok)
  throw new Error(`Bundled subject guide is invalid: ${parsedBundle.error}`);
export const BUNDLED_SUBJECT_GUIDE: SubjectGuide = parsedBundle.guide;

/** Statuses Kai must hedge on (rule_for_kai): not researched, partly sourced, not confirmed. */
const TO_CHECK = /not yet|partly|not confirmed|to add|confirm/i;

export interface SubjectGuideSummary {
  version: string;
  status: string;
  fieldGroups: number;
  jobFamilies: number;
  countries: string[];
  /** Country rows in all. */
  entries: number;
  /** Rows whose status says they are not fully checked. */
  entriesToCheck: number;
}

export function summarizeSubjectGuide(
  guide: SubjectGuide,
): SubjectGuideSummary {
  const rows = Object.values(guide.countries).flatMap((country) =>
    Object.values(country.by_field_group),
  );
  return {
    version: guide.version,
    status: guide.status,
    fieldGroups: Object.keys(guide.field_groups).length,
    jobFamilies: guide.job_families.length,
    countries: Object.keys(guide.countries),
    entries: rows.length,
    entriesToCheck: rows.filter((row) => TO_CHECK.test(row.status ?? ""))
      .length,
  };
}
