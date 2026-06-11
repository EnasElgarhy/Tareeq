"use client";

import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-xl bg-[#6E48E4] text-[13px] font-black text-white">
          T
        </span>
        <span className="text-[15px] font-bold text-slate-900">
          Tareeq Admin
        </span>
      </div>

      <nav className="flex-1 px-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition ${
                active
                  ? "bg-[#6E48E4]/10 text-[#6E48E4]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <p className="truncate px-3 pb-2 text-[11.5px] text-slate-400">
          {email ?? "Admin"}
        </p>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
