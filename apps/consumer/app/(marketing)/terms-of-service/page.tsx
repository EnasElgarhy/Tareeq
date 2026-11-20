import { TermsOfService } from "@/components/marketing/TermsOfService";
import { pageMetadata, PAGES } from "@/lib/page-metadata";

export const metadata = pageMetadata(PAGES.terms);

export default function TermsOfServicePage() {
  return <TermsOfService />;
}
