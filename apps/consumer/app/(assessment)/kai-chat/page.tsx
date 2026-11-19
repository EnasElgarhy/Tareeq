import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { PAGES } from "@/lib/page-metadata";
import { KaiChatScreen } from "@/components/kai/chat/KaiChatScreen";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name}: ${PAGES.kai.title}` },
  description: PAGES.kai.description,
};

export default function KaiChatPage() {
  return <KaiChatScreen />;
}
