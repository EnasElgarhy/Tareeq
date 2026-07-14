"use client";

import { Headphones, Sparkles, TrendingUp, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { OtpSignIn } from "@/components/auth/OtpSignIn";
import { CareerCompassIcon } from "@/components/brand/DomainIcons";
import { SettingsPanel } from "@/components/assessment/SettingsPanel";
import { JourneyModuleCard } from "@/components/assessment/JourneyModuleCard";
import { JourneyPath } from "@/components/kai/JourneyPath";
import { NoCompassEmptyState } from "@/components/home/NoCompassEmptyState";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { signOut } from "@/lib/auth/otp";
import { useKaiProfile } from "@/lib/kai/useKaiProfile";
import { deriveMinutesRemaining } from "@/lib/profile/activity";
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

  const minutesRemaining = localSnapshot ? deriveMinutesRemaining(localSnapshot) : 0;

  return (
    <section className="flex flex-1 flex-col gap-4 pb-4">
      <header className="pt-1 lg:pt-2">
        <h1 className="text-[26px] font-black leading-tight text-[color:var(--day-ink)] lg:text-[34px]">
          {t("home.you.title")}
        </h1>
        <p className="mt-0.5 text-[13px] text-[color:var(--day-ink-2)] lg:mt-1.5 lg:text-[15px]">
          {t("home.you.subtitle")}
        </p>
      </header>

      {localSnapshot?.coreReport ? (
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
                {t("profile.journey.eyebrow")}
              </p>
              <h2 className="mt-1 text-[16px] font-black text-[color:var(--day-ink)]">
                {t("home.you.stages_complete")
                  .replace("{completed}", String(localSnapshot.completedCount))
                  .replace("{total}", String(localSnapshot.totalCount))}
              </h2>
            </div>
            {minutesRemaining > 0 ? (
              <span className="shrink-0 rounded-full border border-[color:var(--day-line)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--day-ink-3)]">
                {t("profile.journey.minutes_left").replace("{n}", String(minutesRemaining))}
              </span>
            ) : null}
          </div>

          <JourneyPath modules={localSnapshot.modules} />

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

      <div className="grid gap-2">
        <p className="ps-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
          {t("home.you.account_label")}
        </p>
        {authState === "loading" ? (
          <div className="h-[140px] animate-pulse rounded-[20px] border border-[color:var(--day-line)] bg-[color:var(--day-inset)]" />
        ) : authState === "signed-in" ? (
          <SettingsPanel
            displayName={displayName}
            email={email}
            onViewMemory={() => router.push("/kai")}
            onSignOut={handleSignOut}
          />
        ) : (
          <div className="rounded-[20px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-3.5 shadow-[var(--day-shadow-card)]">
            <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink)]">
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
              <OtpSignIn onSignedIn={() => void reload()} />
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
