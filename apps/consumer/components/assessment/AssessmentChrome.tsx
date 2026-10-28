"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ScreenIllustration } from "@/components/assessment/ScreenIllustration";
import { TareeqArrowLeft } from "@/components/brand/icons";
import { CompassProgress } from "@/components/brand/CompassProgress";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { uiSounds } from "@/lib/audio/ui-sounds";
import { getQuestionPath } from "@/lib/assessment/questions";
import {
  buildCompassSnapshot,
  PILLAR_META,
  type CompassSnapshot,
} from "@/lib/assessment/pillar-progress";
import { useAnimatedSnapshot } from "@/lib/assessment/use-animated-snapshot";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Question } from "@/lib/scoring";
import "./assessment-theme.css";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/primitives/BrandMark";

interface AssessmentChromeProps {
  children: ReactNode;
  questions: Question[];
}

function getIndexFromPathname(pathname: string) {
  const match = /^\/q\/(\d+)$/.exec(pathname);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * AssessmentChrome v2 — night surface for the entire flow.
 *
 * Header layout:
 *   /start, /intro, /contract   →  [back]                [tareeq mark]
 *   /q/[index]                  →  [back] [readable compass panel]
 */
export function AssessmentChrome({
  children,
  questions,
}: AssessmentChromeProps) {
  const totalQuestions = questions.length;
  const pathname = usePathname();
  const { dir } = useLocale();
  const router = useRouter();
  const questionIndex = getIndexFromPathname(pathname);
  const hasQuestion = questionIndex !== null;
  // Ceremonial screens — Meet Kai and the Contract — get a larger,
  // centered Tareeq mark.
  const isCeremony = pathname === "/intro" || pathname === "/contract";
  // Hero screens (ceremony + /start) get a genuine two-column desktop
  // layout (illustration + copy), which needs real width to breathe —
  // question/register screens stay Duolingo-narrow.
  const isHero = isCeremony || pathname === "/start";
  // Results is a long-form report, not a form or a lesson — it just
  // needs more reading width than the 640px form-screen bucket without
  // going as wide as the hero/question layouts.
  const isResults =
    pathname === "/results" || pathname === "/deep-dive-preview";
  // Registration uses the same wider desktop canvas for its Kai/form split.
  const isRegistration = pathname === "/register";
  // The Kai conversation is a deliberate light "you've landed" surface —
  // the rest of the flow (assessment + Results) stays on the dark night
  // theme. (/profile used to be a second light surface here; it now
  // redirects to /you, outside this chrome entirely.)
  const isLightSurface = pathname === "/kai-chat";
  // The deep-space night surface on every assessment screen; the report and the light Kai chat keep their own.
  const isNightSky = !isLightSurface && !isResults;

  function goBack() {
    uiSounds.back();
    if (pathname === "/contract") {
      router.push("/intro");
      return;
    }
    if (pathname === "/intro") {
      router.push("/start");
      return;
    }
    if (pathname === "/kai-chat") {
      router.push("/profile?tab=kai");
      return;
    }
    if (pathname === "/results") {
      // "/" unconditionally redirects to "/intro" (the first-time-visitor
      // ceremony) — fine for a fresh visitor landing on the root, but wrong
      // here: a user backing out of a completed report should land on their
      // dashboard, not restart the Meet Kai intro.
      router.push("/home");
      return;
    }
    if (!hasQuestion) {
      router.push("/");
      return;
    }
    router.push(
      questionIndex > 0 ? getQuestionPath(questionIndex - 1) : "/contract",
    );
  }

  // Always build a snapshot so the animation hook has stable inputs.
  // When no question is active we feed an empty snapshot — the compass
  // simply isn't rendered, but the hook keeps a consistent call site.
  const rawSnapshot = buildCompassSnapshot({
    questions,
    completedCount: hasQuestion ? questionIndex : 0,
    activeIndex: hasQuestion ? questionIndex : null,
  });
  const snapshot = useAnimatedSnapshot(rawSnapshot);

  return (
    <main
      className={`relative flex h-dvh w-full flex-col overflow-hidden ${
        isLightSurface ? "surface-sand text-carbon" : "surface-night text-sand"
      } ${isNightSky ? "assessment-night" : ""}`}
    >
      {isLightSurface ? null : (
        <div className="absolute inset-0 bg-night-stars opacity-80 pointer-events-none" />
      )}
      {isNightSky ? (
        // Per-screen side art (desktop), independent of the background.
        <ScreenIllustration pathname={pathname} isRtl={dir === "rtl"} />
      ) : null}

      <div
        className={`relative z-10 mx-auto flex h-full w-full max-w-[480px] flex-1 flex-col px-5 ${
          isHero
            ? "md:max-w-[560px] lg:max-w-[960px]"
            : hasQuestion
              ? "md:max-w-[560px] lg:max-w-[1040px]"
              : isResults
                ? "md:max-w-[840px] lg:max-w-[1180px] xl:max-w-[1240px]"
                : isRegistration
                  ? "md:max-w-[560px] lg:max-w-[960px]"
                  : "md:max-w-[560px] lg:max-w-[640px]"
        } ${
          hasQuestion
            ? "gap-2 pb-3 pt-[max(env(safe-area-inset-top),0.625rem)]"
            : "gap-3 pb-4 pt-[max(env(safe-area-inset-top),0.875rem)]"
        }`}
      >
        {/* Header
         *
         * Two layouts:
         *  · question screens (/q/*) — back-button left, readable compass panel
         *  · everywhere else        — back-button + counter left, Tareeq mark right
         *                              (mark goes centered + larger on ceremony screens)
         */}
        <header
          className={
            hasQuestion
              ? "relative z-10 grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2 lg:mx-auto lg:w-full lg:max-w-[900px]"
              : "relative z-10 flex h-10 items-center justify-between gap-2"
          }
        >
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className={`shrink-0 ${
              isLightSurface
                ? "inline-flex size-10 items-center justify-center rounded-full border border-carbon/10 bg-carbon/[0.04] text-carbon transition hover:bg-carbon/[0.08] active:scale-95"
                : "assessment-icon-button size-10"
            }`}
          >
            <TareeqArrowLeft size={15} className="flip-rtl" />
          </button>

          {hasQuestion ? (
            <QuestionCompassPanel
              snapshot={snapshot}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
            />
          ) : (
            <div
              className={
                isCeremony
                  ? "absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
                  : "inline-flex items-center gap-2"
              }
            >
              {/* Tareeq mark — centered + larger on ceremony screens, right on others */}
              <Link
                href="/"
                aria-label={`${BRAND.name} home`}
                className="inline-flex items-center gap-1.5"
              >
                <BrandMark tone={isLightSurface ? "flat" : "aurora"} height={isCeremony ? 26 : 20} />
                <span
                  dir="ltr"
                  lang="en"
                  className={`font-heading font-bold leading-none tracking-[-0.025em] ${
                    isLightSurface ? "text-carbon" : "text-sand"
                  } ${isCeremony ? "text-[20px]" : "text-[16px]"}`}
                >
                  {BRAND.name}
                </span>
              </Link>

              {/* Profile chip — only visible when the user has registered.
               *  Hidden on /profile itself (no point linking to current). */}
              <ProfileChip pathname={pathname} />
            </div>
          )}
        </header>

        {/* Scrollable content well — the chrome locks to the viewport, but
         *  inner content can overflow vertically on short phones (iPhone SE,
         *  landscape, etc.) and scroll. `overscroll-contain` keeps the rubber
         *  band inside the well so the body never bounces. */}
        <div className="flex flex-1 flex-col min-h-0 -mx-5 overflow-y-auto overscroll-contain px-5 pb-1">
          {children}
        </div>
      </div>
    </main>
  );
}

interface QuestionCompassPanelProps {
  snapshot: CompassSnapshot;
  questionIndex: number;
  totalQuestions: number;
}

function QuestionCompassPanel({
  snapshot,
  questionIndex,
  totalQuestions,
}: QuestionCompassPanelProps) {
  const { t } = useLocale();
  const activeMeta = snapshot.activePillar
    ? PILLAR_META[snapshot.activePillar]
    : null;

  return (
    <section
      className="assessment-progress-panel min-w-0 px-2.5 py-1.5"
      aria-label="CORE compass progress"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-sand/10 bg-night/45">
          <CompassProgress
            snapshot={snapshot}
            size={42}
            layout="bare"
            surface="dark"
          />
        </div>

        <div className="min-w-0 flex-1 pr-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase text-sand/48">
                {t("chrome.compass_label")}
              </p>
              <p className="daybreak-heading truncate text-[14px] leading-tight text-sand">
                {activeMeta ? activeMeta.name : t("chrome.about_you")}
              </p>
            </div>
            <p
              dir="ltr"
              className="shrink-0 rounded-full border border-sand/10 bg-night/25 px-2 py-1 text-[10px] font-semibold tabular-nums text-sand/64"
            >
              {String(questionIndex + 1).padStart(2, "0")} / {totalQuestions}
            </p>
          </div>
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-sand/12">
            <span
              className="block h-full rounded-full bg-grad-warm"
              style={{ width: `${Math.round(snapshot.overall * 100)}%` }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * ProfileChip — a small avatar in the chrome's right slot, shown only while
 * there is a real signed-in session (not merely a locally saved
 * registration, which would read as "signed in" to a signed-out user).
 * Click → /you. Hidden on /you itself (no self-link).
 */
function ProfileChip({ pathname }: { pathname: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active || !session) return;
        const metadataName = session.user.user_metadata?.display_name;
        const displayName =
          readRegistrationName() ??
          (typeof metadataName === "string" && metadataName.trim()
            ? metadataName
            : (session.user.email ?? null));
        setName(displayName);
      })
      .catch(() => {
        // No session available — the chip simply stays hidden.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!name || pathname === "/you") return null;
  const initials = getProfileInitials(name);

  return (
    <Link
      href="/you"
      aria-label="Your profile"
      className="glass-tile inline-flex size-7 items-center justify-center rounded-full text-[10px] font-black text-sand transition hover:text-sand active:scale-95"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,107,61,0.3), rgba(157,127,240,0.2))",
        boxShadow: "inset 0 0 0 1px rgba(245,238,230,0.18)",
      }}
    >
      {initials}
    </Link>
  );
}

function readRegistrationName(): string | null {
  try {
    const raw = window.localStorage.getItem("tareeq.result.registration.v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: unknown };
    return typeof parsed?.name === "string" && parsed.name.trim()
      ? parsed.name
      : null;
  } catch {
    return null;
  }
}

function getProfileInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? "?";
  return (
    (parts[0]?.charAt(0) ?? "") + (parts[parts.length - 1]?.charAt(0) ?? "")
  ).toUpperCase();
}
