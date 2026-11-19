import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { PAGES } from "@/lib/page-metadata";
import { Suspense } from "react";
import { KaiChatScreen } from "@/components/kai/chat/KaiChatScreen";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name}: ${PAGES.kai.title}` },
  description: PAGES.kai.description,
};

/** The Kai tab — the real chat experience, ported from /kai-chat onto
 * the warm-paper day theme (see components/kai/chat/*.tsx). */
export default function KaiPage() {
  return (
    <Suspense fallback={null}>
      <KaiChatScreen />
    </Suspense>
  );
}
