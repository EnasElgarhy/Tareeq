"use client";

import type { ReactNode } from "react";
import { LanguageChooser } from "@/components/i18n/LanguageChooser";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * Shows the language chooser as the first screen until the user picks a
 * language; afterwards renders the normal assessment flow.
 */
export function LanguageGate({ children }: { children: ReactNode }) {
  const { ready, chosen } = useLocale();

  // Pre-hydration: render a night surface to avoid a flash before we know
  // whether a language was already chosen.
  if (!ready) return <div className="min-h-dvh bg-night" />;
  if (!chosen) return <LanguageChooser />;

  return <>{children}</>;
}
