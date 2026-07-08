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
      className="hidden shrink-0 flex-col gap-1 border-e border-[color:var(--day-line)] py-2 pe-4 lg:flex lg:w-[220px]"
    >
      <div className="mb-6 flex items-center gap-2 px-3 text-[color:var(--day-ink)]">
        <TareeqCompass size={22} />
        <span className="text-[15px] font-black tracking-[-0.01em]">Tareeq</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition"
            style={{
              color: isActive ? "var(--app-ink, #6B4D00)" : "var(--day-ink-3, #675D4E)",
              ...(isActive
                ? {
                    background:
                      "color-mix(in oklab, var(--app-accent, #F4C660) 14%, transparent)",
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in oklab, var(--app-accent, #F4C660) 28%, transparent)",
                  }
                : {}),
            }}
          >
            <span className="grid size-8 shrink-0 place-items-center">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
            </span>
            <span className="text-[13.5px] font-bold tracking-[-0.005em]">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
