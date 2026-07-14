"use client";

import { FilePdf, X, Check } from "@phosphor-icons/react";
import { Container, Eyebrow, FadeIn } from "./Shared";

const withoutItems = ["One personality test", "A PDF report", "Filed away. Forgotten."];
const withItems = [
  "A living assessment that evolves",
  "An AI coach who remembers you",
  "Action plans that adapt weekly",
  "Books, courses & videos picked for you",
  "Answers for family conversations",
  "Growth that compounds for years",
];

export function Comparison() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <FadeIn className="max-w-2xl mx-auto text-center mb-16">
          <Eyebrow>Everything becomes personal</Eyebrow>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
            A test ends.
            <br />A relationship <span className="font-display font-medium text-grad-warm">grows.</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto items-stretch">
          <FadeIn data-testid="comparison-without">
            <div className="h-full rounded-[2rem] bg-[#EFE7DA] border border-[rgba(43,36,28,0.1)] p-8 sm:p-10">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFCF6] border border-[rgba(43,36,28,0.1)] flex items-center justify-center mb-6">
                <FilePdf size={24} weight="duotone" className="text-[#675D4E]/60" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-[#675D4E]">Without Tareeq</h3>
              <p className="mt-2 text-sm text-[#675D4E]/70">The old way of &ldquo;career guidance&rdquo;</p>
              <ul className="mt-8 space-y-4">
                {withoutItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#675D4E]">
                    <X size={16} className="text-[#675D4E]/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-sm italic text-[#675D4E]/70">&ldquo;You&rsquo;re an ENFP. Good luck out there.&rdquo;</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} data-testid="comparison-with">
            <div className="h-full rounded-[2rem] bg-night-gradient border border-[#9D7FF0]/30 p-8 sm:p-10 shadow-[0_24px_80px_rgba(34,18,72,0.35)]">
              <div className="w-12 h-12 rounded-2xl bg-aurora flex items-center justify-center mb-6 shadow-md">
                <span className="w-3 h-3 rounded-full bg-[#F5EEE6]" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-[#F5EEE6]">With Tareeq</h3>
              <p className="mt-2 text-sm text-[#C8B6F0]">A companion for who you&rsquo;re becoming</p>
              <ul className="mt-8 space-y-4">
                {withItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#F5EEE6]/90">
                    <Check size={16} weight="bold" className="text-[#F4C660] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-sm italic text-[#F5EEE6]/60">&ldquo;Eight months in, and Kai still surprises me.&rdquo;</p>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
