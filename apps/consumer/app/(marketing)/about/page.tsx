import { pageMetadata, PAGES } from "@/lib/page-metadata";
import { About } from "@/components/marketing/About";

export const metadata = pageMetadata(PAGES.about);

export default function AboutPage() {
  return <About />;
}
