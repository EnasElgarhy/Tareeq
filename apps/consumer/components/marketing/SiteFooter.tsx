"use client";

import { ArrowUp, ArrowUpRight } from "@phosphor-icons/react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { MarketingLogo } from "./MarketingLogo";
import { FOOTER_LINK_GROUPS } from "./navLinks";
import { Container } from "./Shared";

const SUPPORT_EMAIL = "support@tareek.me";

// The closing scene's lit path, continued into the footer. Lanterns sit on
// segment endpoints (viewBox units) so they land exactly on the line.
const PATH_D =
  "M1030 0 C1020 70 900 96 730 104 C560 112 430 118 320 158 C220 194 90 214 -20 226";
const VIEWBOX = { width: 1440, height: 240 };
const LANTERNS = [
  { x: 730, y: 104, delay: 0.9 },
  { x: 320, y: 158, delay: 1.4 },
] as const;

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660]";

function FooterPath() {
  const reduce = useReducedMotion();
  const draw = reduce
    ? {}
    : {
        initial: { pathLength: 0 },
        whileInView: { pathLength: 1 },
        viewport: { once: true, amount: 0.6 },
        transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-40 rtl:-scale-x-100 md:h-60"
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="footer-path" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFD895" stopOpacity="0" />
            <stop offset="0.3" stopColor="#FFD895" />
            <stop offset="1" stopColor="#F4C660" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="url(#footer-path)"
          strokeOpacity={0.18}
          strokeWidth={10}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          {...draw}
        />
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="url(#footer-path)"
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          {...draw}
        />
      </svg>
      {LANTERNS.map((lantern) => (
        <motion.span
          key={lantern.x}
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFE3A8] shadow-[0_0_14px_4px_rgba(244,198,96,0.55)]"
          style={{
            left: `${(lantern.x / VIEWBOX.width) * 100}%`,
            top: `${(lantern.y / VIEWBOX.height) * 100}%`,
          }}
          initial={reduce ? false : { opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: reduce ? 0 : lantern.delay, duration: 0.5 }}
        />
      ))}
    </div>
  );
}

export function SiteFooter() {
  const reduce = useReducedMotion();
  const { t } = useLocale();
  const wordmarkRef = useRef<HTMLParagraphElement>(null);
  const isWordmarkInView = useInView(wordmarkRef, { once: true, amount: 0.2 });

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

  return (
    <footer
      className="relative isolate z-10 -mt-24 overflow-hidden md:-mt-32"
      data-testid="footer"
    >
      <FooterPath />

      <Container className="relative pt-36 md:pt-52">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-12">
          <div className="col-span-2 md:col-span-3 lg:col-span-5">
            <Link
              href="/"
              aria-label="Tareeq home"
              className={`inline-flex items-center gap-1.5 rounded-full ${FOCUS_RING}`}
            >
              <MarketingLogo />
            </Link>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-[#F5EEE6]/60">
              {t("marketing.footer.tagline")}
            </p>
            <p className="mt-10 text-sm text-[#F5EEE6]/45">
              {t("marketing.footer.contact")}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className={`group mt-3 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] py-2.5 pe-2.5 ps-5 text-[0.9375rem] font-medium text-[#F5EEE6] transition-colors hover:border-[#F4C660]/50 hover:bg-[#F4C660]/10 active:translate-y-px ${FOCUS_RING}`}
            >
              {SUPPORT_EMAIL}
              <span className="flex size-8 items-center justify-center rounded-full bg-[#F4C660] text-[#14101F] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5">
                <ArrowUpRight size={16} weight="bold" />
              </span>
            </a>
          </div>

          {FOOTER_LINK_GROUPS.map((group, index) => (
            <nav
              key={group.key}
              aria-label={t(group.key)}
              className={
                index === FOOTER_LINK_GROUPS.length - 1
                  ? "col-span-2 sm:col-span-1 lg:col-span-2 lg:col-start-11"
                  : "lg:col-span-2"
              }
            >
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F4C660]/75 rtl:tracking-normal">
                {t(group.key)}
              </h2>
              <ul className="mt-5 space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative rounded-sm text-[0.9375rem] text-[#F5EEE6]/70 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-[#F4C660] after:transition-transform after:duration-300 hover:text-[#F5EEE6] hover:after:scale-x-100 rtl:after:origin-right ${FOCUS_RING}`}
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-20 flex items-center justify-between gap-6 border-t border-white/10 py-6 text-sm text-[#F5EEE6]/45">
          <p>{t("marketing.footer.copyright")}</p>
          <button
            type="button"
            onClick={scrollToTop}
            className={`group inline-flex items-center gap-2 rounded-full transition-colors hover:text-[#F4C660] ${FOCUS_RING}`}
          >
            {t("marketing.footer.top")}
            <ArrowUp
              size={14}
              weight="bold"
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </Container>

      {/* The wrapper stays put so it can be observed; only the glyphs rise. */}
      <p
        ref={wordmarkRef}
        aria-hidden="true"
        className="font-heading pointer-events-none -mb-[0.28em] select-none text-center text-[clamp(6.5rem,25vw,23rem)] font-bold leading-[0.9] tracking-[-0.06em] rtl:tracking-normal"
      >
        <motion.span
          className="inline-block text-transparent [background-clip:text] [background-image:linear-gradient(180deg,rgba(244,198,96,0.2)_5%,rgba(200,182,240,0.08)_50%,transparent_78%)]"
          initial={reduce ? false : { opacity: 0, y: "30%" }}
          animate={isWordmarkInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {t("marketing.footer.wordmark")}
        </motion.span>
      </p>
    </footer>
  );
}
