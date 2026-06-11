import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Gated admin shell. requireAdmin() enforces the admin role (middleware only
 * checks authentication) and redirects non-admins to the login.
 */
export default async function AdminShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 [color-scheme:light]">
      <AdminSidebar email={admin.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
