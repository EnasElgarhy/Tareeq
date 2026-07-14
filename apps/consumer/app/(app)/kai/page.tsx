import type { Metadata } from "next";
import { KaiChatScreen } from "@/components/kai/chat/KaiChatScreen";

export const metadata: Metadata = {
  title: "Talk with Kai · Tareeq",
  description: "A conversation with Kai, your personal AI career coach.",
};

/** The Kai tab — the real chat experience, ported from /kai-chat onto
 * the warm-paper day theme (see components/kai/chat/*.tsx). */
export default function KaiPage() {
  return <KaiChatScreen />;
}
