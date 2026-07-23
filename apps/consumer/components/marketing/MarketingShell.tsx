"use client";

import { List, X } from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconDefs } from "@/components/marketing/Icons";
import { KaiOrb } from "@/components/marketing/KaiOrb";
import { Container } from "@/components/marketing/Shared";

const NAV_LINKS = [
  { label: "The Model", href: "/model" },
  { label: "Research", href: "/research" },
  { label: "For Students", href: "/students" },
  { label: "For Parents", href: "/parents" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scrolledRef = useRef(false);
  const hasMountedRef = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 24;
    if (next === scrolledRef.current) return;
    scrolledRef.current = next;
    setIsScrolled(next);
  });

  useEffect(() => {
    setIsMenuOpen(false);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  const navClassName =
    "mx-auto flex min-h-14 max-w-7xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-6 " +
    (isScrolled
      ? "border-white/10 bg-[#100A24]/85 shadow-[0_8px_32px_rgba(8,5,26,0.35)] backdrop-blur-xl"
      : "border-white/[0.07] bg-[#100A24]/55 backdrop-blur-lg");

  return (
    <div className="marketing-site relative min-h-dvh overflow-x-clip bg-[#08051A] font-body text-[#F5EEE6] antialiased">
      <div className="marketing-grain" aria-hidden="true" />
      <IconDefs />

      <motion.header
        initial={reduce ? false : { y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
      >
        <nav
          aria-label="Main navigation"
          data-testid="main-nav"
          className={navClassName}
        >
          <Link
            href="/"
            data-testid="nav-logo"
            className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
          >
            <KaiOrb size={30} speed={18} />
            <span className="font-heading text-xl font-bold text-[#F5EEE6]">
              Tareeq
            </span>
          </Link>

          <div className="hidden items-center gap-5 xl:flex 2xl:gap-7">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const linkClassName =
                "rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660] " +
                (isActive
                  ? "text-[#F4C660]"
                  : "text-[#F5EEE6]/65 hover:text-[#F5EEE6]");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={"nav-link-" + link.href.slice(1)}
                  className={linkClassName}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/signin"
              data-testid="nav-signin"
              className="hidden whitespace-nowrap rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-[#F5EEE6]/80 transition-colors hover:border-white/30 hover:text-[#F5EEE6] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660] md:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/start"
              data-testid="nav-cta-start"
              className="hidden whitespace-nowrap rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-[#14101F] shadow-lg shadow-[#F4C660]/25 transition-transform hover:scale-[1.02] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660] md:inline-flex"
            >
              Start assessment
            </Link>
            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="marketing-mobile-menu"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#F5EEE6] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660] xl:hidden"
            >
              {isMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {isMenuOpen ? (
            <motion.div
              id="marketing-mobile-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto mt-2 flex max-w-7xl flex-col gap-4 rounded-2xl border border-white/10 bg-[#100A24]/95 p-6 shadow-xl backdrop-blur-xl xl:hidden"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md text-base font-medium text-[#F5EEE6]/75 hover:text-[#F5EEE6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/signin"
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-medium text-[#F5EEE6]/85 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
              >
                Sign in
              </Link>
              <Link
                href="/start"
                className="rounded-full bg-gold-gradient px-5 py-3 text-center text-sm font-semibold text-[#14101F] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
              >
                Start assessment
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>

      {children}

      <footer className="pb-12 pt-16" data-testid="footer">
        <Container>
          <div className="grid grid-cols-1 items-start gap-8 border-t border-white/10 pt-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <KaiOrb size={26} speed={20} />
                <span className="font-heading text-lg font-bold text-[#F5EEE6]">
                  Tareeq
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#F5EEE6]/50">
                Democratizing science-based career guidance for every young
                person in the MENA region.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#F5EEE6]/60 hover:text-[#F5EEE6]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="md:text-right">
              <a
                href="mailto:support@tareek.me"
                className="text-sm text-[#C8B6F0] hover:text-[#F4C660]"
              >
                support@tareek.me
              </a>
              <p className="mt-2 text-sm text-[#F5EEE6]/40">© 2026 Tareeq</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
