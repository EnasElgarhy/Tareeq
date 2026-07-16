import type { ReactNode } from "react";
import { AppShell } from "@/components/home/AppShell";
import { DashboardAccessGate } from "@/components/home/DashboardAccessGate";
import { LanguageGate } from "@/components/i18n/LanguageGate";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { KaiChatProvider } from "@/components/kai/chat/KaiChatProvider";

/**
 * Layout for the post-result app surface (Home / Explore / Kai / You) —
 * the bottom-tab-bar replacement for /profile's pill tabs. Same
 * LocaleProvider/LanguageGate wrapping as (assessment)/layout.tsx (this
 * is a sibling route group, so it doesn't inherit that one); AppShell
 * replaces AssessmentChrome as the chrome.
 */
export default function AppGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <LocaleProvider>
      <LanguageGate>
        <DashboardAccessGate>
          <KaiChatProvider>
            <AppShell>{children}</AppShell>
          </KaiChatProvider>
        </DashboardAccessGate>
      </LanguageGate>
    </LocaleProvider>
  );
}
