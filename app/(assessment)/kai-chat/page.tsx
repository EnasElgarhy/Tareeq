import type { Metadata } from "next";
import { KaiChatScreen } from "@/components/kai/chat/KaiChatScreen";

export const metadata: Metadata = {
  title: "Talk with Kai · Tareeq",
  description: "A conversation with Kai, your personal AI career coach.",
};

export default function KaiChatPage() {
  return <KaiChatScreen />;
}
