"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { buildKaiContext } from "@/lib/kai/context";
import type { KaiContext } from "@/lib/kai/types";
import { readProfileSnapshot, type ProfileSnapshot } from "@/lib/profile/journey";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthState = "loading" | "signed-out" | "signed-in";

/**
 * The same auth-check + snapshot-read + context-build sequence
 * ProfileScreen.tsx already runs, extracted so the new chat screen can
 * load independently without touching that working component.
 */
export function useKaiProfile() {
  const { locale } = useLocale();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthState("signed-out");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const local = readProfileSnapshot();
    const metadataName =
      typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : undefined;

    setDisplayName(
      (profile?.display_name as string | null)?.trim() ||
        metadataName?.trim() ||
        local.registration?.name?.trim() ||
        (user.email ? user.email.split("@")[0] : "You"),
    );
    setEmail(user.email ?? local.registration?.email ?? "");
    setSnapshot(local);
    setAuthState("signed-in");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kaiContext: KaiContext | null =
    authState === "signed-in" && snapshot ? buildKaiContext({ displayName, locale, snapshot }) : null;

  return { authState, displayName, email, snapshot, kaiContext, locale, reload: load };
}
