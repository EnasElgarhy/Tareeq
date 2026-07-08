import { SharedResultScreen, SharedResultNotFound } from "@/components/assessment/SharedResultScreen";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/i18n/locale";
import type { PersonalizedCompassReport } from "@/lib/results/types";

export const runtime = "nodejs";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

function isReportShaped(value: unknown): value is PersonalizedCompassReport {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.clusterCode === "string" &&
    typeof r.summary === "string" &&
    typeof r.score === "object" &&
    r.score !== null
  );
}

/**
 * Public, unauthenticated result page — the destination behind a Share
 * button click. Looks up the row by `share_token` with the SERVICE ROLE
 * client (RLS is scoped to the owner, not a stranger with a link) and hand-
 * picks exactly three fields onto the page: name, locale, report. Nothing
 * else on the `assessments` row (email, raw answers, user_id, ip/user-agent)
 * ever reaches this response — see app/api/assessments/share/route.ts for
 * what gets written to that row in the first place.
 */
export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // share_token is a UUID; anything else can't match a row.
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return <SharedResultNotFound />;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("assessments")
    .select("respondent_name, locale, client_result")
    .eq("share_token", token)
    .limit(1)
    .maybeSingle();

  if (!data || !isReportShaped(data.client_result)) {
    return <SharedResultNotFound locale={(data?.locale as Locale) ?? "en"} />;
  }

  return (
    <SharedResultScreen
      name={typeof data.respondent_name === "string" ? data.respondent_name : null}
      locale={(data.locale as Locale) ?? "en"}
      report={data.client_result}
    />
  );
}
