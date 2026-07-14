"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { pickGreetingKey } from "@/lib/kai/proactive/proactive-context";

/**
 * "Good evening, Ahmed." — the very first line of the Kai Landing.
 * Time-of-day is computed client-side (this whole section only ever
 * renders after the profile's client-only auth gate resolves, so there's
 * no SSR/hydration mismatch to guard against here). Shares its
 * hour-boundary logic with the proactive layer (lib/kai/proactive/) so
 * the two never drift out of sync on what counts as "morning."
 */
export function KaiGreeting({ displayName }: { displayName: string }) {
  const { t } = useLocale();
  const greetingKey = pickGreetingKey(new Date());
  const name = displayName.trim() || t("kai.panel.greeting_fallback_name");

  return (
    <p className="text-[20px] font-black leading-tight text-carbon">
      {t(greetingKey)}, {name}.
    </p>
  );
}
