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
    const title = arabic?.title ?? english.title;
    const descriptionText = arabic?.description ?? english.description;

    const apply = () => {
      if (document.title !== title) document.title = title;
      const description = document.querySelector('meta[name="description"]');
      if (description && description.getAttribute("content") !== descriptionText) {
        description.setAttribute("content", descriptionText);
      }
    };
    apply();
    // Next.js streams the page metadata and React rewrites its <title> (which
    // can sit in <body>) after this effect has run, putting the English title
    // back. Watch that element and re-apply; apply() only writes on a change.
    const titleElement = document.querySelector("title");
    const observer = new MutationObserver(apply);
    observer.observe(titleElement ?? document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  return null;
}
