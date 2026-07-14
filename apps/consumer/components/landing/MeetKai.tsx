"use client";

import { useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GraduationCap, MapTrifold, UsersThree, type IconProps } from "@phosphor-icons/react";
import Image from "next/image";
import { KAI_AVATAR } from "@/lib/landing-assets";
import { Container, Eyebrow, FadeIn } from "./Shared";

type ConversationMessage =
  | { from: "user"; text: string }
  | { from: "kai"; text: string }
  | { from: "kai"; card: { title: string; lines: string[] } };

interface ConversationTopic {
  label: string;
  icon: ComponentType<IconProps>;
  messages: ConversationMessage[];
}

const conversations: Record<string, ConversationTopic> = {
  majors: {
    label: "Comparing majors",
    icon: MapTrifold,
    messages: [
      { from: "user", text: "I can't decide between computer science and industrial design. They feel so different." },
      {
        from: "kai",
        text: "They're less different for you than you'd think. Remember your Deep Dive? You love solving problems people can touch. Let me show you how each path gets you there — and where they overlap in human-computer interaction.",
      },
      {
        from: "kai",
        card: {
          title: "CS vs. Industrial Design",
          lines: ["Overlap: HCI, product design, prototyping", "Your fit: 87% design thinking, 74% systems", "3 hybrid programs near you"],
        },
      },
    ],
  },
  plan: {
    label: "Action plans",
    icon: GraduationCap,
    messages: [
      { from: "user", text: "Okay, I want to seriously explore product design. Where do I start?" },
      { from: "kai", text: "Love this energy. I built you a 6-week starter plan — small steps, nothing overwhelming. We'll check in every Sunday." },
      {
        from: "kai",
        card: {
          title: "Your 6-week plan",
          lines: ["Week 1 · Watch: 'Design is storytelling'", "Week 2 · Read: The Design of Everyday Things", "Week 3 · Redesign one app screen you use daily"],
        },
      },
    ],
  },
  family: {
    label: "Family questions",
    icon: UsersThree,
    messages: [
      { from: "user", text: "My dad thinks design isn't a 'real career'. I don't know how to talk to him about it." },
      {
        from: "kai",
        text: "That conversation matters, and you don't have to have it alone. Here's what the path actually looks like — salaries, demand, real companies hiring. Want me to help you put it in words he'll connect with?",
      },
      {
        from: "kai",
        card: {
          title: "Talking points for family",
          lines: ["Design roles grew 23% in the region", "Median salary above engineering avg by year 5", "Companies hiring: airlines, banks, ministries"],
        },
      },
    ],
  },
  resources: {
    label: "Learning resources",
    icon: BookOpen,
    messages: [
      { from: "user", text: "Got a free weekend. Anything I should dive into?" },
      { from: "kai", text: "Perfect timing — you finished the storytelling module last week, so you're ready for this. Picked these because you learn best by doing:" },
      {
        from: "kai",
        card: {
          title: "Picked for you",
          lines: ["Course · Intro to Figma (4 hrs, hands-on)", "Video · How Duolingo designs delight", "Book · Creative Confidence — ch. 3 first"],
        },
      },
    ],
  },
};

function Bubble({ m, i }: { m: ConversationMessage; i: number }) {
  const isCard = "card" in m;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + i * 0.18, type: "spring", stiffness: 120, damping: 18 }}
      className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
    >
      {isCard ? (
        <div className="bg-white/[0.06] border border-[#9D7FF0]/30 rounded-3xl rounded-tl-sm px-6 py-5 max-w-[85%]">
          <p className="text-sm font-semibold text-[#C8B6F0] mb-2">{m.card.title}</p>
          <ul className="space-y-1.5">
            {m.card.lines.map((l) => (
              <li key={l} className="text-sm text-[#F5EEE6]/80 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#F4C660] shrink-0" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      ) : m.from === "kai" ? (
        <div className="bg-[#221248] text-[#F5EEE6] rounded-3xl rounded-tl-sm px-6 py-4 max-w-[85%]">
          <p className="text-[15px] leading-relaxed">{m.text}</p>
        </div>
      ) : (
        <div className="bg-gold-gradient text-[#14101F] rounded-3xl rounded-tr-sm px-6 py-4 max-w-[80%]">
          <p className="text-[15px] leading-relaxed font-medium">{m.text}</p>
        </div>
      )}
    </motion.div>
  );
}

export function MeetKai() {
  const [active, setActive] = useState("majors");
  const convo = conversations[active]!;

  return (
    <section id="meet-kai" className="py-24 md:py-32 relative overflow-hidden bg-night-gradient">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, -30, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 right-0 w-[30rem] h-[30rem] rounded-full bg-[#6E48E4]/25 blur-3xl"
        />
        <div className="absolute bottom-0 -left-32 w-[26rem] h-[26rem] rounded-full bg-[#F2A8B3]/10 blur-3xl" />
      </div>
      <Container className="relative">
        <FadeIn className="max-w-2xl mx-auto text-center">
          <Eyebrow dark>Meet Kai</Eyebrow>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#F5EEE6]">
            Not a chatbot.
            <br />A guide who <span className="font-display font-medium text-[#F4C660]">knows you.</span>
          </h2>
          <p className="mt-6 text-lg text-[#F5EEE6]/70 leading-relaxed">
            Kai remembers your story — every strength, every doubt, every dream you&rsquo;ve shared.
            So every answer she gives is really about <em>you</em>.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-14 max-w-2xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Object.entries(conversations).map(([key, c]) => {
              const Icon = c.icon;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setActive(key)}
                  data-testid={`kai-tab-${key}`}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active === key
                      ? "bg-gold-gradient text-[#14101F] shadow-lg shadow-[#F4C660]/20"
                      : "bg-white/[0.06] text-[#F5EEE6]/80 border border-white/10 hover:border-white/25"
                  }`}
                >
                  <Icon size={16} weight="duotone" />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div
            data-testid="kai-chat-window"
            className="bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_24px_80px_rgba(8,5,26,0.6)] rounded-[2rem] p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 pb-5 border-b border-white/10 mb-6">
              <Image
                src={KAI_AVATAR}
                alt="Kai"
                width={40}
                height={40}
                className="rounded-full object-cover object-top bg-[#FDE7A8] shadow-md"
              />
              <div>
                <p className="font-semibold text-[#F5EEE6] text-sm">Kai</p>
                <p className="text-xs text-[#6FE0C0] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6FE0C0]" /> Remembers 8 months of your journey
                </p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 min-h-[320px]"
              >
                {convo.messages.map((m, i) => (
                  <Bubble key={i} m={m} i={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
