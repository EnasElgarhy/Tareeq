"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container, FadeIn, TareeqMark } from "./Shared";

export function FinalCta() {
  return (
    <section id="final-cta" className="py-24 md:py-32">
      <Container>
        <FadeIn>
          <div className="relative overflow-hidden rounded-[3rem] px-8 py-20 sm:px-16 sm:py-28 text-center bg-night-gradient">
            <motion.div
              animate={{ x: [0, 60, -40, 0], y: [0, -40, 30, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#6E48E4]/40 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, -50, 40, 0], y: [0, 30, -40, 0] }}
              transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-tr from-[#F2A8B3]/30 to-[#F4C660]/25 blur-3xl"
            />

            <div className="relative">
              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex w-16 h-16 rounded-full bg-aurora shadow-2xl shadow-[#6E48E4]/40 items-center justify-center mb-10"
              >
                <span className="w-4 h-4 rounded-full bg-[#F5EEE6]" />
              </motion.span>

              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] font-semibold text-[#F5EEE6]">
                Ready to discover
                <br />
                who you&rsquo;re <span className="font-display font-medium text-grad-warm">becoming?</span>
              </h2>
              <p className="mt-6 text-lg text-[#F5EEE6]/70 max-w-md mx-auto leading-relaxed">
                Twenty minutes with Kai. A direction that lasts years.
              </p>
              <div className="mt-10">
                <Link
                  href="/start"
                  data-testid="final-cta-start"
                  className="inline-flex rounded-full bg-grad-warm text-white px-10 py-4 font-semibold hover:scale-105 transition-transform shadow-2xl shadow-[#FF3D83]/30"
                >
                  Start your Compass
                </Link>
              </div>
              <p className="mt-6 text-sm text-[#F5EEE6]/50">Free to begin. No credit card. Just curiosity.</p>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="pb-12 pt-4" data-testid="footer">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[rgba(43,36,28,0.1)] pt-10">
          <div className="flex items-center gap-2.5">
            <TareeqMark size={28} />
            <span className="font-heading text-lg font-bold tracking-tight text-[#2A2118]">Tareeq</span>
          </div>
          <p className="text-sm text-[#675D4E] text-center">
            Helping young people discover who they&rsquo;re becoming.
          </p>
          <p className="text-sm text-[#675D4E]">© {new Date().getFullYear()} Tareeq</p>
        </div>
      </Container>
    </footer>
  );
}
