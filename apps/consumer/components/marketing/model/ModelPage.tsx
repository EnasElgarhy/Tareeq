import { DaybreakPanel } from "../DaybreakPanel";
import { CoreComparison } from "./CoreComparison";
import { ModelClosing } from "./ModelClosing";
import { ModelHero } from "./ModelHero";
import { PillarChapters } from "./PillarChapters";

/**
 * Night → day → night, like the home page: the dial introduces the model in
 * the dark, the pillars are read in daylight, and dusk leads into the close.
 */
export function ModelPage() {
  return (
    <main className="bg-[#08051A] text-[#F5EEE6]">
      <ModelHero />
      <DaybreakPanel>
        <PillarChapters />
        <CoreComparison />
        <div className="h-48 bg-dusk-band sm:h-64" aria-hidden="true" />
      </DaybreakPanel>
      <ModelClosing />
    </main>
  );
}
