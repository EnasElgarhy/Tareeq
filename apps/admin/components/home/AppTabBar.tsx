"use client";

import { Compass, House, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

interface TabItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  /** Extra pathnames that should also light this tab (e.g. preview routes). */
  alsoActiveOn?: string[];
}

const TABS: TabItem[] = [
  { label: "Overview", href: "/home", icon: House, alsoActiveOn: ["/home-preview"] },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Kai", href: "/kai", icon: Sparkles },
  { label: "You", href: "/you", icon: UserRound },
];

/**
 * The app's bottom tab bar — the spine of the post-result experience.
 * Sits pinned to the bottom of the phone frame. The active tab wears the
 * user's cluster accent (threaded via `--app-accent`) for ownership.
 */
export function AppTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="relative z-20 -mx-5 mt-auto border-t border-[color:var(--day-line)] bg-[#fffcf6]/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-[440px] items-stretch justify-between">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.alsoActiveOn?.includes(pathname) ?? false);
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
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
