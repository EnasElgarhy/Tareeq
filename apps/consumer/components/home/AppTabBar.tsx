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
      className="relative z-20 -mx-5 mt-auto border-t border-[color:var(--day-line)] bg-[#fffcf6]/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden"
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
                className="group flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition active:scale-95"
              >
                <span
                  className="grid size-9 place-items-center rounded-2xl transition"
                  style={{
                    color: isActive
                      ? "var(--app-ink, #6B4D00)"
                      : "var(--day-ink-3, #675D4E)",
                    ...(isActive
                      ? {
                          background:
                            "color-mix(in oklab, var(--app-accent, #F4C660) 16%, transparent)",
                          boxShadow:
                            "inset 0 0 0 1px color-mix(in oklab, var(--app-accent, #F4C660) 30%, transparent)",
                        }
                      : {}),
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                </span>
                <span
                  className="text-[10px] font-bold tracking-[0.02em] transition"
                  style={{
                    color: isActive
                      ? "var(--app-ink, #6B4D00)"
                      : "var(--day-ink-3, #675D4E)",
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
