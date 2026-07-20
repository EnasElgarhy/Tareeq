import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/ui/Toast";
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
    <ToastProvider>
      <a
        href="#adm-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-adm-sm focus:bg-adm-violet focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen bg-adm-paper">
        <AdminSidebar email={admin.email} permissions={admin.permissions} />
        <main id="adm-main" className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
