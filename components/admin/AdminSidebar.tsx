"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* Compass mark — Tareeq's wayfinding signature, gold needle on night. */
function CompassMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14" stroke="var(--adm-violet-soft)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" stroke="rgba(157,127,240,0.35)" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M16 5 L19 16 L16 27 L13 16 Z" fill="var(--adm-violet)" />
      <path d="M16 5 L19 16 H13 Z" fill="var(--adm-gold)" />
      <circle cx="16" cy="16" r="1.8" fill="var(--adm-paper)" />
    </svg>
  );
}

interface NavEntry {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

const NAV: NavEntry[] = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4Zm10-11h6V4h-6v5Z" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/admin/content",
    label: "Content",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M5 4h11l3 3v13H5V4Zm3 6h8M8 14h8" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/admin/responses",
    label: "Responses",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2V4Zm3 5h8M8 13h6" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" {...stroke} />
        <path d="M3.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15c1.9.5 3 1.9 3 5" {...stroke} />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M4 20V10m5.5 10V4M15 20v-7m5 7V8" {...stroke} />
      </svg>
    ),
  },
];

function NavItem({ entry }: { entry: NavEntry }) {
  const pathname = usePathname();
  const active = entry.exact
    ? pathname === entry.href
    : pathname.startsWith(entry.href);

  return (
    <Link
      href={entry.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-adm-md px-3.5 py-2.5 text-sm font-semibold transition-colors duration-adm-fast
        ${
          active
            ? "bg-adm-violet text-white shadow-adm-sm"
            : "text-adm-lilac hover:bg-white/[0.06] hover:text-white"
        }`}
    >
      {/* gold tick — the active-nav signature */}
      <span
        aria-hidden="true"
        className={`absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-adm-gold transition-[transform,opacity] duration-adm-base ease-adm ${
          active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
        }`}
      />
      <span className={active ? "text-adm-gold" : "text-adm-violet-soft group-hover:text-adm-lilac"}>
        {entry.icon}
      </span>
      {entry.label}
    </Link>
  );
}

export function AdminSidebar({ email }: { email: string | null }) {
  const router = useRouter();
  const initial = (email?.trim()?.[0] ?? "A").toUpperCase();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="adm-on-dark adm-night-glow sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] text-adm-paper">
      {/* Wordmark */}
      <div className="flex items-center gap-3 px-6 pb-6 pt-7">
        <CompassMark />
        <div>
          <p className="adm-display text-xl leading-none text-adm-paper">Tareeq</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-adm-violet-soft">
            Admin
          </p>
        </div>
      </div>

      <nav aria-label="Admin sections" className="flex-1 space-y-1 px-4">
        {NAV.map((entry) => (
          <NavItem key={entry.href} entry={entry} />
        ))}
      </nav>

      {/* User card */}
      <div className="mx-4 mb-5 rounded-adm-md border border-white/[0.08] bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: "var(--adm-grad-violet)" }}
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-adm-paper">Admin</p>
            <p className="truncate text-[11px] text-adm-lilac">
              {email ?? "Signed in"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-adm-sm p-1.5 text-adm-lilac transition-colors duration-adm-fast hover:bg-white/[0.08] hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M14 4H6v16h8M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5" {...stroke} />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
