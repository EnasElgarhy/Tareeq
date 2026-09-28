"use client";

import { DaybreakPanel } from "./DaybreakPanel";
import { GatewayHero } from "./GatewayHero";
import { ResultsStory } from "./ResultsStory";
import { WhyTareeqSection } from "./why-tareeq/WhyTareeqSection";

export function Home() {
  return (
    <main>
      {/* NIGHT — the gateway */}
      <GatewayHero />

      {/* DAY — clarity. The top edge opens into an oval as the panel rises. */}
      <DaybreakPanel>
        <WhyTareeqSection />
        <ResultsStory />
      </DaybreakPanel>
    </main>
  );
}
