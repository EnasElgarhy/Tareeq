"use client";

import { motion } from "framer-motion";
import { CheckCircle, Compass, MagnifyingGlass, Wrench, Heartbeat, Sparkle, type IconProps } from "@phosphor-icons/react";
import Image from "next/image";
import type { ComponentType } from "react";
import { ILLUSTRATIONS } from "@/lib/landing-assets";
import { Container, Eyebrow, FadeIn } from "./Shared";

interface Stage {
  icon: ComponentType<IconProps>;
  name: string;
  desc: string;
  state: "done" | "active" | "next" | "future";
  color: string;
  bg: string;
}

const stages: Stage[] = [
  { icon: Compass, name: "Compass", desc: "Your foundation. Who you are, mapped with care.", state: "done", color: "text-[#F4C660]", bg: "bg-[#FDE7A8]/40 border-[#F4C660]/40" },
  { icon: MagnifyingGlass, name: "Deep Dive", desc: "Go deeper into the paths that pulled at you.", state: "active", color: "text-[#6E48E4]", bg: "bg-[#C8B6F0]/30 border-[#9D7FF0]/40" },
  { icon: Wrench, name: "Skills Audit", desc: "See the gap between today-you and future-you.", state: "next", color: "text-[#E07A6F]", bg: "bg-[#F2A8B3]/30 border-[#F2A8B3]/50" },
  { icon: Heartbeat, name: "Career Pulse", desc: "Feel what real careers are actually like.", state: "next", color: "text-[#2FA98C]", bg: "bg-[#6FE0C0]/25 border-[#6FE0C0]/50" },
  { icon: Sparkle, name: "What's next", desc: "New modules arrive as you grow. Kai grows too.", state: "future", color: "text-[#9D7FF0]", bg: "bg-[#C8B6F0]/25 border-[#C8B6F0]/60" },
];

export function Journey() {
  return (
    <section id="journey" className="py-24 md:py-32 overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-16">
          <FadeIn>
            <Eyebrow>Your journey</Eyebrow>
            <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
              The assessment is
              <br />
              only the <span className="font-display font-medium text-grad-warm">beginning.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg text-[#5C5142] leading-relaxed lg:max-w-md">
              Tareeq unfolds over months, not minutes. Each module builds on the last — and Kai carries everything forward.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.1}>
          <div className="relative w-full max-h-[420px] aspect-[21/9] mb-16 overflow-hidden rounded-[2.5rem] shadow-[0_24px_80px_rgba(34,18,72,0.2)]">
            <Image
              src={ILLUSTRATIONS.journey}
              alt="Kai walking a winding pastel path toward a warm sunrise horizon"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </FadeIn>

        <div className="relative" data-testid="journey-timeline">
          <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-[#F4C660] via-[#9D7FF0] to-[#C8B6F0]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {stages.map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeIn key={s.name} delay={i * 0.12} data-testid={`journey-stage-${i + 1}`}>
                  <div className="relative flex lg:flex-col items-start lg:items-center gap-4 lg:text-center">
                    <div className={`relative shrink-0 w-14 h-14 rounded-2xl border ${s.bg} flex items-center justify-center shadow-sm`}>
                      <Icon size={26} weight="duotone" className={s.color} />
                      {s.state === "done" && (
                        <CheckCircle size={20} weight="fill" className="absolute -top-2 -right-2 text-[#6FE0C0] bg-[#FFFCF6] rounded-full" />
                      )}
                      {s.state === "active" && (
                        <motion.span
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-2xl border-2 border-[#9D7FF0]"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-[#2A2118] flex lg:justify-center items-center gap-1.5">
                        {s.name}
                        {s.state === "done" && <span className="text-xs text-[#2FA98C] font-body font-medium">✓ done</span>}
                        {s.state === "active" && <span className="text-xs text-[#6E48E4] font-body font-medium">in progress</span>}
                      </p>
                      <p className="mt-1 text-sm text-[#675D4E] leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
