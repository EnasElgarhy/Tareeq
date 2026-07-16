"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NAV_ITEMS, isNavItemActive } from "@/components/home/nav-items";

/**
 * The app's bottom tab bar — the spine of the post-result experience on
 * phone/tablet. Sits pinned to the bottom of the shell. The active tab wears
 * the user's cluster accent (threaded via `--app-accent`) for ownership.
 * Hidden at `lg:` in favor of `AppSidebarNav`.
 */
export function AppTabBar() {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("home.tab.nav_label")}
      className="relative z-20 mb-[max(env(safe-area-inset-bottom),0.5rem)] mt-2 rounded-[24px] bg-[#100A24] p-2 shadow-[0_16px_36px_rgba(8,5,26,0.2)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-[440px] items-stretch justify-between">
        {NAV_ITEMS.map((tab) => {
          const isActive = isNavItemActive(tab, pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className="group flex flex-col items-center gap-1 rounded-[18px] px-2 py-1.5 transition active:scale-95"
              >
                <span
                  className="grid size-9 place-items-center rounded-2xl transition"
                  style={{
                    color: isActive
                      ? "#100A24"
                      : "rgba(245,238,230,0.68)",
                    ...(isActive
                      ? {
                          background:
                            "#F4C660",
                          boxShadow: "0 6px 16px rgba(244,198,96,0.2)",
                        }
                      : {}),
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                </span>
                <span
                  className="text-[10px] font-bold transition"
                  style={{
                    color: isActive
                      ? "#F4C660"
                      : "rgba(245,238,230,0.66)",
                  }}
                >
                  {t(tab.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
