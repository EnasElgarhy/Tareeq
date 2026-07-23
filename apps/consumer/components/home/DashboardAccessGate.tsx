"use client";

import { ArrowRight, Compass, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { OtpSignIn } from "@/components/auth/OtpSignIn";
import { APP_ACCENT } from "@/components/home/app-accent";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { signOut } from "@/lib/auth/otp";
import { readProfileSnapshot } from "@/lib/profile/journey";
import {
  restoreProfileFromAssessment,
  type SavedAssessmentRecord,
} from "@/lib/profile/restore-profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccessState =
  | "checking"
  | "allowed"
  | "signed-out"
  | "no-result"
  | "error";

export function DashboardAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const [state, setState] = useState<AccessState>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (pathname === "/home-preview") return;

    let active = true;

    async function checkAccess() {
      setState("checking");

      if (readProfileSnapshot().hasAnyResult) {
        if (active) setState("allowed");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        setState("signed-out");
        return;
      }
      if (authError) {
        setState("error");
        return;
      }

      const [profileResponse, assessmentResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("assessments")
          .select(
            "id, answers, result, version_id, completed_at, started_at, locale, respondent_name, respondent_email",
          )
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!active) return;
      if (assessmentResponse.error) {
        setState("error");
        return;
      }
      if (!assessmentResponse.data) {
        setState("no-result");
        return;
      }

      const metadataName =
        typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : "";
      const profileName =
        typeof profileResponse.data?.display_name === "string"
          ? profileResponse.data.display_name
          : "";
      const snapshot = restoreProfileFromAssessment({
        assessment: assessmentResponse.data as SavedAssessmentRecord,
        displayName: profileName || metadataName,
        email: user.email ?? "",
        locale,
      });

      setState(snapshot?.hasAnyResult ? "allowed" : "error");
    }

    void checkAccess();
    return () => {
      active = false;
    };
  }, [attempt, locale, pathname]);

  if (pathname === "/home-preview" || state === "allowed") {
    return <>{children}</>;
  }

  const retry = () => setAttempt((value) => value + 1);

  return (
    <main
      className="surface-day relative grid min-h-dvh w-full place-items-center overflow-x-clip px-5 py-10 text-[color:var(--day-ink)]"
      style={
        {
          "--app-accent": APP_ACCENT,
          "--app-ink": APP_ACCENT,
        } as CSSProperties
      }
    >
      <div
        className="absolute inset-0 bg-day-wash opacity-55"
        aria-hidden="true"
      />
      <div className="daybreak-grain" aria-hidden="true" />

      {state === "checking" ? (
        <div
          className="relative z-10 grid justify-items-center gap-4 text-center"
          role="status"
        >
          <span className="daybreak-icon-tile size-14 animate-pulse">
            <Compass size={24} />
          </span>
          <p className="daybreak-heading text-[20px] text-[color:var(--day-ink)]">
            {t("dashboard.access.checking")}
          </p>
        </div>
      ) : null}

      {state === "signed-out" ? (
        <section className="relative z-10 grid w-full max-w-[900px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <span className="daybreak-icon-tile size-14">
              <Compass size={24} />
            </span>
            <h1 className="daybreak-heading mt-5 max-w-[16ch] text-[34px] leading-[1.05] text-[color:var(--day-ink)] lg:text-[44px]">
              {t("dashboard.access.title")}
            </h1>
            <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-[color:var(--day-ink-2)] lg:text-[16px]">
              {t("dashboard.access.body")}
            </p>
            <Link
              href="/start"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#221248] px-6 text-[14px] font-bold text-[#FFFCF6] shadow-[0_12px_24px_rgba(34,18,72,0.2)] transition hover:bg-[#34205F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8] focus-visible:ring-offset-2"
            >
              {t("dashboard.access.start")}
              <ArrowRight className="rtl:rotate-180" size={18} />
            </Link>
          </div>

          <div className="min-w-0">
            <p className="daybreak-eyebrow">
              {t("dashboard.access.returning_label")}
            </p>
            <h2 className="daybreak-heading mt-2 text-[24px] leading-tight text-[color:var(--day-ink)]">
              {t("dashboard.access.returning_title")}
            </h2>
            <p className="mb-4 mt-1 text-[13px] leading-relaxed text-[color:var(--day-ink-2)]">
              {t("dashboard.access.returning_body")}
            </p>
            <OtpSignIn onSignedIn={retry} variant="daybreak" />
          </div>
        </section>
      ) : null}

      {state === "no-result" ? (
        <section className="relative z-10 grid w-full max-w-[560px] justify-items-center text-center">
          <span className="daybreak-icon-tile size-14">
            <Compass size={24} />
          </span>
          <h1 className="daybreak-heading mt-5 text-[32px] leading-tight text-[color:var(--day-ink)]">
            {t("dashboard.access.no_result_title")}
          </h1>
          <p className="mt-2 max-w-[48ch] text-[14px] leading-relaxed text-[color:var(--day-ink-2)]">
            {t("dashboard.access.no_result_body")}
          </p>
          <Link
            href="/start"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#221248] px-6 text-[14px] font-bold text-[#FFFCF6] shadow-[0_12px_24px_rgba(34,18,72,0.2)] transition hover:bg-[#34205F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8] focus-visible:ring-offset-2"
          >
            {t("dashboard.access.start")}
            <ArrowRight className="rtl:rotate-180" size={18} />
          </Link>
          <button
            type="button"
            onClick={() => {
              void signOut().then(retry);
            }}
            className="mt-3 min-h-10 px-4 text-[13px] font-bold text-[color:var(--day-ink-2)] transition hover:text-[color:var(--day-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8]"
          >
            {t("dashboard.access.different_account")}
          </button>
        </section>
      ) : null}

      {state === "error" ? (
        <section className="relative z-10 grid w-full max-w-[520px] justify-items-center text-center">
          <span className="daybreak-icon-tile size-14">
            <RefreshCw size={23} />
          </span>
          <h1 className="daybreak-heading mt-5 text-[30px] leading-tight text-[color:var(--day-ink)]">
            {t("dashboard.access.error_title")}
          </h1>
          <p className="mt-2 max-w-[44ch] text-[14px] leading-relaxed text-[color:var(--day-ink-2)]">
            {t("dashboard.access.error_body")}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#221248] px-6 text-[14px] font-bold text-[#FFFCF6] shadow-[0_12px_24px_rgba(34,18,72,0.2)] transition hover:bg-[#34205F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8] focus-visible:ring-offset-2"
          >
            <RefreshCw size={17} />
            {t("dashboard.access.retry")}
          </button>
        </section>
      ) : null}
    </main>
  );
}
