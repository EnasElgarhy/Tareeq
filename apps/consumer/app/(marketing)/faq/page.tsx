import { Faq } from "@/components/marketing/Faq";
import { faqStructuredData } from "@/components/marketing/faq/faqCopy";
import { pageMetadata, PAGES } from "@/lib/page-metadata";

export const metadata = pageMetadata(PAGES.faq);

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, first-party data with "<" escaped: no user input reaches it.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData()).replace(/</g, "\\u003c"),
        }}
      />
      <Faq />
    </>
  );
}
