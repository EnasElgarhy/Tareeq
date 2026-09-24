"use client";

import { PageHero, Section, DayPage } from "./PageShell";

export const PrivacyPolicy = () => (
  <DayPage>
    <main>
      <PageHero eyebrow="Legal" title="Privacy" accent="Policy." />
      <Section>
        <p className="max-w-2xl text-lg leading-relaxed text-[color:var(--day-ink-2)]">
          [Placeholder — final legal text pending]
        </p>
      </Section>
    </main>
  </DayPage>
);
