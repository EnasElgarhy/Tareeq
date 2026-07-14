"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ILLUSTRATIONS } from "@/lib/landing-assets";
import { Container, Eyebrow, FadeIn } from "./Shared";

const steps = [
  {
    img: ILLUSTRATIONS.discover,
    alt: "Chapter 1 — Kai gathering the floating pieces of your inner world into a glowing journal",
    step: "01",
    title: "Discover yourself",
    body: "A conversation, not a quiz. Kai listens to how you think, what excites you, and what you quietly care about.",
    tint: "hover:bg-gradient-to-br hover:from-[#FFFCF6] hover:to-[#FDE7A8]/30",
  },
  {
    img: ILLUSTRATIONS.compass,
    alt: "Chapter 2 — Kai weaving golden threads that connect your interests into a constellation map",
    step: "02",
    title: "Understand your strengths",
    body: "Your Compass turns everything Kai learned into a living picture of you — motivations, strengths, and the ways you love to learn.",
    tint: "hover:bg-gradient-to-br hover:from-[#FFFCF6] hover:to-[#C8B6F0]/25",
  },
  {
    img: ILLUSTRATIONS.grow,
    alt: "Chapter 3 — Kai walking the glowing road with a lantern toward future destinations",
    step: "03",
    title: "Grow with Kai",
    body: "This is where it really begins. Kai remembers you, checks in, and guides you through majors, plans and possibilities for months.",
    tint: "hover:bg-gradient-to-br hover:from-[#FFFCF6] hover:to-[#F2A8B3]/25",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <Container>
        <FadeIn className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
            Three steps.
            <br />
            One lifelong <span className="font-display font-medium text-grad-warm">direction.</span>
          </h2>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => (
            <FadeIn key={s.step} delay={i * 0.12}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                data-testid={`how-card-${i + 1}`}
                className={`h-full bg-[#FFFCF6] rounded-[2rem] border border-[rgba(43,36,28,0.1)] shadow-sm hover:shadow-xl transition-shadow duration-500 overflow-hidden ${s.tint}`}
              >
                <div className="relative aspect-square mx-4 mt-4 overflow-hidden rounded-[1.6rem]">
                  <Image src={s.img} alt={s.alt} fill sizes="(max-width: 768px) 90vw, 380px" className="object-cover" />
                </div>
                <div className="p-8">
                  <span className="text-xs font-semibold tracking-[0.2em] text-[#675D4E]/50">{s.step}</span>
                  <h3 className="mt-2 font-heading text-2xl font-semibold text-[#2A2118]">{s.title}</h3>
                  <p className="mt-3 text-[#5C5142] leading-relaxed">{s.body}</p>
                </div>
              </motion.article>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
