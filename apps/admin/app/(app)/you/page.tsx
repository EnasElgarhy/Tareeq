"use client";

import { UserRound } from "lucide-react";
import { TabPlaceholder } from "@/components/home/TabPlaceholder";

/** You tab — journey, saved items, settings (placeholder until built). */
export default function YouPage() {
  return (
    <TabPlaceholder
      icon={UserRound}
      eyebrow="You"
      title="Your journey, saved"
      description="Everything you've completed and unlocked: your assessments, saved careers and majors, future modules, and your account settings."
      preview={["Assessments", "Saved", "Modules", "Settings"]}
    />
  );
}
