"use client";

import { type CSSProperties, type ReactNode } from "react";
import { APP_ACCENT } from "@/components/home/app-accent";
import { AppTopNav } from "@/components/home/AppTopNav";
import { AppTabBar } from "@/components/home/AppTabBar";

/**
 * AppShell — the chrome for the post-result app surface.
 *
 * The warm "day" surface — background, grain, decorative blooms — always
 * fills the full viewport (`<main>`), so there's never a hard edge onto
 * the dark `--night` body behind it. An inner wrapper caps and centers
 * the actual content within that surface: phone/tablet get a phone-framed
 * column with the bottom tab bar pinned beneath it; desktop (`lg:`) gets a
 * normal top navigation bar over a centered content column. The app accent is the brand purple for every user
 * (threaded via `--app-accent` / `--app-ink`).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="surface-day relative flex h-dvh w-full flex-col overflow-x-clip overflow-y-hidden text-[color:var(--day-ink)]"
      style={
        {
          "--app-accent": APP_ACCENT,
          "--app-ink": APP_ACCENT,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 bg-day-wash opacity-55 pointer-events-none" />
      <div className="daybreak-grain" aria-hidden="true" />

      <div className="relative z-10 hidden lg:block">
        <AppTopNav />
      </div>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[520px] flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),0.875rem)] md:max-w-[760px] md:px-6 lg:max-w-[1240px] lg:px-8 lg:pt-0">
        {/* Scrollable content well — chrome locks to the viewport; the feed
         *  overflows and scrolls inside here so the tab bar stays put. On
         *  desktop it sits under the top navigation, capped and centered. */}
        <div className="flex min-h-0 flex-1 flex-col -mx-4 overflow-y-auto overscroll-contain px-4 pb-3 pt-1 md:-mx-6 md:px-6 lg:mx-0 lg:w-full lg:max-w-none lg:px-0 lg:pb-10 lg:pt-8">
          {children}
        </div>

        <AppTabBar />
      </div>
    </main>
  );
}
