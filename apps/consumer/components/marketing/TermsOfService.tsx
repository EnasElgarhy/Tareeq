"use client";

import { PageHero, DayPage } from "./PageShell";
import { LegalDocument } from "./legal/LegalDocument";
import { LEGAL_INTRO, TERMS_SECTIONS } from "./legal/legalCopy";

export const TermsOfService = () => (
  <DayPage>
    <main dir="ltr" lang="en">
      <PageHero eyebrow="Legal" title="Terms of" accent="Service." lede={LEGAL_INTRO} />
      <LegalDocument
        sections={TERMS_SECTIONS}
        other={{ href: "/privacy-policy", label: "Read the Privacy Policy" }}
      />
    </main>
  </DayPage>
);
