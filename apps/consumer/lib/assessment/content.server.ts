import "server-only";

import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import {
  assessmentVersionCookieName,
  getSeedAssessmentContent,
  mapCmsAssessmentQuestions,
  seedLabelFromCookie,
  type AssessmentContentSnapshot,
  type AssessmentVersionRef,
  type CmsQuestionRow,
} from "@/lib/assessment/content";
import { contentVersion } from "@/lib/content/seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ContentVersionRow = {
  id: string;
  label: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
};

function hasCmsConfiguration() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

const loadPublishedVersionCached = unstable_cache(
  async (versionId: string): Promise<AssessmentContentSnapshot | null> => {
    if (!hasCmsConfiguration()) return null;
    const supabase = createSupabaseAdminClient();
    const versionResponse = await supabase
      .from("content_versions")
      .select("id,label,is_active,published_at,created_at")
      .eq("id", versionId)
      .maybeSingle();

    if (versionResponse.error || !versionResponse.data) return null;
    const version = versionResponse.data as ContentVersionRow;
    if (!version.is_active && !version.published_at) return null;

    const questionsResponse = await supabase
      .from("questions")
      .select(
        "external_id,pillar,position,kind,title,axis,is_archived,question_options(letter,position,text,cluster_code,driver_code,axis_value)",
      )
      .eq("version_id", version.id)
      .order("pillar")
      .order("position");
    if (questionsResponse.error) return null;

    try {
      return {
        versionId: version.id,
        versionLabel: version.label,
        source: "cms",
        questions: mapCmsAssessmentQuestions(
          (questionsResponse.data ?? []) as unknown as CmsQuestionRow[],
        ),
      };
    } catch (error) {
      console.error(
        `Invalid published assessment version ${version.id}:`,
        error,
      );
      return null;
    }
  },
  ["published-assessment-content"],
  { revalidate: 30 },
);

async function findVersion(
  field: "is_active" | "label",
  value: boolean | string,
) {
  if (!hasCmsConfiguration()) return null;
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("content_versions")
    .select("id,label,is_active,published_at,created_at")
    .order("created_at", { ascending: false });
  query =
    field === "is_active"
      ? query.eq("is_active", value as boolean)
      : query.eq("label", value as string);
  const response = await query.limit(10);
  if (response.error) return null;

  return (
    ((response.data ?? []) as ContentVersionRow[]).find(
      (version) => version.is_active || Boolean(version.published_at),
    ) ?? null
  );
}

export async function loadPublishedAssessmentContent(versionId: string) {
  return loadPublishedVersionCached(versionId);
}

export async function loadActiveAssessmentContent() {
  const active = await findVersion("is_active", true);
  if (active) {
    const content = await loadPublishedVersionCached(active.id);
    if (content) return content;
  }
  return getSeedAssessmentContent();
}

export async function loadAssessmentContentForReference(
  ref: Partial<AssessmentVersionRef>,
): Promise<AssessmentContentSnapshot | null> {
  if (ref.versionId) return loadPublishedVersionCached(ref.versionId);

  if (ref.versionLabel) {
    const version = await findVersion("label", ref.versionLabel);
    if (version) {
      const content = await loadPublishedVersionCached(version.id);
      if (content) return content;
    }
    if (ref.versionLabel === contentVersion.label) {
      return getSeedAssessmentContent();
    }
    return null;
  }

  return loadActiveAssessmentContent();
}

export async function loadAttemptAssessmentContent() {
  const cookieStore = await cookies();
  const value = cookieStore.get(assessmentVersionCookieName)?.value;
  if (!value) return loadActiveAssessmentContent();

  const seedLabel = seedLabelFromCookie(value);
  if (seedLabel) {
    const content = await loadAssessmentContentForReference({
      versionLabel: seedLabel,
    });
    if (content) return content;
  } else {
    const content = await loadPublishedVersionCached(value);
    if (content) return content;
  }

  return loadActiveAssessmentContent();
}
