import { pageMetadata, PAGES } from "@/lib/page-metadata";
import { ModelPage } from "@/components/marketing/model/ModelPage";

export const metadata = pageMetadata(PAGES.model);

export default function Page() {
  return <ModelPage />;
}
