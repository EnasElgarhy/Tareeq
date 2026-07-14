"use client";

import { type CSSProperties, type ReactNode } from "react";
import { APP_ACCENT } from "@/components/home/app-accent";
import { AppSidebarNav } from "@/components/home/AppSidebarNav";
import { AppTabBar } from "@/components/home/AppTabBar";

/**
 * AppShell — the chrome for the post-result app surface.
 *
 * The warm "day" surface — background, grain, decorative blooms — always
 * fills the full viewport (`<main>`), so there's never a hard edge onto
 * the dark `--night` body behind it. An inner wrapper caps and centers
 * the actual content within that surface: phone/tablet get a phone-framed
 * column with the bottom tab bar pinned beneath it; desktop (`lg:`) opens
 * into a sidebar rail + centered content column instead of stretching
 * edge to edge. The app accent is the brand purple for every user
 * (threaded via `--app-accent` / `--app-ink`).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="surface-day relative flex h-dvh w-full flex-col overflow-hidden text-[color:var(--day-ink)] lg:flex-row"
      style={
        {
          "--app-accent": APP_ACCENT,
          "--app-ink": APP_ACCENT,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 bg-day-wash opacity-70 pointer-events-none" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[480px] flex-1 flex-col px-5 pt-[max(env(safe-area-inset-top),0.875rem)] md:max-w-[640px] lg:max-w-[1360px] lg:flex-row lg:gap-2 lg:px-8 lg:pt-8">
        <AppSidebarNav />

        {/* Scrollable content well — chrome locks to the viewport; the feed
         *  overflows and scrolls inside here so the tab bar stays put. On
         *  desktop this centers within the space beside the sidebar instead
         *  of stretching full-bleed. */}
        <div className="flex flex-1 flex-col min-h-0 -mx-5 overflow-y-auto overscroll-contain px-5 pb-2 pt-1 lg:mx-auto lg:w-full lg:max-w-[880px] lg:px-0">
          {children}
        </div>

        <AppTabBar />
      </div>
    </main>
  );
}
