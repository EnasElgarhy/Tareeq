import type { Metadata } from "next";
import { ProfileScreen } from "@/components/assessment/ProfileScreen";

export const metadata: Metadata = {
  title: "Your profile · Tareeq",
  description:
    "Your AI career profile, your completed assessments, and the next modules waiting to unlock as your path widens.",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
