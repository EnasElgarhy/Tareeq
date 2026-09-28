import type { Metadata } from "next";
import { PlanDetailScreen } from "@/components/kai/plans/PlanDetailScreen";

export const metadata: Metadata = {
  title: "Plan · Tareeq",
  description: "Track progress on a saved action plan from Kai.",
};

type PlanDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function KaiPlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  // Decode so any URL-encoded characters in an older plan id (e.g. colons
  // from a legacy ISO-timestamp id) match the stored id on lookup.
  return <PlanDetailScreen planId={decodeURIComponent(id)} />;
}
