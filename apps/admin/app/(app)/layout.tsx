import type { ReactNode } from "react";
import { AppShell } from "@/components/home/AppShell";

/**
 * Layout for the post-result app surface (Overview / Explore / Kai / You).
 * Wraps every tab in the phone-framed AppShell with the bottom tab bar.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
