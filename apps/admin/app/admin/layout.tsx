import "./admin.css";

/**
 * Parent layout for ALL /admin routes (login + shell).
 * Imports the scoped admin token sheet exactly once and applies the
 * `.adm` scope root so admin tokens never leak into consumer surfaces.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="adm min-h-screen">{children}</div>;
}
