import { redirect } from "next/navigation";

/**
 * Root route → Meet Kai.
 *
 * The v1 marketing landing page is retired. First-time visitors land
 * directly on the redesigned ceremony entry (`/intro` — Meet Kai) so
 * the assessment flow is the only experience on production.
 */
export default function RootPage(): never {
  redirect("/intro");
}
