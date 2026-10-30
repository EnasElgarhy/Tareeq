"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ARABIC_PAGE_TEXT, englishPageText } from "@/lib/page-metadata";

/**
 * Keeps the browser tab title and description in the visitor's language.
 * The server renders English (link previews read that); switching to Arabic
 * swaps in the agreed Arabic text, and switching back restores English.
 */
export function LocalizedPageTitle() {
  const { locale } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const english = englishPageText(pathname);
    if (!english) return;
    const arabic = locale === "ar" ? ARABIC_PAGE_TEXT[pathname] : undefined;
    document.title = arabic?.title ?? english.title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", arabic?.description ?? english.description);
  }, [locale, pathname]);

  return null;
}
