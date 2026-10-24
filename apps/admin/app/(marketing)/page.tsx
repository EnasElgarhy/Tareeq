import { redirect } from "next/navigation";

/**
 * Root route → the admin panel. This app serves admins only; students use
 * the consumer app, so the root never opens the assessment here.
 */
export default function RootPage(): never {
  redirect("/admin");
}
