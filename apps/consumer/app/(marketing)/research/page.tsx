import { pageMetadata, PAGES } from "@/lib/page-metadata";
import { Research } from "@/components/marketing/Research";

export const metadata = pageMetadata(PAGES.science);

export default function ResearchPage() {
  return <Research />;
}
