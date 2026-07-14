"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/admin/analytics", label: "Overview", exact: true },
  { href: "/admin/analytics/assessments", label: "Assessments", exact: false },
  { href: "/admin/analytics/audience", label: "Audience", exact: false },
  { href: "/admin/analytics/quality", label: "Quality", exact: false },
  { href: "/admin/analytics/research", label: "Research", exact: false },
  { href: "/admin/analytics/exports", label: "Exports", exact: false },
] as const;

/** Preserves the active filters/range in the query string across tab switches. */
export function TabNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav
      aria-label="Analytics sections"
      className="adm-fade-up flex gap-1 overflow-x-auto border-b border-adm-line"
    >
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        const href = qs ? `${tab.href}?${qs}` : tab.href;
        return (
          <Link
            key={tab.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 px-4 py-2.5 text-sm font-bold transition-colors duration-adm-fast ${
              active ? "text-adm-violet" : "text-adm-ink-muted hover:text-adm-ink"
            }`}
          >
            {tab.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-adm-violet"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
