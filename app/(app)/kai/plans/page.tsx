import type { Metadata } from "next";
import { PlansListScreen } from "@/components/kai/plans/PlansListScreen";

export const metadata: Metadata = {
  title: "Your Plans · Tareeq",
  description: "Saved action plans from your conversations with Kai.",
};

export default function KaiPlansPage() {
  return <PlansListScreen />;
}
