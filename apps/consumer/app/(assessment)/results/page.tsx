import { redirect } from "next/navigation";

/**
 * The report lives inside the app shell as the Compass tab. Anything that
 * still lands here — old links, the browser's history — is sent there.
 */
export default function ResultsPage() {
  redirect("/compass");
}
