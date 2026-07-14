"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import { TareeqMark } from "./Shared";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Meet Kai", href: "#meet-kai" },
  { label: "Journey", href: "#journey" },
  { label: "Stories", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 18 }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-4"
    >
      <nav
        data-testid="main-nav"
        className={`max-w-6xl mx-auto flex items-center justify-between rounded-full px-5 sm:px-7 py-3 transition-all duration-500 ${
          scrolled
            ? "bg-[#FFFCF6]/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,18,72,0.08)]"
            : "bg-transparent border border-transparent"
        }`}
      >
        <a href="#top" data-testid="nav-logo" className="flex items-center gap-2.5">
          <TareeqMark size={28} />
          <span className="font-heading text-xl font-bold tracking-tight text-[#2A2118]">Tareeq</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.href.slice(1)}`}
              className="text-sm font-medium text-[#5C5142] hover:text-[#2A2118] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#final-cta"
            data-testid="nav-cta-start"
            className="hidden sm:inline-flex rounded-full bg-[#14101F] text-[#F5EEE6] px-5 py-2.5 text-sm font-medium hover:bg-[#2B2440] transition-colors shadow-lg shadow-[#14101F]/20"
          >
            Start your journey
          </a>
          <button
            type="button"
            data-testid="nav-mobile-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="md:hidden w-10 h-10 rounded-full bg-[#FFFCF6] border border-[rgba(43,36,28,0.1)] shadow-sm flex items-center justify-center text-[#2A2118]"
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-testid="nav-mobile-menu"
            className="md:hidden max-w-6xl mx-auto mt-2 rounded-3xl bg-[#FFFCF6]/95 backdrop-blur-xl border border-white/60 shadow-xl p-6 flex flex-col gap-4"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-[#5C5142] hover:text-[#2A2118]"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#final-cta"
              onClick={() => setOpen(false)}
              className="rounded-full bg-grad-warm text-white px-5 py-3 text-center text-sm font-semibold"
            >
              Start your journey
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
