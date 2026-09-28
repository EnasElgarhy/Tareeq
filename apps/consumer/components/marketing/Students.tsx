"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FadeIn, GoldButton } from "./Shared";
import {
  PageHero,
  Section,
  Card,
  IconChip,
  DotList,
  DayPage,
} from "./PageShell";
import { PathToDawn } from "./Illustrations";
import { KaiChip } from "./KaiGuide";
import { WayCompass, WayBook, WayArrow, WayTarget, WayChart } from "./WayIcons";

const ASSESSMENTS = [
  {
    icon: WayCompass,
    name: "CORE Assessment",
    chips: ["54 questions", "~12 min", "Free"],
    body: "The full four-dimension career-fit assessment. Your compass, report, and shareable card.",
    available: true,
    tilt: -0.75,
    band: "linear-gradient(118deg, #221248 0%, #3A2565 45%, #6D5BA8 85%, #8163C9 100%)",
    cover: "/marketing/daybreak/scroll-world/crossroads-kai-m.jpg",
    bandInk: "#F5EEE6",
    chipStyle: "bg-[#FFF9EE] border-[#F4C660]/50 text-[#7A4A21]",
  },
  {
    icon: WayTarget,
    name: "Career Match",
    chips: ["Roles & majors"],
    body: "Matches your CORE profile to specific roles and university majors in your country.",
    available: false,
    tilt: 0,
    band: "linear-gradient(118deg, #DCD2F2 0%, #EFE9FA 100%)",
    bandInk: "#4A3580",
    chipStyle:
      "bg-[var(--day-inset)] border-[var(--day-line)] text-[var(--day-ink-3)]",
  },
  {
    icon: WayChart,
    name: "Skill Gap Analysis",
    chips: ["Learning roadmap"],
    body: "Shows the skills between you and a target role — and where to build them.",
    available: false,
    tilt: 0.75,
    band: "linear-gradient(118deg, #C9E2D8 0%, #E9F3EE 100%)",
    bandInk: "#2E6B58",
    chipStyle:
      "bg-[var(--day-inset)] border-[var(--day-line)] text-[var(--day-ink-3)]",
  },
];

const GET = [
  {
    icon: WayCompass,
    accent: "#B07A18",
    title: "Your Career Compass",
    sub: "Results dashboard, immediately",
    items: [
      "Your top 3 career clusters ranked by fit, with a confidence score",
      "Your Operational Archetype — Precisionist, Coordinator, Explorer, or Catalyst — explained",
      "Your primary and secondary reward drivers",
      "Your ecosystem fit: the conditions where you thrive",
    ],
  },
  {
    icon: WayBook,
    accent: "#6D5BA8",
    title: "Your Narrative Report",
    sub: "Within 24 hours",
    items: [
      "What each pillar means for your career, in plain language",
      "Real career examples in your top clusters",
      "How your archetype shapes your ideal work environment",
      "Which careers align with your reward drivers",
      "Specific next steps based on your unique profile",
    ],
  },
  {
    icon: WayArrow,
    accent: "#3D8A73",
    title: "Your Shareable Result Card",
    sub: "Download, print, or share",
    items: [
      "A visual 3-page summary of your results",
      "Great for showing parents, teachers, or school counselors",
      "Comes with a family guide for talking about the results together",
    ],
  },
];

const USE = [
  {
    title: "For your career clusters",
    body: "Research 3–5 roles within each of your top clusters. What do they do day-to-day? What’s the path to get there? Talk to people doing those jobs — ask what they wish they’d known starting out.",
  },
  {
    title: "For your university major",
    body: "Look at which programs lead to careers in your top clusters. Some connections are obvious (Engineering → engineering programs); others are broader (Business → commerce, economics, entrepreneurship, or management).",
  },
  {
    title: "For your Operational Archetype",
    body: "Use how you work best to choose your environment. A Precisionist thrives in structured organizations; a Catalyst feels suffocated there and needs startup-style environments. Choose internships, projects, and teams that match how you naturally work.",
  },
  {
    title: "For your reward drivers",
    body: "When evaluating careers, ask: does this align with what drives me? Motivated by Impact — choose roles where you see your work help people. Mastery — roles with deep expertise. Recognition — visibility and advancement.",
  },
  {
    title: "For your ecosystem fit",
    body: "Collaborative? Seek team-based roles. Independent? Look for autonomy. Thrive in dynamic environments? Choose fast-moving organizations. Need predictability? Seek stable, structured ones.",
  },
];

