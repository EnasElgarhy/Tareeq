import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LocalizedPageTitle } from "@/components/marketing/LocalizedPageTitle";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <LocalizedPageTitle />
      <MarketingShell>{children}</MarketingShell>
    </LocaleProvider>
  );
}
