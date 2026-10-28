"use client";

import { useEffect, useState } from "react";

export interface KaiAccess {
  open: boolean;
  endsAt: string | null;
}

let cached: Promise<KaiAccess | null> | null = null;

/** Loaded once per page: /api/kai/access answers from the server's clock. */
function loadKaiAccess(): Promise<KaiAccess | null> {
  cached ??= fetch("/api/kai/access", { cache: "no-store" })
    .then(async (response) => (response.ok ? ((await response.json()) as KaiAccess) : null))
    .catch(() => null);
  return cached;
}

/**
 * The 3-month Kai window (lib/kai/kai-access.ts). `null` while loading or
 * when it cannot be read: the screen then shows nothing extra, and the chat
 * route still refuses a closed window.
 */
export function useKaiAccess(): KaiAccess | null {
  const [access, setAccess] = useState<KaiAccess | null>(null);
  useEffect(() => {
    let active = true;
    void loadKaiAccess().then((value) => {
      if (active) setAccess(value);
    });
    return () => {
      active = false;
    };
  }, []);
  return access;
}

export function formatKaiEndDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