const STORIES = [
  {
    quote:
      "I thought I had to choose between STEM and humanities. My results showed I had both Technology and Arts/Media in my top clusters. Learning that I could pursue careers that blend both — like UX design or tech communication — completely opened my thinking about what was possible.",
    name: "Amir",
    meta: "17 · KSA",
    initial: "A",
  },
  {
    quote:
      "My family wanted me to study medicine. My results showed People/Psychology as my top cluster — not Science. I was initially disappointed, but my psychology-focused career suggestions actually excite me more than medicine would. Now I’m pursuing psychology with my parents’ support.",
    name: "Rayan",
    meta: "16 · UAE",
    initial: "R",
  },
  {
    quote:
      "I didn’t know I was a Catalyst — that I need fast-paced, changing environments. I was applying to government and banking jobs because they seemed stable and respectable. Now I’m looking at tech startups and consulting firms instead.",
    name: "Layan",
    meta: "18 · Egypt",
    initial: "L",
  },
];

export const Students = () => (
  <DayPage>
    <main>
      <PageHero
        eyebrow="For Students"
        title="Your CORE assessment:"
        accent="a map for exploration."
        lede="Your results are a compass, not a destiny machine. Here’s exactly what you’ll get — and how to use it to make intentional choices."
        art={PathToDawn}
        artClass="w-80 h-auto"
      />

      <Section
        eyebrow="Assessments"
        title="Start here —"
        accent="more on the way."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
          {ASSESSMENTS.map((a, i) => {
            const Icon = a.icon;
            return (
              <FadeIn key={a.name} delay={i * 0.1} className="h-full">
                <motion.article
                  whileHover={{ y: -8, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  style={{ rotate: a.tilt }}
                  className={`relative h-full flex flex-col overflow-hidden rounded-story bg-[var(--day-card)] border ${
                    a.available
                      ? "border-[#F4C660] shadow-[0_20px_52px_rgba(176,122,24,0.20)]"
                      : "border-[var(--day-line)] shadow-[0_10px_36px_rgba(42,33,24,0.07)]"
                  }`}
                >
                  {/* scenic ticket band */}
                  <div
                    className={`relative shrink-0 ${a.cover ? "h-36" : "h-28"}`}
                    style={{ background: a.band }}
                  >
                    {a.cover && (
                      <>
                        <Image
                          src={a.cover}
                          alt="The CORE world: Kai at a glowing night crossroads holding a golden compass"
                          fill
                          sizes="(min-width: 1024px) 33vw, 100vw"
                          className="absolute inset-0 w-full h-full object-cover object-[50%_58%]"
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(8,5,26,0.35) 0%, transparent 45%, rgba(8,5,26,0.45) 100%)",
                          }}
                        />
                      </>
                    )}
                    {!a.cover && (
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 320 112"
                        fill="none"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <path
                          d="M-10 88 C 60 62, 120 98, 185 62 S 290 34, 330 24"
                          stroke={
                            a.available
                              ? "rgba(244,198,96,0.9)"
                              : "rgba(109,91,168,0.35)"
                          }
                          strokeWidth="2.5"
                          strokeDasharray="0.5 9"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="185"
                          cy="62"
                          r="4"
                          fill={
                            a.available ? "#F4C660" : "rgba(109,91,168,0.45)"
                          }
                        />
                        <path
                          d="m306 30 2.2 5.4 5.4 2.2-5.4 2.2-2.2 5.4-2.2-5.4-5.4-2.2 5.4-2.2z"
                          fill={
                            a.available ? "#F4C660" : "rgba(109,91,168,0.45)"
                          }
                        />
                      </svg>
                    )}
                    <div
                      className={`absolute bottom-4 left-5 w-14 h-14 rounded-2xl flex items-center justify-center border backdrop-blur-sm ${
                        a.available
                          ? "bg-white/10 border-white/25"
                          : "bg-white/50 border-white/70"
                      }`}
                      style={{ color: a.bandInk }}
                    >
                      <Icon size={30} />
                    </div>
                    <span
                      className={`absolute top-4 right-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        a.available
                          ? "bg-[#F4C660] text-[#14101F]"
                          : "bg-white/70 text-[var(--day-ink-2)] border border-white"
                      }`}
                    >
                      {a.available ? "Available now" : "Coming soon"}
                    </span>
                  </div>

                  {/* perforated tear line */}
                  <div
                    className="relative border-t-2 border-dashed border-[var(--day-line)]"
                    aria-hidden
                  >
                    <span className="absolute -left-3.5 -top-3.5 w-7 h-7 rounded-full bg-[var(--day-bg)]" />
                    <span className="absolute -right-3.5 -top-3.5 w-7 h-7 rounded-full bg-[var(--day-bg)]" />
                  </div>

                  {/* ticket body */}
                  <div
                    className={`p-6 pt-5 flex flex-col flex-1 ${a.available ? "" : "opacity-85"}`}
                  >
                    <h3 className="font-heading text-xl font-semibold">
                      {a.name}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {a.chips.map((c) => (
                        <span
                          key={c}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${a.chipStyle}`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3.5 text-[15px] text-[var(--day-ink-2)] leading-relaxed flex-1">
                      {a.body}
                    </p>
                    {a.available ? (
                      <div className="mt-6">
                        <GoldButton
                          href="/start"
                          data-testid="assessment-cta-core"
                        >
                          Take the Assessment
                        </GoldButton>
                      </div>
                    ) : (
                      <p className="mt-6 text-xs text-[var(--day-ink-3)]">
                        Unlocks after your CORE results.
                      </p>
                    )}
                  </div>
                </motion.article>
              </FadeIn>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow="What you’ll get"
        title="Three deliverables,"
        accent="all yours."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {GET.map((g, i) => (
            <FadeIn key={g.title} delay={i * 0.1}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <IconChip icon={g.icon} color={g.accent} />
                  <span className="text-xs uppercase tracking-widest text-[var(--day-ink-3)]">
                    {g.sub}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold">
                  {g.title}
                </h3>
                <div className="mt-4">
                  <DotList items={g.items} className="!space-y-2.5 text-sm" />
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="How to use your results"
        title="A compass,"
        accent="not a map."
        className="border-t border-[var(--day-line)]"
      >
        <div className="max-w-3xl space-y-4">
          {USE.map((u, i) => (
            <FadeIn key={u.title} delay={i * 0.05}>
              <div className="rounded-2xl bg-[var(--day-card)] border border-[var(--day-line)] px-6 py-5">
                <h3 className="font-heading font-semibold text-[#B07A18]">
                  {u.title}
                </h3>
                <p className="mt-1.5 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                  {u.body}
                </p>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={0.2}>
            <KaiChip tone="day" className="mt-6">
              Don’t try to act on all five at once. Pick the one that unlocks
              your next real decision — usually your major or your first
              internship — and start there.
            </KaiChip>
          </FadeIn>
        </div>
      </Section>

      <Section
        eyebrow="Two honest answers"
        title="Surprised? Sharing?"
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FadeIn>
            <Card className="h-full">
              <h3 className="font-heading text-xl font-semibold">
                What if my results surprise me?
              </h3>
              <p className="mt-3 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                That’s actually valuable information. Sometimes we’ve been
                thinking of ourselves in limited ways — or been told what we
                should want. Read your full narrative report carefully; your
                archetype might show why a career suits you differently than
                others in the same field. If something still doesn’t feel right,
                retake the assessment anytime. Interests shift as you grow —
                that’s healthy.
              </p>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Card className="h-full">
              <h3 className="font-heading text-xl font-semibold">
                Can I share my results with my parents?
              </h3>
              <p className="mt-3 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                Yes — in fact, we encourage it. The result card is designed to
                be shareable, and we include a family guide for talking about
                the results together. If your results surprise them (or you),
                that’s an opportunity for conversation: show them what each
                pillar measures and the research behind it. This isn’t telling
                you what to do — it’s helping you understand yourself so you can
                choose intentionally.
              </p>
            </Card>
          </FadeIn>
        </div>
      </Section>

      <Section
        eyebrow="Student experiences"
        title="In their own"
        accent="words."
        className="border-t border-[var(--day-line)]"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.1}>
              <figure className="h-full flex flex-col justify-between gap-6 bg-[var(--day-card)] border border-[var(--day-line)] rounded-story p-7 shadow-[0_10px_36px_rgba(42,33,24,0.06)]">
                <blockquote className="text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                  “{s.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-aurora flex items-center justify-center font-heading font-bold text-sm text-[#14101F]">
                    {s.initial}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-[#6D5BA8]">{s.meta}</p>
                  </div>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </Section>
    </main>
  </DayPage>
);
