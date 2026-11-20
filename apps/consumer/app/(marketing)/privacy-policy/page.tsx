import { PrivacyPolicy } from "@/components/marketing/PrivacyPolicy";
import { pageMetadata, PAGES } from "@/lib/page-metadata";

export const metadata = pageMetadata(PAGES.privacy);

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
