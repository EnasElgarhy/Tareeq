"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  getStoredLocale,
  isRtl,
  type Locale,
  storeLocale,
} from "@/lib/i18n/locale";
import { type StringKey, translate } from "@/lib/i18n/strings";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  /** True until the stored locale has been read on the client. */
  ready: boolean;
  /** Whether the user has explicitly picked a language (vs. default). */
  chosen: boolean;
  t: (key: StringKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  /** Force a specific locale instead of reading the visitor's stored
   *  preference — for standalone pages (e.g. a public /share/[token] link)
   *  whose content was generated in a fixed locale, where the chrome must
   *  match that locale rather than whatever the visitor happens to prefer. */
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);
  const [ready, setReady] = useState(Boolean(initialLocale));
  const [chosen, setChosen] = useState(Boolean(initialLocale));

  // Hydrate from storage on mount (avoids SSR mismatch) — skipped entirely
  // when a locale is forced, so the visitor's own unrelated stored
  // preference never overrides it.
  useEffect(() => {
    if (initialLocale) return;
    const stored = getStoredLocale();
    if (stored) {
      setLocaleState(stored);
      setChosen(true);
    }
    setReady(true);
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setChosen(true);
    storeLocale(next);
  }, []);

  const dir = isRtl(locale) ? "rtl" : "ltr";

  // Reflect dir/lang on <html> so global RTL rules + native controls follow.
  // Reset to LTR/en when the provider unmounts (leaving the assessment).
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("dir", dir);
    el.setAttribute("lang", locale);
    el.classList.toggle("locale-ar", locale === "ar");
    return () => {
      el.setAttribute("dir", "ltr");
      el.setAttribute("lang", "en");
      el.classList.remove("locale-ar");
    };
  }, [dir, locale]);

  const t = useCallback((key: StringKey) => translate(locale, key), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, dir, ready, chosen, t }),
    [locale, setLocale, dir, ready, chosen, t],
  );

  return (
    <LocaleContext.Provider value={value}>
      <div dir={dir} className={locale === "ar" ? "font-arabic" : undefined}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
