"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { Container, Eyebrow, FadeIn } from "./Shared";

interface FaqEntry {
  q: string;
  a: string;
}

const faqs: FaqEntry[] = [
  {
    q: "What exactly is the Compass assessment?",
    a: "It's a 20-minute interactive conversation with Kai — not a multiple-choice quiz. Kai explores your motivations, personality, learning style, curiosity and work preferences. The result is a living profile that keeps evolving as you grow.",
  },
  {
    q: "How is Kai different from ChatGPT?",
    a: "Kai remembers you. Every conversation builds on your assessment, your goals and your history together. Kai doesn't give generic answers — it gives answers about you, shaped by months of context.",
  },
  {
    q: "Is Tareeq only for students who don't know what they want?",
    a: "Not at all. Even if you're sure of your path, Kai helps you pressure-test it, compare programs, build skills early and prepare for university. Certainty deserves a plan too.",
  },
  {
    q: "Can parents be involved?",
    a: "Yes — in the way you choose. Kai can help you explain your path to your family with real data, and family coaching sessions help everyone get on the same page without the pressure.",
  },
  {
    q: "How long does the journey take?",
    a: "The Compass takes about 20 minutes. But Tareeq is designed for months of growth — Deep Dive, Skills Audit, Career Pulse, and new modules keep unfolding as you do.",
  },
  {
    q: "Is my data private?",
    a: "Completely. Your conversations with Kai belong to you. We never sell your data, and you can export or delete everything at any time.",
  },
];

function FaqItem({
  faq,
  i,
  open,
  onToggle,
}: {
  faq: FaqEntry;
  i: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[rgba(43,36,28,0.1)]">
      <button
        type="button"
        onClick={onToggle}
        data-testid={`faq-item-${i + 1}`}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-6 text-left group"
      >
        <span className="font-heading text-lg font-semibold text-[#2A2118] group-hover:text-[#6E48E4] transition-colors">
          {faq.q}
        </span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <Plus size={20} className="text-[#675D4E]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[#5C5142] leading-relaxed max-w-2xl">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="faq" className="py-24 md:py-32">
      <Container>
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold text-[#2A2118]">
              Good questions.
              <br />
              Honest <span className="font-display font-medium text-grad-warm">answers.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="border-t border-[rgba(43,36,28,0.1)]">
              {faqs.map((faq, i) => (
                <FaqItem key={i} faq={faq} i={i} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
              ))}
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
