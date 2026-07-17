"use client";

import { FadeIn } from "./Shared";
import {
  PageHero,
  Section,
  Card,
  IconChip,
  DotList,
  Accordion,
  DayPage,
} from "./PageShell";
import { Constellation } from "./Illustrations";
import { KaiChip } from "./KaiGuide";
import { WayScale, WayHeart, WayPath, WaySpark, WayGauge } from "./WayIcons";

const THEORIES = [
  {
    icon: WayScale,
    accent: "#B07A18",
    name: "Holland’s Vocational Interest Theory (RIASEC)",
    start:
      "One of the most researched and validated career models in psychology: people with similar interest profiles tend to thrive in similar career environments. CORE builds on this — particularly the insight that interest is a strong predictor of career satisfaction.",
    adapted:
      "Holland assumes work experience. CORE measures interests through everyday activities you’re already doing, making it accurate for youth without significant work history.",
  },
  {
    icon: WayHeart,
    accent: "#C96F63",
    name: "Self-Determination Theory (Deci & Ryan)",
    start:
      "Intrinsic motivation — being driven by internal needs rather than external rewards — is crucial for long-term engagement and wellbeing. Three needs drive it: autonomy, competence, and relatedness.",
    adapted:
      "Our Rewards pillar maps to these needs. Impact relates to relatedness, Autonomy maps directly, Mastery relates to competence, and Recognition and Stability address the security needs that underlie motivation.",
  },
  {
    icon: WayPath,
    accent: "#6D5BA8",
    name: "Career Development Theory (Super, Savickas, Krumboltz)",
    start:
      "Career choice isn’t a single decision — it’s an ongoing process of self-understanding and exploration. People thrive when they use self-knowledge to make intentional choices.",
    adapted:
      "Each pillar illuminates a different dimension of yourself — interests, working style, values, environmental needs — a multidimensional self-portrait to guide your explorations.",
  },
];

const REGIONAL = [
  {
    title: "Job markets",
    body: "The available careers, industries, and opportunities are different. Technology and engineering dominate MENA’s growth sectors. Family and government roles carry different prestige and stability than in Western markets.",
  },
  {
    title: "Education systems",
    body: "University structure, degree programs, and pathways differ significantly from Western models. The decision points and timing are different.",
  },
  {
    title: "Cultural factors",
    body: "Family expectations, gender considerations, and social context play different roles in career decisions across MENA than in individualistic Western contexts.",
  },
  {
    title: "Life experience",
    body: "Young people in MENA may have different exposure to career types, industries, and role models based on their context.",
  },
];

const CREDENTIALS = [
  "BPS Certification as an Assessor (British Psychological Society) — the gold standard in psychological assessment credibility",
  "CIPD Diploma in Human Resources Management and Subject Matter Expert status with the Chartered Institute of Personnel and Development",
  "Advanced proficiency with psychometric tools including Korn Ferry Leadership Potential, Hogan, Saville, MBTI, PAPI-3, and TalentPredix",
];

const FAQS = [
  {
    q: "How is CORE different from Myers-Briggs or StrengthsFinder?",
    a: "Myers-Briggs measures personality type — how you prefer to think and interact with the world. StrengthsFinder measures your talents. Both are valuable for self-understanding, but they don’t measure career fit specifically. CORE is designed for career exploration — measuring your interests, how you work, what motivates you, and where you thrive. They answer different questions.",
  },
  {
    q: "Why should I trust this over other career assessments?",
    a: "Most career tests assume work experience and ask abstract questions. You probably haven’t worked in an office, a lab, or a design firm yet — so how can you honestly answer “Do you enjoy working with data”? CORE asks about things you’re already doing, measures four dimensions of fit (not just interests), and is built specifically for your region.",
  },
  {
    q: "How accurate is this assessment?",
    a: "Career assessments are tools for exploration and self-understanding, not destiny machines. When assessments are grounded in sound psychological theory — as CORE is — they reliably predict career interests and can correlate with career satisfaction. Use your results to research careers, talk to people in those fields, and try relevant experiences.",
  },
  {
    q: "What if I disagree with my results?",
    a: "Sometimes results surprise us. Before dismissing them, read the full narrative report — the explanation often provides context that clarifies things. If it still doesn’t resonate, you can retake the assessment anytime.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your personal information is encrypted and kept separate from your assessment data. Your responses are used only to generate your results, which are private unless you choose to share them. We comply with data protection regulations and never sell your information.",
  },
];

