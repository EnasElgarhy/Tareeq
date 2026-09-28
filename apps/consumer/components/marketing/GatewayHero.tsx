"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container } from "./Shared";
import { GradientText } from "./Shared";
import { ProductJourney } from "./ProductJourney";
import { ScienceBanner } from "./ScienceBanner";

const HERO_SCENE = "/marketing/hero/kai-compass-sunset.png";

export const GatewayHero = () => {
  const { t } = useLocale();

  return (
    <section
      className="relative overflow-hidden bg-[#08051A]"
      aria-labelledby="hero-heading"
    >
      {/* Right-side visual: Kai showing the learner the compass. It lives in
          its own clipped layer on the right 55% so it never runs under the
          copy, and is drawn at its true 3:2 ratio (not cover-zoomed) so Kai,
          the learner and the whole compass table stay in frame. */}
      <div
        className="pointer-events-none absolute inset-y-0 end-0 z-[1] hidden w-[55%] overflow-hidden lg:block"
        aria-hidden="true"
      >
        {/* Mirrored in RTL so Kai and the compass face the copy from the left,
            matching the English framing. */}
        <div className="absolute -end-[8vw] bottom-[5%] aspect-[3/2] w-[76vw] rtl:-scale-x-100">
          <Image
            src={HERO_SCENE}
            alt=""
            fill
            priority
            sizes="76vw"
            className="select-none object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #08051A 0%, rgba(8,5,26,0) 26%, rgba(8,5,26,0) 82%, #08051A 100%)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 rtl:-scale-x-100"
          style={{
            background:
              "linear-gradient(90deg, #08051A 0%, rgba(8,5,26,0.65) 8%, rgba(8,5,26,0.2) 25%, rgba(8,5,26,0) 45%)",
          }}
        />
      </div>

      <Container className="relative z-[3]">
        <div className="grid items-center gap-12 pb-20 pt-32 sm:pb-24 sm:pt-36 lg:min-h-[100svh] lg:grid-cols-[minmax(0,30rem)_18rem] lg:gap-10 lg:pb-32 lg:pt-36">
          <div className="lg:py-6">
            <ScienceBanner />
            <h1
              id="hero-heading"
              data-testid="hero-headline"
              className="mt-7 font-heading text-[2.5rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#F5EEE6] sm:text-[3.25rem] lg:text-[3.1rem] xl:text-[3.5rem]"
            >
              {t("marketing.hero.headline1")}
              <br />
              <GradientText tone="night">
                {t("marketing.hero.headline2")}
              </GradientText>
            </h1>

            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-[#F5EEE6]/70">
              {t("marketing.hero.subtitle")}
            </p>

            <div className="mt-9">
              <Link
                href="/start"
                data-testid="hero-cta-start"
                className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-9 py-4 text-base font-semibold text-[#14101F] shadow-lg shadow-[#F4C660]/20 transition-transform hover:scale-[1.02] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
              >
                {t("marketing.hero.cta")}
              </Link>
            </div>
          </div>

          <div
            className="relative -mx-6 aspect-[16/10] lg:hidden"
            aria-hidden="true"
          >
            <Image
              src={HERO_SCENE}
              alt=""
              fill
              sizes="100vw"
              className="select-none object-cover object-[68%_center]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #08051A 0%, rgba(8,5,26,0) 22%, rgba(8,5,26,0) 72%, #08051A 100%)",
              }}
            />
          </div>

          <div className="relative z-[4] lg:h-[30rem]">
            <ProductJourney />
          </div>
        </div>
      </Container>
    </section>
  );
};
