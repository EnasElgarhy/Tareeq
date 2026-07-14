"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { ILLUSTRATIONS, KAI_AVATAR } from "@/lib/landing-assets";
import { Container, Eyebrow, FadeIn } from "./Shared";

function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2.2rem] border border-[rgba(43,36,28,0.12)] bg-[#FFFCF6] shadow-[0_24px_60px_rgba(34,18,72,0.15)] p-2.5 ${className}`}>
      <div className="rounded-[1.8rem] overflow-hidden">{children}</div>
    </div>
  );
}

function DarkAssessment() {
  return (
    <div className="bg-night-gradient p-6 h-full min-h-[420px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-7 h-7 rounded-full bg-aurora" />
        <span className="text-xs text-[#F5EEE6]/60">Compass · Question 12 of 24</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 mb-8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "50%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-grad-warm"
        />
      </div>
      <p className="text-[#F5EEE6] text-xl font-question leading-snug mb-6">
        When you lose track of time, what are you usually doing?
      </p>
      <div className="space-y-3 mt-auto">
        {["Building or fixing something", "Talking through big ideas", "Creating something beautiful"].map((o, i) => (
          <div
            key={o}
            className={`rounded-2xl px-4 py-3.5 text-sm ${
              i === 0
                ? "bg-[#6E48E4]/25 border border-[#9D7FF0]/50 text-[#C8B6F0]"
                : "bg-white/[0.06] text-[#F5EEE6]/70 border border-transparent"
            }`}
          >
            {o}
          </div>
        ))}
      </div>
    </div>
  );
}

const PROFILE_STATS: Array<[string, number, string]> = [
  ["Curiosity", 92, "bg-[#F4C660]"],
  ["Making things", 85, "bg-[#9D7FF0]"],
  ["Independence", 78, "bg-[#F2A8B3]"],
  ["Helping others", 71, "bg-[#6FE0C0]"],
];

function ProfileCard() {
  return (
    <div className="bg-gradient-to-br from-[#F9F4EC] via-[#FFFCF6] to-[#EFE7DA] p-6 h-full min-h-[420px]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#675D4E] mb-4">Your Compass</p>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-12 h-12 rounded-full bg-aurora shadow-md" />
        <div>
          <p className="font-heading font-semibold text-[#2A2118]">Layla, 17</p>
          <p className="text-xs text-[#675D4E]">The Curious Builder</p>
        </div>
      </div>
      {PROFILE_STATS.map(([label, v, color]) => (
        <div key={label} className="mb-4">
          <div className="flex justify-between text-xs text-[#5C5142] mb-1">
            <span>{label}</span>
            <span>{v}</span>
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${v}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${color}`}
            />
          </div>
        </div>
      ))}
      <div className="mt-6 rounded-2xl bg-white border border-[rgba(43,36,28,0.08)] p-4 shadow-sm">
        <p className="text-xs font-semibold text-[#6E48E4] mb-1">Top match today</p>
        <p className="text-sm text-[#2A2118]">Product Design · 91% fit</p>
      </div>
    </div>
  );
}

function KaiChat() {
  return (
    <div className="bg-[#FFFCF6] p-6 h-full min-h-[420px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Image src={KAI_AVATAR} alt="Kai" width={28} height={28} className="rounded-full object-cover object-top bg-[#FDE7A8]" />
        <div>
          <p className="text-xs font-semibold text-[#2A2118]">Kai</p>
          <p className="text-[10px] text-[#6FE0C0]">online</p>
        </div>
      </div>
      <div className="space-y-3 flex-1">
        <div className="bg-[#EFE7DA] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[#2A2118] max-w-[90%]">
          Hey Layla — it&rsquo;s been a week since your Figma course. How did the last project feel?
        </div>
        <div className="bg-[#221248] text-[#F5EEE6] rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[85%] ml-auto">
          Honestly? I loved it. Stayed up till 2am designing 😅
        </div>
        <div className="bg-[#EFE7DA] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[#2A2118] max-w-[90%]">
          That 2am feeling is data. Remember when coding felt like homework? This feels like play. That difference matters.
        </div>
      </div>
      <div className="mt-4 rounded-full bg-[#F9F4EC] border border-[rgba(43,36,28,0.08)] px-4 py-2.5 text-sm text-[#675D4E]/60">
        Message Kai…
      </div>
    </div>
  );
}

export function Screenshots() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <Container>
        <FadeIn className="max-w-2xl mx-auto text-center mb-16">
          <Eyebrow>A look inside</Eyebrow>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
            Designed to feel like it was
            <br />
            <span className="font-display font-medium text-grad-warm">made for you.</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start" data-testid="screenshots-grid">
          <FadeIn delay={0} className="md:mt-12">
            <PhoneFrame>
              <DarkAssessment />
            </PhoneFrame>
            <p className="mt-4 text-center text-sm text-[#675D4E]">The assessment — calm, dark, focused</p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <PhoneFrame>
              <ProfileCard />
            </PhoneFrame>
            <p className="mt-4 text-center text-sm text-[#675D4E]">Your Compass profile, always evolving</p>
          </FadeIn>
          <FadeIn delay={0.3} className="md:mt-12">
            <PhoneFrame>
              <KaiChat />
            </PhoneFrame>
            <p className="mt-4 text-center text-sm text-[#675D4E]">Kai, checking in like a real mentor</p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} className="mt-20 max-w-4xl mx-auto">
          <div className="rounded-[2rem] overflow-hidden border border-[rgba(43,36,28,0.1)] shadow-[0_24px_80px_rgba(34,18,72,0.15)] grid grid-cols-1 sm:grid-cols-2">
            <div className="relative min-h-[260px]">
              <Image
                src={ILLUSTRATIONS.learning}
                alt="Books, videos and courses orbiting Kai"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="bg-[#FFFCF6] p-8 sm:p-10 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6E48E4] font-semibold mb-3">Your learning journey</p>
              <h3 className="font-heading text-2xl font-semibold text-[#2A2118] leading-snug">
                Every book, course and video — chosen because Kai knows how you learn.
              </h3>
              <p className="mt-4 text-[#5C5142] leading-relaxed">
                No endless lists. Just the next right thing, at the right moment.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
