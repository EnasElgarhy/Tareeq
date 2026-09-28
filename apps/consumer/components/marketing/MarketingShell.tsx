"use client";

import { List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { FloatingCta } from "@/components/marketing/FloatingCta";
import { IconDefs } from "@/components/marketing/Icons";
import { MarketingLogo } from "@/components/marketing/MarketingLogo";
import {
  NAV_LINKS,
  SECONDARY_NAV_LINKS,
} from "@/components/marketing/navLinks";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export function MarketingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const hasMountedRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { locale, setLocale, ready, t } = useLocale();

  useEffect(() => {
    setIsMenuOpen(false);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  // Three zones so the bar reads balanced: brand, navigation, actions.
  const navClassName =
    "mx-auto grid min-h-[3.75rem] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-3 py-2.5 sm:px-4";

  return (
    <div className="marketing-site relative min-h-dvh overflow-x-clip bg-[#08051A] font-body text-[#F5EEE6] antialiased">
      <div className="marketing-grain" aria-hidden="true" />
      <IconDefs />

      <motion.header
        initial={reduce ? false : { y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="absolute inset-x-0 top-0 z-50 px-4 pt-4"
      >
        <nav
          aria-label="Main navigation"
          data-testid="main-nav"
          className={navClassName}
        >
          <Link
            href="/"
            aria-label="Tareeq home"
            data-testid="nav-logo"
            className="flex items-center gap-1.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
          >
            <MarketingLogo />
          </Link>

          <div className="hidden items-center justify-center gap-9 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const linkClassName =
                "relative rounded-md py-1 text-[0.9375rem] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660] " +
                (isActive
                  ? "text-[#F5EEE6]"
                  : "text-[#F5EEE6]/60 hover:text-[#F5EEE6]");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={"nav-link-" + link.href.slice(1)}
                  className={linkClassName}
                >
                  {t(link.key)}
                  {isActive ? (
                    <span
                      className="absolute -bottom-0.5 left-1/2 h-px w-5 -translate-x-1/2 bg-[#F4C660]"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3">
            {ready ? (
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                className="whitespace-nowrap rounded-full border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#F5EEE6] backdrop-blur-md transition-colors hover:border-[#F4C660]/60 hover:bg-[#F4C660]/10 hover:text-[#F4C660] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
                aria-label={
                  locale === "en" ? "Switch to Arabic" : "Switch to English"
                }
              >
                {locale === "en" ? "العربية" : "English"}
              </button>
            ) : null}
            <Link
              href="/signin"
              data-testid="nav-signin"
              className="hidden whitespace-nowrap rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-[#F5EEE6] backdrop-blur-md transition-colors hover:border-[#F4C660]/60 hover:bg-[#F4C660]/10 hover:text-[#F4C660] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660] md:inline-flex"
            >
              {t("marketing.nav.signin")}
            </Link>
            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="marketing-mobile-menu"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#F5EEE6] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660] md:hidden"
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
              className="mx-auto mt-2 flex max-w-7xl flex-col gap-4 rounded-2xl border border-white/10 bg-[#100A24]/95 p-6 shadow-xl backdrop-blur-xl md:hidden"
            >
              {[...NAV_LINKS, ...SECONDARY_NAV_LINKS].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md text-base font-medium text-[#F5EEE6]/75 hover:text-[#F5EEE6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]"
                >
                  {t(link.key)}
                </Link>
              ))}
              <Link
                href="/signin"
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-medium text-[#F5EEE6]/85 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
              >
                {t("marketing.nav.signin")}
              </Link>
              <Link
                href="/start"
                className="rounded-full bg-gold-gradient px-5 py-3 text-center text-sm font-semibold text-[#14101F] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
              >
                {t("marketing.nav.start")}
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>

      {children}

      <FloatingCta />

      <SiteFooter />
    </div>
  );
}
