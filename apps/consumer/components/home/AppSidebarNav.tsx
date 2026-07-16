"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TareeqCompass } from "@/components/brand/icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NAV_ITEMS, isNavItemActive } from "@/components/home/nav-items";

/**
 * The desktop counterpart to `AppTabBar` — a persistent left rail shown at
 * `lg:` and up, replacing the bottom tab bar once there's enough width for
 * icon+label rows to read comfortably (Duolingo's desktop pattern). Shares
 * `NAV_ITEMS` with the tab bar so the two never drift.
 */
export function AppSidebarNav() {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("home.tab.nav_label")}
      className="rounded-story hidden h-fit shrink-0 flex-col gap-1 bg-[#100A24] p-3 text-[#F5EEE6] shadow-[0_22px_48px_rgba(8,5,26,0.18)] lg:sticky lg:top-0 lg:flex lg:w-[224px]"
    >
      <div className="mb-5 flex items-center gap-2.5 px-3 py-2 text-[#F5EEE6]">
        <span className="grid size-8 place-items-center rounded-full bg-[#F4C660] text-[#100A24]">
          <TareeqCompass size={19} />
        </span>
        <span className="font-heading text-[17px] font-bold">Tareeq</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
            style={{
              color: isActive ? "#100A24" : "rgba(245,238,230,0.72)",
              ...(isActive
                ? {
                    background: "#F4C660",
                    boxShadow: "0 8px 22px rgba(244,198,96,0.18)",
                  }
                : {}),
            }}
          >
            <span className="grid size-8 shrink-0 place-items-center">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
            </span>
            <span className="text-[13.5px] font-bold">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
