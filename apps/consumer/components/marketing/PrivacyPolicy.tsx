"use client";

import { PageHero, DayPage } from "./PageShell";
import { LegalDocument } from "./legal/LegalDocument";
import { LEGAL_INTRO, PRIVACY_SECTIONS } from "./legal/legalCopy";

export const PrivacyPolicy = () => (
  <DayPage>
    <main dir="ltr" lang="en">
      <PageHero eyebrow="Legal" title="Privacy" accent="Policy." lede={LEGAL_INTRO} />
      <LegalDocument
        sections={PRIVACY_SECTIONS}
        other={{ href: "/terms-of-service", label: "Read the Terms of Service" }}
      />
    </main>
  </DayPage>
);
