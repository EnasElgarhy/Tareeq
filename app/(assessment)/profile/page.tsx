import { redirect } from "next/navigation";

/**
 * /profile is the pre-Home-tab-redesign route — superseded by /you (see
 * app/(app)/layout.tsx). Kept as a redirect rather than deleted outright
 * so old links/bookmarks still land somewhere real.
 */
export default function ProfilePage() {
  redirect("/you");
}
