"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NAV_ITEMS, isNavItemActive } from "@/components/home/nav-items";

/**
 * The desktop navigation: a normal top bar, as on the website. Logo on the
 * start side, the app's sections as text links with a gold underline on the
 * active one, and "You" as the account item at the end. Phones and tablets
 * keep `AppTabBar`. Shares `NAV_ITEMS` with the tab bar so the two never
 * drift.
 */
export function AppTopNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const sections = NAV_ITEMS.filter((item) => item.href !== "/you");
  const account = NAV_ITEMS.find((item) => item.href === "/you");

  return (
    <header className="sticky top-0 z-30 hidden border-b border-[color:var(--day-line)] bg-[color:var(--day-bg)]/85 backdrop-blur-md lg:block">
      <nav
        aria-label={t("home.tab.nav_label")}
        className="mx-auto flex h-16 max-w-[1240px] items-center gap-10 px-8"
      >
        <Link href="/" aria-label="Tareeq home" className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-6 bg-aurora"
            style={{
              WebkitMaskImage: "url('/logo/tareeq-mark.svg')",
              maskImage: "url('/logo/tareeq-mark.svg')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
          <span className="text-[18px] font-bold lowercase leading-none tracking-[-0.025em] text-[color:var(--day-ink)]">
            tareeq
          </span>
        </Link>

        <ul className="flex h-full items-stretch gap-7">
          {sections.map((item) => {
            const isActive = isNavItemActive(item, pathname);
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center text-[14.5px] font-semibold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6D5BA8] ${
                    isActive
                      ? "text-[color:var(--day-ink)] after:bg-[#F4C660]"
                      : "text-[color:var(--day-ink-2)] after:bg-transparent hover:text-[color:var(--day-ink)]"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>

        {account ? (
          <Link
            href={account.href}
            aria-current={isNavItemActive(account, pathname) ? "page" : undefined}
            className="ms-auto inline-flex items-center gap-2 rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-card)] py-1.5 pe-4 ps-1.5 text-[14px] font-semibold text-[color:var(--day-ink)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5BA8]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#100A24] text-[#F5EEE6]">
              <account.icon size={15} strokeWidth={2} />
            </span>
            {t(account.labelKey)}
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
