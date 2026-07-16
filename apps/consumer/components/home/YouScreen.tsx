"use client";

import { Headphones, Sparkles, TrendingUp, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { OtpSignIn } from "@/components/auth/OtpSignIn";
import { CareerCompassIcon } from "@/components/brand/DomainIcons";
import { SettingsPanel } from "@/components/assessment/SettingsPanel";
import { JourneyModuleCard } from "@/components/assessment/JourneyModuleCard";
import { NoCompassEmptyState } from "@/components/home/NoCompassEmptyState";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { signOut } from "@/lib/auth/otp";
import { useKaiProfile } from "@/lib/kai/useKaiProfile";
import { getModuleNameKey, readProfileSnapshot, type ProfileSnapshot } from "@/lib/profile/journey";

const MODULE_ICONS: Record<string, ReactNode> = {
  compass: <CareerCompassIcon size={22} />,
  interview: <Headphones size={20} />,
  skills: <Wrench size={20} />,
  pulse: <TrendingUp size={20} />,
};

/**
 * You — the journey (modules + progress) and account settings. Skips
 * repeating Home's achievements to avoid the same content twice across
 * tabs. Journey works from the local snapshot like Home/Explore;
 * Settings needs a real account, so it degrades to a sign-in prompt
 * rather than gating the whole tab behind auth.
 */
export function YouScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const { authState, displayName, email, reload } = useKaiProfile();
  // useKaiProfile()'s own `snapshot` only populates once signed in (it's
  // built for the auth-gated Kai chat) — Journey needs the same
  // local-first read Home/Explore use, independent of auth state.
  const [localSnapshot, setLocalSnapshot] = useState<ProfileSnapshot | null>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocalSnapshot(readProfileSnapshot());
    setReady(true);
  }, []);

  // Journey is local-first and shouldn't wait on the Supabase round-trip
  // that authState depends on — only the Account section below does.
  if (!ready) return null;

  async function handleSignOut() {
    await signOut();
    await reload();
  }

  return (
    <section className="daybreak-reveal flex flex-1 flex-col gap-5 pb-6">
      <header className="pt-1 lg:pt-2">
        <h1 className="daybreak-heading text-[30px] leading-tight text-[color:var(--day-ink)] lg:text-[38px]">
          {t("home.you.title")}
        </h1>
        <p className="mt-1 max-w-[58ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)] lg:text-[15px]">
          {t("home.you.subtitle")}
        </p>
      </header>

      {localSnapshot?.coreReport ? (
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-2 md:gap-3">
            {localSnapshot.modules.map((mod) => (
              <JourneyModuleCard
                key={mod.id}
                id={mod.id}
                icon={MODULE_ICONS[mod.icon] ?? <Sparkles size={20} />}
                name={t(getModuleNameKey(mod.id))}
                status={mod.status}
              />
            ))}
          </div>
        </div>
      ) : (
        <NoCompassEmptyState
          title={t("home.you.empty_title")}
          description={t("home.you.empty_description")}
        />
      )}

      <div className="grid gap-2.5">
        <p className="daybreak-eyebrow ps-0.5">
          {t("home.you.account_label")}
        </p>
        {authState === "loading" ? (
          <div className="rounded-story h-[140px] animate-pulse border border-[color:var(--day-line)] bg-[color:var(--day-inset)]" />
        ) : authState === "signed-in" ? (
          <SettingsPanel
            displayName={displayName}
            email={email}
            onViewMemory={() => router.push("/kai")}
            onSignOut={handleSignOut}
          />
        ) : (
          <div className="py-1">
            <p className="daybreak-heading text-[18px] leading-tight text-[color:var(--day-ink)]">
              {t("home.you.signin_title")}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--day-ink-2)]">
              {t("home.you.signin_body")}
            </p>
            {/* Capped + centered at desktop — an email input and CTA
             *  button don't need to stretch across a wide card; a
             *  human-scaled form reads as an intentional desktop form
             *  instead of a mobile button just stretched wider. */}
            <div className="mt-3 lg:mx-auto lg:max-w-[420px]">
              <OtpSignIn onSignedIn={() => void reload()} variant="daybreak" />
              <p className="mt-3 text-center text-[11px] leading-snug text-[color:var(--day-ink-3)]">
                {t("home.you.new_here_prefix")}
                <Link href="/start" className="font-semibold text-[color:var(--day-ink)] underline">
                  {t("home.you.new_here_link")}
                </Link>
                {t("home.you.new_here_suffix")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
