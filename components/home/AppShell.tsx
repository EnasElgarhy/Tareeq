"use client";

import { type CSSProperties, type ReactNode } from "react";
import { APP_ACCENT } from "@/components/home/app-accent";
import { AppTabBar } from "@/components/home/AppTabBar";

/**
 * AppShell — the chrome for the post-result app surface.
 *
 * A phone-framed warm-paper surface with a scrollable content well and the
 * bottom tab bar pinned beneath it. The app accent is the brand purple for
 * every user (threaded via `--app-accent` / `--app-ink`).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="surface-day relative mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden px-5 pt-[max(env(safe-area-inset-top),0.875rem)] text-[color:var(--day-ink)]"
      style={
        {
          "--app-accent": APP_ACCENT,
          "--app-ink": APP_ACCENT,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 bg-day-wash opacity-70 pointer-events-none" />

      {/* Scrollable content well — chrome locks to the viewport; the feed
       *  overflows and scrolls inside here so the tab bar stays put. */}
      <div className="relative z-10 flex flex-1 flex-col min-h-0 -mx-5 overflow-y-auto overscroll-contain px-5 pb-2 pt-1">
        {children}
      </div>

      <AppTabBar />
    </main>
  );
}
