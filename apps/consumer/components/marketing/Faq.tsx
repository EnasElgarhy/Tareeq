"use client";

import { FadeIn } from "./Shared";
import { PageHero, Section, Accordion, DayPage } from "./PageShell";
import { KaiChip } from "./KaiGuide";
import { WayQuestion } from "./WayIcons";

const PRACTICAL = [
  {
    q: "How long does the assessment take?",
    a: "About 12 minutes. It’s 54 questions with no right or wrong answers. Don’t rush, but also don’t overthink — your first instinct is usually best.",
  },
  {
    q: "Is it free?",
    a: "Yes. The assessment and your results are completely free.",
  },
  {
    q: "Can I retake it?",
    a: "Yes, anytime. If your answers change because you’ve learned something new or your perspective has shifted, retake it. Your new results will reflect your current thinking.",
  },
  {
    q: "Do I need to create an account?",
    a: "You can start the assessment without an account. At the end, we verify your email so your results are saved and available when you return.",
  },
];

const CAREER = [
  {
    q: "What are the 8 career clusters?",
    a: "Technology, Engineering, Science/Data, Arts/Media, Business, Law/Diplomacy, People/Psychology, and Environment. Most careers fit into one or two clusters — many jobs blend multiple areas.",
  },
  {
    q: "Can I be interested in multiple clusters?",
    a: "Absolutely. Most people’s top three clusters are a mix — that’s actually more realistic. A UX designer combines Technology and Arts. A science journalist combines Science and Arts/Media. Look at how your clusters connect.",
  },
  {
    q: "What’s an Operational Archetype?",
    a: "It describes how you naturally work: Precisionist (structured, detail-focused), Coordinator (organized, collaborative), Explorer (flexible, broad-minded), or Catalyst (fast-paced, adaptable). Knowing this helps you find roles and environments where your working style fits.",
  },
  {
    q: "What if I disagree with my results?",
    a: "Read your full narrative report. Often there’s context that clarifies things — your reward drivers or ecosystem fit might explain why you’d approach a career differently than someone else in the same cluster. If it still doesn’t resonate, retake the assessment.",
  },
  {
    q: "How do I use these results to choose a university major?",
    a: "Look at the careers in your top clusters, then find university programs that lead to them. For some clusters it’s obvious (Engineering → engineering programs). For others it’s broader (Business → commerce, economics, entrepreneurship, management — or psychology if you’re in the People cluster).",
  },
];

const TRUST = [
  {
    q: "How is CORE different from Myers-Briggs or StrengthsFinder?",
    a: "Myers-Briggs measures personality type. StrengthsFinder measures your talents. Both are useful for self-understanding. CORE is specifically designed to answer the career question: what kind of work will you thrive in? We measure your interests, how you work, what motivates you, and where you thrive.",
  },
  {
    q: "Why should I trust this over other career assessments?",
    a: "Most career tests ask abstract questions assuming work experience. You probably haven’t spent time in an office, lab, or design studio, so “Do you enjoy working with data?” is hard to answer honestly. CORE asks about things you’re actually doing, measures four dimensions of fit, and is built specifically for your region.",
  },
  {
    q: "Is this scientifically valid?",
    a: "CORE is grounded in established career psychology research (Holland’s RIASEC, Self-Determination Theory, career development research). It was designed by someone with 20+ years of assessment expertise and BPS certification, and uses clear, rule-based scoring — not AI guessing. Research is ongoing to validate CORE specifically with MENA youth.",
  },
  {
    q: "How accurate is this assessment?",
    a: "Career assessments are tools for exploration, not crystal balls. Well-designed assessments grounded in career psychology reliably predict career interests — but they’re most powerful combined with real exploration: research careers, talk to people doing them, try relevant experiences.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your personal information is encrypted and kept separate from your assessment responses. Your results are private — only you and people you choose to share with can see them. For research, we use anonymous data only. You have full control.",
  },
  {
    q: "Why are there regional differences in this assessment?",
    a: "Job markets differ by country. Universities, educational systems, and career pathways are different. Family and cultural factors influence career decisions differently across MENA. CORE accounts for these realities rather than applying a one-size-fits-all Western model.",
  },
  {
    q: "Who built this?",
    a: "Enas Elgarhy, a Human Capital Development Consultant with 20+ years of experience, BPS Certification in assessment, and CIPD expertise. She designed CORE specifically for youth in the MENA region.",
  },
];

const FaqArt = ({ className }: { className?: string }) => (
  <WayQuestion size={120} className={className} />
);

export const Faq = () => (
  <DayPage>
    <main>
      <PageHero
        eyebrow="FAQ"
        title="Good questions."
        accent="Honest answers."
        art={FaqArt}
        artClass="w-28 h-28 text-[#6D5BA8]"
      />
      <Section className="!py-0">
        <FadeIn className="max-w-3xl">
          <KaiChip tone="day">
            If your question isn’t here, ask me inside the app — or write to the
            team, they really do read everything.
          </KaiChip>
        </FadeIn>
      </Section>
      <Section eyebrow="Practical" title="The basics.">
        <FadeIn className="max-w-3xl">
          <Accordion items={PRACTICAL} testPrefix="faq-practical" />
        </FadeIn>
      </Section>
      <Section
        eyebrow="Career & results"
        title="Understanding your"
        accent="profile."
        className="border-t border-[var(--day-line)]"
      >
        <FadeIn className="max-w-3xl">
          <Accordion items={CAREER} testPrefix="faq-career" defaultOpen={-1} />
        </FadeIn>
      </Section>
      <Section
        eyebrow="Trust & credibility"
        title="The hard"
        accent="questions."
        className="border-t border-[var(--day-line)]"
      >
        <FadeIn className="max-w-3xl">
          <Accordion items={TRUST} testPrefix="faq-trust" defaultOpen={-1} />
        </FadeIn>
      </Section>
    </main>
  </DayPage>
);
