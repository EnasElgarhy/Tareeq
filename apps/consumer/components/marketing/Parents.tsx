"use client";

import { FadeIn } from "./Shared";
import {
  PageHero,
  Section,
  Card,
  IconChip,
  DotList,
  DayPage,
} from "./PageShell";
import { SunriseDunes } from "./Illustrations";
import { KaiChip } from "./KaiGuide";
import { WayArrow, WayChat, WayShield } from "./WayIcons";

const OUTCOMES = [
  "More intentional career choices — based on self-understanding rather than default paths",
  "Lower rates of major switching in university (each switch averages 1–2 extra semesters and 15,000+ AED/SAR/USD in costs)",
  "Higher academic performance in chosen programs — when major matches interests, students are more engaged",
  "Greater career satisfaction long-term — intentional choices lead to more fulfilled lives",
];

const SUPPORT = [
  {
    title: "Have a conversation",
    body: "Ask what surprised them. Ask which clusters felt “right.” Sometimes students discover things about themselves they didn’t have language for before.",
  },
  {
    title: "Research together",
    body: "Look at specific careers in their top clusters. Visit career websites, read job descriptions, watch videos of people doing those jobs. Help them see what’s actually possible.",
  },
  {
    title: "Explore university programs",
    body: "Help them research which programs lead to careers in their clusters — and what kind of university environment suits their Operational Archetype.",
  },
  {
    title: "Understand their motivations",
    body: "A student motivated by Impact will thrive differently than one motivated by Mastery or Autonomy. Honor their motivations in conversations about career.",
  },
];

const DONTS = [
  {
    title: "Don’t pigeonhole them",
    body: "The assessment shows clusters and profiles, not destiny. A Technology student might pursue software engineering, product management, tech sales, tech policy, or a dozen other directions. Keep possibilities open.",
  },
  {
    title: "Don’t override their results with your preferences",
    body: "If their results don’t match what you envisioned, that’s information worth exploring together, not dismissing. Their motivation and engagement matter more than expectations.",
  },
  {
    title: "Don’t treat it as final",
    body: "Interests shift as people learn and grow. What excites them at 16 may look different at 19. That’s healthy development, not failure.",
  },
];

const COUNSELOR = [
  "A structured starting point for career conversations — instead of “What do you want to do?”, work from their results",
  "Helps students who say “I don’t know” explore in a more directed way",
  "Data-backed insight into your student body: which clusters are popular, which are underexplored, where there’s untapped talent",
  "Group administrations — assess a whole grade level and use results in career planning workshops",
];

const PRIVACY = [
  "Personal information (email, name) is encrypted and kept completely separate from assessment responses",
  "Assessment data is anonymized for research — no individual student can be identified",
  "Students choose whether to participate in research (optional consent)",
  "Results are private — only the student and people they choose to share with can see them",
  "We comply with data protection regulations and never sell student information",
];

