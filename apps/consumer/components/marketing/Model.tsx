"use client";

import type { ComponentType, ReactNode } from "react";
import { FadeIn } from "./Shared";
import {
  PageHero,
  Section,
  Card,
  IconChip,
  DotList,
  DayPage,
} from "./PageShell";
import { CompassRose } from "./Illustrations";
import { KaiChip } from "./KaiGuide";
import {
  WaySpark,
  WayGauge,
  WayHeart,
  WayLeaf,
  WayScale,
  WayCompass,
  CAREER_CLUSTERS,
  type WayIconProps,
} from "./WayIcons";

interface PillarProps {
  index: string;
  name: string;
  question: string;
  icon: ComponentType<WayIconProps>;
  accent: string;
  children: ReactNode;
}

const ARCHETYPES = [
  {
    name: "Precisionist",
    formula: "Structured + Deep",
    body: "Thrives with clear plans, detailed expertise, and minimal ambiguity.",
    accent: "#B07A18",
  },
  {
    name: "Coordinator",
    formula: "Structured + Broad",
    body: "Excels at organizing complex systems, seeing connections, and keeping everything aligned.",
    accent: "#6D5BA8",
  },
  {
    name: "Explorer",
    formula: "Flexible + Broad",
    body: "Loves flexibility, experimentation, and seeing how different areas connect.",
    accent: "#3D8A73",
  },
  {
    name: "Catalyst",
    formula: "Flexible + Deep",
    body: "Thrives in fast-moving environments while developing deep expertise in one area.",
    accent: "#C96F63",
  },
];

const REWARDS = [
  {
    name: "Recognition",
    body: "Being known for your work, respected, visible, acknowledged.",
  },
  {
    name: "Impact",
    body: "Making a real difference in people’s lives or in the world.",
  },
  {
    name: "Autonomy",
    body: "Freedom and independence in how you work, who you answer to, what you build.",
  },
  {
    name: "Mastery",
    body: "Becoming genuinely excellent at something, developing rare skills, being an expert.",
  },
  {
    name: "Stability",
    body: "Predictability, security, knowing what comes next, protecting what you’ve built.",
  },
];

const Pillar = ({
  index,
  name,
  question,
  icon,
  accent,
  children,
}: PillarProps) => (
  <Section className="border-t border-[var(--day-line)]">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <FadeIn className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <span
            className="font-heading font-bold text-5xl leading-none"
            style={{ color: `${accent}66` }}
          >
            {index}
          </span>
          <div className="mt-4 flex items-center gap-3">
            <IconChip icon={icon} color={accent} />
            <div>
              <h2 className="font-heading text-2xl font-semibold">{name}</h2>
              <p className="text-[15px] font-medium" style={{ color: accent }}>
                {question}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.1} className="lg:col-span-8 space-y-6">
        {children}
      </FadeIn>
    </div>
  </Section>
);

const Sub = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h3 className="font-heading text-lg font-semibold text-[#B07A18] mb-2">
      {title}
    </h3>
    <div className="text-[var(--day-ink-2)] leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

