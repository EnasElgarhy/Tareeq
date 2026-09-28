import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <MarketingShell>{children}</MarketingShell>
    </LocaleProvider>
  );
}
