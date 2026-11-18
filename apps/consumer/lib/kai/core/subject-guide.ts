import { z } from "zod";
import bundledGuide from "@/lib/core-v2/content/data/kai-subject-guide-1.0.json";

/**
 * The Kai subject guide (developer note of 17 Nov 2026): which school
 * subjects, streams or tracks students usually take for a study field, in
 * the UAE, Saudi Arabia and Egypt. Kai receives it as SUBJECT_GUIDE and may
 * use nothing else on subjects. Enas replaces the file from the admin; the
 * approved version 1.0 ships with the app as the fallback.
 */

const fieldGroupSchema = z.object({
  name: z.string(),
  study_fields: z.array(z.string()),
});

const jobFamilySchema = z.object({
  id: z.string(),
  family: z.string(),
  family_ar: z.string(),
  study_fields: z.string(),
  study_fields_ar: z.string(),
  field_groups: z.array(z.string()),
});

const countrySchema = z.object({
  note: z.string(),
  // UAE and Saudi rows and Egypt rows carry different fields; each has a status.
  by_field_group: z.record(z.string(), z.record(z.string(), z.string())),
});

const subjectGuideSchema = z.object({
  name: z.string(),
  version: z.string().min(1),
  status: z.string(),
  rule_for_kai: z.array(z.string()).min(1),
  field_groups: z.record(z.string(), fieldGroupSchema),
  job_families: z.array(jobFamilySchema).min(1),
  countries: z.record(z.string(), countrySchema),
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
if (!parsedBundle.ok) throw new Error(`Bundled subject guide is invalid: ${parsedBundle.error}`);
export const BUNDLED_SUBJECT_GUIDE: SubjectGuide = parsedBundle.guide;

/** The profile's country (the QD2 list) → the guide's country entry. */
const COUNTRY_KEYS: Record<string, string> = {
  "united arab emirates": "UAE",
  uae: "UAE",
  "saudi arabia": "Saudi Arabia",
  egypt: "Egypt",
};

export function guideCountryKey(country: string | null): string | null {
  if (!country) return null;
  return COUNTRY_KEYS[country.trim().toLowerCase()] ?? null;
}

type CountryRow = SubjectGuide["countries"][string]["by_field_group"][string];

/**
 * What Kai receives, with every internal code replaced by its name: Kai
 * must never show a student an id such as F-RD-4 or a code such as MED.
 */
export interface SubjectGuideView {
  name: string;
  version: string;
  status: string;
  rule_for_kai: string[];
  field_groups: Array<{ name: string; study_fields: string[] }>;
  /** The job families in this student's report, with their field groups. */
  job_families: Array<{
    family: string;
    family_ar: string;
    study_fields: string;
    study_fields_ar: string;
    field_groups: string[];
  }>;
  /** The student's country entry, rows keyed by field-group name; null when not covered. */
  country: { name: string; note: string; by_field_group: Record<string, CountryRow> } | null;
  countries_covered: string[];
}

/**
 * What Kai receives for one student: the rules, every field group, the
 * whole entry for their country and the rows for their report's families.
 */
export function subjectGuideFor(
  guide: SubjectGuide,
  student: { country: string | null; familyIds: readonly string[] },
): SubjectGuideView {
  const groupName = (code: string) => guide.field_groups[code]?.name ?? code;
  const wanted = new Set(student.familyIds);
  const key = guideCountryKey(student.country);
  const entry = key ? guide.countries[key] : undefined;
  return {
    name: guide.name,
    version: guide.version,
    status: guide.status,
    rule_for_kai: guide.rule_for_kai,
    field_groups: Object.values(guide.field_groups),
    job_families: guide.job_families
      .filter((family) => wanted.has(family.id))
      .map((family) => ({
        family: family.family,
        family_ar: family.family_ar,
        study_fields: family.study_fields,
        study_fields_ar: family.study_fields_ar,
        field_groups: family.field_groups.map(groupName),
      })),
    country:
      key && entry
        ? {
            name: key,
            note: entry.note,
            by_field_group: Object.fromEntries(
              Object.entries(entry.by_field_group).map(([code, row]) => [groupName(code), row]),
            ),
          }
        : null,
    countries_covered: Object.keys(guide.countries),
  };
}
