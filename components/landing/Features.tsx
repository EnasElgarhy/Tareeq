"use client";

import { motion } from "framer-motion";
import {
  ChatsCircle,
  Compass,
  Brain,
  ClockCounterClockwise,
  ListChecks,
  BookOpen,
  MonitorPlay,
  FilmSlate,
  Buildings,
  Scales,
  UsersThree,
  TrendUp,
  type IconProps,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Container, Eyebrow, FadeIn } from "./Shared";

interface Feature {
  icon: ComponentType<IconProps>;
  title: string;
  desc: string;
  color: string;
}

const features: Feature[] = [
  { icon: ChatsCircle, title: "AI Assessment", desc: "A conversation that actually listens", color: "text-[#6E48E4]" },
  { icon: Compass, title: "Career Compass", desc: "Your strengths, beautifully mapped", color: "text-[#F4C660]" },
  { icon: Brain, title: "AI Coach", desc: "Kai, always in your corner", color: "text-[#E07A6F]" },
  { icon: ClockCounterClockwise, title: "Memory", desc: "Every session builds on the last", color: "text-[#2FA98C]" },
  { icon: ListChecks, title: "Personal Plans", desc: "Small steps toward big futures", color: "text-[#F4C660]" },
  { icon: BookOpen, title: "Books", desc: "Reads chosen for how you think", color: "text-[#E07A6F]" },
  { icon: MonitorPlay, title: "Courses", desc: "Learn by doing, at your pace", color: "text-[#2FA98C]" },
  { icon: FilmSlate, title: "Videos", desc: "Short, real, worth your time", color: "text-[#6E48E4]" },
  { icon: Buildings, title: "Universities", desc: "Programs that fit your path", color: "text-[#E07A6F]" },
  { icon: Scales, title: "Career Comparison", desc: "See paths side by side, clearly", color: "text-[#2FA98C]" },
  { icon: UsersThree, title: "Family Coaching", desc: "Help them understand your dream", color: "text-[#6E48E4]" },
  { icon: TrendUp, title: "Learning Journey", desc: "Watch yourself grow over months", color: "text-[#F4C660]" },
];

export function Features() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#C8B6F0]/15 to-transparent" />
      <Container>
        <FadeIn className="max-w-2xl">
          <Eyebrow>Everything you need</Eyebrow>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
            One companion.
            <br />
            Every tool that <span className="font-display font-medium text-grad-warm">matters.</span>
          </h2>
        </FadeIn>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={f.title} delay={(i % 4) * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  data-testid={`feature-card-${i + 1}`}
                  className="h-full bg-[#FFFCF6] rounded-[1.5rem] border border-[rgba(43,36,28,0.1)] shadow-sm hover:shadow-lg transition-shadow duration-500 p-6"
                >
                  <Icon size={30} weight="duotone" className={f.color} />
                  <h3 className="mt-4 font-heading font-semibold text-[#2A2118]">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-[#5C5142] leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