export const Research = () => (
  <DayPage>
    <main>
      <PageHero
        eyebrow="Research & Evidence"
        title="The science"
        accent="behind CORE."
        lede="CORE is grounded in established career psychology research. Here’s what informed the model — and where we deliberately adapted it for MENA youth."
        art={Constellation}
        artClass="w-72 h-auto"
      />

      <Section
        eyebrow="Foundations"
        title="Three research traditions,"
        accent="one framework."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {THEORIES.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <Card className="h-full flex flex-col">
                <IconChip icon={t.icon} color={t.accent} />
                <h3 className="mt-5 font-heading text-lg font-semibold leading-snug">
                  {t.name}
                </h3>
                <p className="mt-4 text-sm text-[var(--day-ink-2)] leading-relaxed">
                  <span className="text-[#B07A18] font-semibold">
                    Starting point ·{" "}
                  </span>
                  {t.start}
                </p>
                <p className="mt-3 text-sm text-[var(--day-ink-2)] leading-relaxed">
                  <span className="text-[#3D8A73] font-semibold">
                    How CORE uses it ·{" "}
                  </span>
                  {t.adapted}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Regional adaptation"
        title="Why a MENA-built model"
        accent="matters."
        className="border-t border-[var(--day-line)]"
      >
        <FadeIn className="max-w-3xl mb-10">
          <p className="text-[var(--day-ink-2)] leading-relaxed">
            Global career frameworks were developed primarily in the US and
            Europe. They work well for those contexts — but they weren’t
            designed for MENA realities. CORE’s career clusters reflect regional
            economic realities, its scenarios are culturally relevant, and its
            research base is being built with MENA youth data.
          </p>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {REGIONAL.map((r, i) => (
            <FadeIn key={r.title} delay={(i % 2) * 0.08}>
              <Card className="h-full !p-6">
                <h3 className="font-heading text-lg font-semibold text-[#B07A18]">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--day-ink-2)] leading-relaxed">
                  {r.body}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Assessment design"
        title="54 questions,"
        accent="deterministic scoring."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FadeIn>
            <Card className="h-full">
              <IconChip icon={WaySpark} color="#6D5BA8" />
              <h3 className="mt-5 font-heading text-xl font-semibold">
                The 54 questions
              </h3>
              <p className="mt-3 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                Each question maps to specific psychological constructs.
                Curiosities questions test interest in career clusters through
                realistic scenarios. Operations questions reveal cognitive style
                and work preferences. Rewards uses forced-choice trade-offs to
                reveal what truly drives you. Ecosystems measures environmental
                and social preferences.
              </p>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Card className="h-full">
              <IconChip icon={WayGauge} color="#3D8A73" />
              <h3 className="mt-5 font-heading text-xl font-semibold">
                The scoring logic
              </h3>
              <p className="mt-3 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                CORE uses deterministic scoring — a transparent, rule-based
                algorithm. It’s not machine-learning or AI-guessed. Each
                response maps to specific constructs; your profile is determined
                by clear mathematical rules. Your results are consistent,
                reproducible, and explainable.
              </p>
            </Card>
          </FadeIn>
        </div>
        <FadeIn delay={0.15} className="mt-8 max-w-2xl">
          <KaiChip tone="day">
            The scoring is math, not mystery — my job starts after it: turning
            your profile into words, examples, and next steps you can actually
            use.
          </KaiChip>
        </FadeIn>
      </Section>

      <Section
        eyebrow="Who developed this"
        title="Two decades of"
        accent="assessment expertise."
        className="border-t border-[var(--day-line)]"
      >
        <FadeIn>
          <div className="rounded-story-alt p-px bg-gradient-to-br from-[#F4C660]/70 via-[#C8B6F0]/40 to-transparent max-w-4xl">
            <div className="rounded-story-alt bg-[var(--day-elevated)] p-8 sm:p-12">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-full bg-aurora flex items-center justify-center font-heading text-xl font-bold text-[#14101F]">
                  EE
                </span>
                <div>
                  <h3 className="font-heading text-2xl font-semibold">
                    Enas Elgarhy
                  </h3>
                  <p className="text-sm text-[#6D5BA8]">
                    Human Capital Development Consultant · 20+ years
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <DotList items={CREDENTIALS} />
              </div>
              <p className="mt-6 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                She designed CORE to address a gap she observed across her
                career: young people in the MENA region were using Western
                career tools that didn’t fit their reality. CORE brings together
                two decades of assessment expertise with a commitment to making
                career guidance accessible and culturally relevant.
              </p>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section
        eyebrow="Questions"
        title="Frequently asked,"
        accent="honestly answered."
        className="border-t border-[var(--day-line)]"
      >
        <FadeIn className="max-w-3xl">
          <Accordion items={FAQS} testPrefix="research-faq" />
        </FadeIn>
      </Section>
    </main>
  </DayPage>
);
