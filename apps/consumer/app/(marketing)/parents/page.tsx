import { pageMetadata, PAGES } from "@/lib/page-metadata";
import { Parents } from "@/components/marketing/Parents";

export const metadata = pageMetadata(PAGES.parents);

export default function ParentsPage() {
  return <Parents />;
}
