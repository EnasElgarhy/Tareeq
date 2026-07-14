"use client";

import { motion } from "framer-motion";
import { Sparkle, Play, ChatCircleDots, Compass } from "@phosphor-icons/react";
import Image from "next/image";
import { ILLUSTRATIONS, KAI_AVATAR } from "@/lib/landing-assets";
import { Container } from "./Shared";

const spring = { type: "spring" as const, stiffness: 80, damping: 18 };

const COMPASS_BARS = [
  { label: "Curiosity", width: "w-[92%]", color: "bg-[#F4C660]" },
  { label: "Creating", width: "w-[78%]", color: "bg-[#9D7FF0]" },
  { label: "Leading", width: "w-[64%]", color: "bg-[#F2A8B3]" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-[#C8B6F0]/50 via-[#F2A8B3]/40 to-[#FDE7A8]/50 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -left-40 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-[#FDE7A8]/50 via-[#F2A8B3]/30 to-[#9D7FF0]/30 blur-3xl"
        />
      </div>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <span
                data-testid="hero-badge"
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium bg-[#FFFCF6] border border-[rgba(43,36,28,0.1)] shadow-sm text-[#5C5142]"
              >
                <Sparkle size={16} weight="duotone" className="text-[#F4C660]" />
                Meet Kai, your career companion
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 }}
              data-testid="hero-headline"
              className="mt-8 font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[1.05] font-semibold text-[#2A2118]"
            >
              Discover who
              <br />
              you&rsquo;re <span className="font-display font-medium text-grad-warm">becoming.</span>
              <br />
              <span className="text-[#675D4E] font-medium">Not just what to study.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.2 }}
              className="mt-8 text-lg text-[#5C5142] leading-relaxed max-w-lg"
            >
              Kai gets to know you — your curiosity, your strengths, the way you think.
              Then Kai stays with you, guiding every step from first questions to future plans.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#final-cta"
                data-testid="hero-cta-start"
                className="rounded-full bg-grad-warm text-white px-8 py-4 font-semibold text-center hover:scale-[1.03] transition-transform shadow-lg shadow-[#FF6B3D]/30"
              >
                Start your journey
              </a>
              <a
                href="#meet-kai"
                data-testid="hero-cta-demo"
                className="rounded-full bg-[#FFFCF6] text-[#2A2118] px-8 py-4 font-medium border border-[rgba(43,36,28,0.1)] hover:border-[rgba(43,36,28,0.2)] hover:bg-white transition-all inline-flex items-center justify-center gap-2"
              >
                <Play size={18} weight="duotone" className="text-[#6E48E4]" />
                Watch demo
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-8 text-sm text-[#675D4E]/70"
            >
              Free to begin · 20 minutes · Yours for years
            </motion.p>
          </div>

          <div className="relative" data-testid="hero-visual">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.2 }}
              className="relative mx-auto max-w-md"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] shadow-[0_24px_80px_rgba(34,18,72,0.25)]"
              >
                <Image
                  src={ILLUSTRATIONS.hero}
                  alt="Kai, your AI career companion, welcoming you to a winding path of possibilities"
                  fill
                  sizes="(max-width: 768px) 90vw, 448px"
                  className="object-cover"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.6 }}
                className="absolute -left-6 sm:-left-14 top-10 bg-[#FFFCF6]/90 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_rgba(34,18,72,0.12)] rounded-3xl rounded-tl-sm px-5 py-4 max-w-[240px]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Image
                    src={KAI_AVATAR}
                    alt="Kai"
                    width={20}
                    height={20}
                    className="rounded-full object-cover object-top bg-[#FDE7A8]"
                  />
                  <span className="text-xs font-semibold text-[#675D4E]">Kai</span>
                  <ChatCircleDots size={14} weight="duotone" className="text-[#6E48E4]" />
                </div>
                <p className="text-sm text-[#2A2118] leading-snug">
                  You light up when you talk about building things. Want to explore why?
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.85 }}
                className="absolute -right-4 sm:-right-12 bottom-24 bg-[#FFFCF6]/90 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_rgba(34,18,72,0.12)] rounded-3xl px-5 py-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Compass size={16} weight="duotone" className="text-[#6E48E4]" />
                  <span className="text-xs font-semibold text-[#675D4E]">Your Compass</span>
                </div>
                <div className="space-y-2 w-40">
                  {COMPASS_BARS.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-[10px] text-[#675D4E] mb-0.5">
                        <span>{bar.label}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#EFE7DA] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${bar.color} ${bar.width}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 1.05 }}
                className="absolute left-8 -bottom-6 bg-[#FFFCF6]/90 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_rgba(34,18,72,0.12)] rounded-full px-5 py-2.5 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#6FE0C0] animate-pulse" />
                <span className="text-xs font-medium text-[#5C5142]">Compass complete · Deep Dive unlocked</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
