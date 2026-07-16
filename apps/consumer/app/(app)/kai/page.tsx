import type { Metadata } from "next";
import { Suspense } from "react";
import { KaiChatScreen } from "@/components/kai/chat/KaiChatScreen";

export const metadata: Metadata = {
  title: "Talk with Kai · Tareeq",
  description: "A conversation with Kai, your personal AI career coach.",
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
