import { LandingPage } from "@/components/landing/LandingPage";

/**
 * Root route → the marketing landing page (ported from
 * github.com/wahbas/tareq-website), which funnels into the assessment
 * flow via its own final CTA linking to `/start`.
 */
export default function RootPage() {
  return <LandingPage />;
}