export const Model = () => (
  <DayPage>
    <main>
      <PageHero
        eyebrow="The Model"
        title="The CORE Framework:"
        accent="understanding career fit."
        lede="Most tools measure one thing: interests. CORE measures four dimensions of career fit — the whole picture."
        art={CompassRose}
        artClass="w-52 h-52"
      />

      <Section className="!py-0">
        <FadeIn className="max-w-2xl">
          <KaiChip tone="day">
            Think of CORE as four questions I ask about you — what pulls you in,
            how you work, why you push, and where you belong. Every answer
            sharpens the map.
          </KaiChip>
        </FadeIn>
      </Section>

      <Pillar
        index="01"
        name="Curiosities"
        question="What captures your attention?"
        icon={WaySpark}
        accent="#B07A18"
      >
        <Sub title="Eight career clusters">
          <div className="flex flex-wrap gap-2">
            {CAREER_CLUSTERS.map((c) => {
              const Icon = c.icon;
              return (
                <span
                  key={c.label}
                  className="rounded-full bg-[var(--day-card)] border border-[var(--day-line)] px-4 py-1.5 text-sm text-[var(--day-ink-2)] inline-flex items-center gap-2"
                >
                  <Icon size={15} className="text-[#8A6210]" />
                  {c.label}
                </span>
              );
            })}
          </div>
        </Sub>
        <Sub title="Why we measure this">
          <p>
            Interest is one of the strongest predictors of long-term career
            satisfaction. When you work in an area that genuinely captures your
            attention, you sustain effort, develop expertise, and build a career
            you actually care about.
          </p>
        </Sub>
        <Sub title="How we measure it">
          <p>
            Rather than abstract questions (“Do you enjoy problem-solving?”),
            Curiosities uses real-life scenarios. Which video would you actually
            watch? Which club would you join? Which project would you volunteer
            for? These are activities you’re already doing or considering — so
            your answers reflect genuine preference, not hypothetical thinking.
          </p>
        </Sub>
        <Sub title="What you’ll discover">
          <p>
            Which career clusters align with your natural strengths and
            interests. Most people find their top three clusters — a mix that
            shows the breadth of what appeals to you.
          </p>
        </Sub>
      </Pillar>

      <Pillar
        index="02"
        name="Operations"
        question="How do you naturally function?"
        icon={WayGauge}
        accent="#6D5BA8"
      >
        <Sub title="Two dimensions of working style">
          <p>
            <strong className="text-[var(--day-ink)]">Processing Style:</strong>{" "}
            are you <em>Structured</em> (you plan ahead, follow processes,
            minimize surprises) or <em>Flexible</em> (you adapt on the fly,
            improvise, thrive under pressure)?
          </p>
          <p>
            <strong className="text-[var(--day-ink)]">Scope of Focus:</strong>{" "}
            are you <em>Deep</em> (you dive into one area until you master it
            completely) or <em>Broad</em> (you want to see the whole picture and
            how everything connects)?
          </p>
        </Sub>
        <Sub title="Your Operational Archetype">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {ARCHETYPES.map((a) => (
              <Card key={a.name} className="!p-6">
                <p
                  className="font-heading text-lg font-semibold"
                  style={{ color: a.accent }}
                >
                  {a.name}
                </p>
                <p className="text-xs uppercase tracking-widest text-[var(--day-ink-3)] mt-0.5">
                  {a.formula}
                </p>
                <p className="mt-2.5 text-sm text-[var(--day-ink-2)] leading-relaxed">
                  {a.body}
                </p>
              </Card>
            ))}
          </div>
        </Sub>
        <Sub title="Why we measure this">
          <p>
            Two professionals with the same title can have vastly different
            experiences depending on whether their environment matches how they
            naturally function. A Precisionist in a chaotic startup will be
            miserable. A Catalyst in a rigid corporate structure will feel
            trapped. This pillar ensures your career fits not just your
            interests, but your working style.
          </p>
        </Sub>
      </Pillar>

      <Pillar
        index="03"
        name="Rewards"
        question="Why do you strive for success?"
        icon={WayHeart}
        accent="#C96F63"
      >
        <Sub title="Five motivational drivers">
          <div className="space-y-3 mt-2">
            {REWARDS.map((r) => (
              <div
                key={r.name}
                className="flex items-start gap-4 rounded-2xl bg-[var(--day-card)] border border-[var(--day-line)] px-5 py-4"
              >
                <span className="font-heading font-semibold text-[#B07A18] w-28 shrink-0">
                  {r.name}
                </span>
                <span className="text-sm text-[var(--day-ink-2)] leading-relaxed">
                  {r.body}
                </span>
              </div>
            ))}
          </div>
        </Sub>
        <Sub title="How we measure it">
          <p>
            Through paired-choice trade-offs. We don’t ask “How important is
            recognition?” (most people say it matters). Instead: if you could be
            famous for your work OR make a real difference in people’s lives,
            which matters more? Your choices across these trade-offs reveal what
            truly drives you.
          </p>
          <p>
            Research in motivation science shows intrinsic motivation predicts
            long-term career satisfaction far better than salary or title. A
            high-paying job that doesn’t align with what drives you leads to
            burnout; a role that feeds your core motivations leads to engagement
            and growth.
          </p>
        </Sub>
        <Sub title="What you’ll discover">
          <p>
            Your primary reward driver (what drives you most) and secondary
            driver (your supporting factor). This shapes which careers will
            sustain your motivation long-term.
          </p>
        </Sub>
      </Pillar>

      <Pillar
        index="04"
        name="Ecosystems"
        question="Where do you thrive?"
        icon={WayLeaf}
        accent="#3D8A73"
      >
        <Sub title="Two dimensions of environment fit">
          <p>
            <strong className="text-[var(--day-ink)]">Social Battery:</strong>{" "}
            do you energize around people (<em>Collaborative</em>) or recharge
            alone (<em>Independent</em>)? Some thrive in team-heavy environments
            with constant interaction; others need quiet focus time.
          </p>
          <p>
            <strong className="text-[var(--day-ink)]">
              Environmental Pulse:
            </strong>{" "}
            do you thrive in fast-moving, changing environments (
            <em>Dynamic</em>) or steady, predictable structures (
            <em>Predictable</em>)?
          </p>
        </Sub>
        <Sub title="Why we measure this">
          <p>
            The perfect job in the wrong environment leads to burnout. A career
            that matches your interests and motivations but requires constant
            collaboration will drain an independent person. A high-autonomy role
            in a chaotic environment will stress someone who needs
            predictability. Ecosystem fit determines whether you can sustain
            effort and stay engaged.
          </p>
        </Sub>
      </Pillar>

      <Section
        eyebrow="Why these four pillars"
        title="The gap"
        accent="CORE fills."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FadeIn>
            <Card className="h-full">
              <IconChip icon={WayScale} color="#6D5BA8" />
              <h3 className="mt-5 font-heading text-xl font-semibold">
                Holland’s RIASEC — powerful, but built for another era
              </h3>
              <p className="mt-3 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                The most widely used framework, developed in the 1950s,
                categorizes people into six interest types and matches them to
                careers. It’s been validated across decades and continents — but
                it was designed for adults with work experience. Ask a
                16-year-old “Do you like working with tools and machines?” and
                they answer from school projects and assumptions, not
                experience. And it measures interests alone — not how you work,
                what drives you, or where you thrive.
              </p>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Card className="h-full">
              <IconChip icon={WayCompass} color="#B07A18" />
              <h3 className="mt-5 font-heading text-xl font-semibold">
                CORE builds on it — and closes the gaps
              </h3>
              <div className="mt-3 text-[15px] leading-relaxed">
                <DotList
                  items={[
                    "Measures interests through everyday activities, so young people can answer authentically.",
                    "Adds Operations, Rewards, and Ecosystems — three dimensions Holland didn’t include.",
                    "Reflects today’s reality: career paths are no longer simple and linear. You need to know not just what interests you, but how you work best, what sustains your motivation, and where you thrive.",
                  ]}
                />
              </div>
            </Card>
          </FadeIn>
        </div>
      </Section>
    </main>
  </DayPage>
);
