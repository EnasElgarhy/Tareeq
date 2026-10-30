"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { ShootingStars } from "@/components/brand/ShootingStars";
import { Container, GradientText } from "./Shared";
import { ClosingJourney } from "./ClosingJourney";
import { ReportStory } from "./report-story/ReportStory";

/**
 * "Clarity on your CORE": the heading, then the report told on one pinned
 * phone (report-story/ReportStory), then the closing journey.
 */
export function ResultsStory() {
  const { t } = useLocale();

  return (
    <section
      aria-labelledby="results-story-heading"
      className="relative isolate bg-[#08051A] pt-20 text-[#F5EEE6] md:pt-28"
    >
      <ShootingStars />
      <Container>
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="results-story-heading"
            className="font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl"
          >
            {t("marketing.results.heading1")}{" "}
            <GradientText tone="night">
              {t("marketing.results.heading2")}
            </GradientText>
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-relaxed text-[#F5EEE6]/70">
            {t("marketing.results.subtitle")}
          </p>
        </header>
      </Container>

      <ReportStory />

      <ClosingJourney />
    </section>
  );
}
