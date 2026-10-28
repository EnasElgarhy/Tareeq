import { pageMetadata, PAGES } from "@/lib/page-metadata";
import { Home } from "@/components/marketing/Home";

export const metadata = pageMetadata(PAGES.home);

export default function RootPage() {
  return <Home />;
}
