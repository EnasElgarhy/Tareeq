import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { MeetKai } from "./MeetKai";
import { Journey } from "./Journey";
import { Comparison } from "./Comparison";
import { Features } from "./Features";
import { Screenshots } from "./Screenshots";
import { Testimonials } from "./Testimonials";
import { Faq } from "./Faq";
import { FinalCta, Footer } from "./FinalCta";

/**
 * The marketing entry point at `/` — ported from the standalone
 * tareeq-website repo (github.com/wahbas/tareq-website). Every section
 * scrolls on one page; only the FinalCta button actually launches the
 * assessment (`/start`), matching the source design's "everything funnels
 * to one considered final CTA" structure.
 */
export function LandingPage() {
  return (
    <main className="bg-[#F4EEE3] text-[#2A2118] font-body antialiased overflow-x-hidden">
      <Nav />
      <Hero />
      <HowItWorks />
      <MeetKai />
      <Journey />
      <Comparison />
      <Features />
      <Screenshots />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
