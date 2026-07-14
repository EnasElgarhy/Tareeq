"use client";

import { Sparkles } from "lucide-react";
import { TabPlaceholder } from "@/components/home/TabPlaceholder";

/** Kai tab — the AI companion chat (placeholder until wired). */
export default function KaiPage() {
  return (
    <TabPlaceholder
      icon={Sparkles}
      eyebrow="Kai"
      title="Your guide, on demand"
      description="Ask anything about your path. Kai answers with your compass in mind — how someone wired like you breaks into a field, what to study, and what to try next."
      preview={["Profile-aware", "Voiced", "Always on"]}
    />
  );
}