export const Parents = () => (
  <DayPage>
    <main>
      <PageHero
        eyebrow="For Parents & Educators"
        title="Supporting your student’s"
        accent="career exploration."
        lede="Most young people choose their future without guidance. Here’s how to change that for yours."
        art={SunriseDunes}
        artClass="w-80 h-auto"
      />

      <Section
        eyebrow="Why early clarity matters"
        title="What the research"
        accent="shows."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <FadeIn>
            <p className="text-[var(--day-ink-2)] leading-relaxed">
              Research on career development shows that early intervention —
              guidance during the high-school years — measurably changes
              outcomes. Career counseling has traditionally been expensive and
              time-intensive, available mainly to families who could afford
              private counseling.{" "}
              <span className="text-[#B07A18] font-medium">
                CORE makes it accessible to everyone.
              </span>
            </p>
            <div className="mt-8">
              <IconChip icon={WayArrow} color="#3D8A73" />
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <DotList items={OUTCOMES} />
          </FadeIn>
        </div>
      </Section>

      <Section
        eyebrow="The experience"
        title="How Tareeq works"
        accent="with your student."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              n: "1",
              t: "12 minutes, 54 questions",
              b: "No time pressure, no right or wrong answers. Questions ask about their actual interests, how they naturally work, what motivates them, and where they thrive.",
            },
            {
              n: "2",
              t: "Results, immediately + in depth",
              b: "An immediate results dashboard, plus a detailed narrative report within 24 hours: top clusters, working style, motivations, and thriving environments.",
            },
            {
              n: "3",
              t: "A shareable result card",
              b: "A visual summary they can show you, their school counselor, or anyone else helping them explore.",
            },
          ].map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.1}>
              <Card className="h-full relative overflow-hidden">
                <span className="absolute -top-6 right-2 font-heading font-extrabold text-[6rem] leading-none text-[#6D5BA8]/[0.08] select-none">
                  {s.n}
                </span>
                <h3 className="relative font-heading text-lg font-semibold">
                  {s.t}
                </h3>
                <p className="relative mt-3 text-sm text-[var(--day-ink-2)] leading-relaxed">
                  {s.b}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.15} className="mt-8 max-w-2xl">
          <KaiChip tone="day">
            I keep my language plain on purpose — your student’s report is
            written so the whole family can read it together, no psychology
            degree needed.
          </KaiChip>
        </FadeIn>
      </Section>

      <Section
        eyebrow="Your role"
        title="How to support"
        accent="their results."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SUPPORT.map((s, i) => (
            <FadeIn key={s.title} delay={(i % 2) * 0.08}>
              <Card className="h-full !p-6">
                <h3 className="font-heading text-lg font-semibold text-[#3D8A73]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--day-ink-2)] leading-relaxed">
                  {s.body}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.1} className="mt-10">
          <div className="rounded-story border border-[#C96F63]/30 bg-[#C96F63]/[0.06] p-8">
            <h3 className="font-heading text-xl font-semibold text-[#C96F63]">
              What not to do
            </h3>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              {DONTS.map((d) => (
                <div key={d.title}>
                  <p className="font-heading font-semibold">{d.title}</p>
                  <p className="mt-2 text-sm text-[var(--day-ink-2)] leading-relaxed">
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section
        eyebrow="When results surprise you"
        title="These moments are"
        accent="opportunities."
        className="border-t border-[var(--day-line)]"
      >
        <FadeIn className="max-w-3xl">
          <p className="text-[var(--day-ink-2)] leading-relaxed">
            Maybe you thought they were interested in STEM but they show
            strength in People/Psychology. Or you imagined them in stable roles
            but they’re a Catalyst who needs dynamic environments. These are
            chances to understand your student better — to learn what they
            actually want, not what you thought they wanted. The research is
            clear: when students pursue careers aligned with their interests and
            motivations, they’re more engaged, more successful, and more
            satisfied.{" "}
            <span className="font-heading text-lg font-semibold text-[#B07A18]">
              Supporting their self-understanding — even when it surprises you —
              is the greatest gift you can give.
            </span>
          </p>
        </FadeIn>
      </Section>

      <Section
        eyebrow="For school counselors & educators"
        title="A complement to your work,"
        accent="not a replacement."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <FadeIn>
            <IconChip icon={WayChat} color="#6D5BA8" />
            <div className="mt-6">
              <DotList items={COUNSELOR} />
            </div>
            <p className="mt-8 text-[15px] text-[var(--day-ink-2)]">
              For institutional partnerships, volume licensing, or counselor
              training:{" "}
              <a
                href="mailto:support@tareek.me"
                className="text-[#6D5BA8] hover:text-[#B07A18]"
              >
                get in touch
              </a>
              .
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Card>
              <div className="flex items-center gap-3">
                <IconChip icon={WayShield} color="#3D8A73" />
                <h3 className="font-heading text-xl font-semibold">
                  Data privacy & your student’s safety
                </h3>
              </div>
              <div className="mt-5">
                <DotList items={PRIVACY} className="!space-y-2.5 text-sm" />
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>
    </main>
  </DayPage>
);
