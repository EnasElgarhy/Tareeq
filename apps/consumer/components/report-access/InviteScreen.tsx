"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

export type InviteOutcome =
  | { state: "claimed"; alreadyOwned: boolean }
  | { state: "signin" }
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "redeemed" }
  | { state: "notready" }
  | { state: "pay"; hasReport: boolean };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="surface-day flex min-h-dvh w-full items-center justify-center px-6">
      <div className="w-full max-w-md py-24 text-center sm:py-16">
        {children}
      </div>
    </main>
  );
}

/**
 * The destination behind an admin free-access link. All copy is bilingual;
 * states are resolved server-side so no client fetch is needed.
 */
export function InviteScreen({ outcome }: { outcome: InviteOutcome }) {
  const { t } = useLocale();

  if (outcome.state === "signin") {
    return (
      <Shell>
        <h1 className="daybreak-heading text-3xl sm:text-4xl">
          {t("invite.signin_title")}
        </h1>
        <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
          {t("invite.signin_body")}
        </p>
        <Link href="/signin" className="daybreak-primary-action mt-6 px-8">
          {t("invite.signin_cta")}
        </Link>
      </Shell>
    );
  }

  if (outcome.state === "claimed") {
    return (
      <Shell>
        <h1 className="daybreak-heading text-3xl sm:text-4xl">
          {t("invite.title")}
        </h1>
        <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
          {t("invite.subtitle")}
        </p>
        <Link href="/compass" className="daybreak-primary-action mt-6 px-8">
          {t("invite.cta")}
        </Link>
      </Shell>
    );
  }

  if (outcome.state === "redeemed") {
    return (
      <Shell>
        <h1 className="daybreak-heading text-3xl sm:text-4xl">
          {t("invite.redeemed_title")}
        </h1>
        <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
          {t("invite.redeemed_body")}
        </p>
        <Link href="/compass" className="daybreak-primary-action mt-6 px-8">
          {t("invite.cta")}
        </Link>
      </Shell>
    );
  }

  if (outcome.state === "expired") {
    return (
      <Shell>
        <h1 className="daybreak-heading text-3xl sm:text-4xl">
          {t("invite.expired_title")}
        </h1>
        <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
          {t("invite.expired_body")}
        </p>
      </Shell>
    );
  }

  if (outcome.state === "notready") {
    return (
      <Shell>
        <h1 className="daybreak-heading text-3xl sm:text-4xl">
          {t("invite.notready_title")}
        </h1>
        <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
          {t("invite.notready_body")}
        </p>
        <Link href="/home" className="daybreak-primary-action mt-6 px-8">
          {t("invite.notready_cta")}
        </Link>
      </Shell>
    );
  }

  if (outcome.state === "pay") {
    return (
      <Shell>
        <h1 className="daybreak-heading text-3xl sm:text-4xl">
          {t("invite.pay_title")}
        </h1>
        <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
          {outcome.hasReport
            ? t("invite.pay_body_report")
            : t("invite.pay_body_start")}
        </p>
        <Link
          href={outcome.hasReport ? "/compass" : "/home"}
          className="daybreak-primary-action mt-6 px-8"
        >
          {outcome.hasReport
            ? t("invite.pay_cta_report")
            : t("invite.pay_cta_start")}
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="daybreak-heading text-3xl sm:text-4xl">
        {t("invite.invalid_title")}
      </h1>
      <p className="mt-3 text-[15px] text-[color:var(--day-ink-2)]">
        {t("invite.invalid_body")}
      </p>
    </Shell>
  );
}
