import type { Metadata } from "next";
import {
  ReportViewer,
  ReportViewMessage,
} from "@/components/report-view/ReportViewer";
import { coreAnswersFromLetters } from "@/lib/core-v2/assessment";
import { scoreCore } from "@/lib/core-v2/scoring";
import type { CoreResult } from "@/lib/core-v2/types";
import type { Locale } from "@/lib/i18n/locale";
import { verifyReportView } from "@/lib/report-view/signature";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student report · Map My CORE admin",
  // A short-lived signed link: never indexed, never sent on as a referrer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

interface ReportViewPageProps {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

/** The stored answers, re-scored exactly as the persist route scored them. */
async function loadReport(
  assessmentId: string,
): Promise<{ result: CoreResult; generatedAt: string; locale: Locale } | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("assessments")
    .select("answers, completed_at, started_at, locale, result")
    .eq("id", assessmentId)
    .maybeSingle();
  if (error) {
    console.error("[report-view] assessment lookup failed", {
      assessmentId,
      error: error.message,
    });
    return null;
  }
  const scoring = (data?.result as { scoringVersion?: unknown } | null)
    ?.scoringVersion;
  if (!data || scoring !== "2.0" || !data.answers) return null;
  try {
    return {
      result: scoreCore(
        coreAnswersFromLetters(data.answers as Record<string, string>),
      ),
      generatedAt: (data.completed_at ?? data.started_at) as string,
      locale: data.locale === "ar" ? "ar" : "en",
    };
  } catch (error) {
    console.error("[report-view] stored answers could not be scored", {
      assessmentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * A student's report as they see it, opened from the admin's Responses page.
 * Only a fresh link signed by the admin opens it; there is no paywall, no Kai
 * and no account here.
 */
export default async function ReportViewPage({
  params,
  searchParams,
}: ReportViewPageProps) {
  const { assessmentId } = await params;
  const query = await searchParams;
  const exp = single(query.exp);
  const sig = single(query.sig);
  const isValid = verifyReportView({
    assessmentId,
    exp,
    sig,
    now: Math.floor(Date.now() / 1000),
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  });
  if (!isValid) return <ReportViewMessage kind="expired" />;

  const report = await loadReport(assessmentId);
  if (!report) return <ReportViewMessage kind="unavailable" />;

  const lang = single(query.lang);
  const locale: Locale = lang === "ar" || lang === "en" ? lang : report.locale;
  return (
    <ReportViewer
      result={report.result}
      generatedAt={report.generatedAt}
      locale={locale}
      linkQuery={{ exp: exp ?? "", sig: sig ?? "" }}
    />
  );
}
