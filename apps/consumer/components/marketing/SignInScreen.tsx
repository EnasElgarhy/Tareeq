"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/primitives/BrandMark";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpSignIn } from "@/components/auth/OtpSignIn";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { WayArrow } from "@/components/marketing/WayIcons";
import { BRAND } from "@/lib/brand";

const KAI_PATH = "/marketing/daybreak/kai/kai-path.jpg";
/** Strong ease-out: the dawn rises fast, then settles. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function SignInScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();

  return (
    <main className="marketing-site surface-day grid min-h-dvh grid-cols-1 overflow-x-clip md:grid-cols-[1fr_1fr] lg:grid-cols-[1.05fr_1fr]">
      {/* Desktop: Kai's night path fills the left half. */}
      <section className="relative hidden overflow-hidden bg-[#08051A] md:block">
        <Image
          src={KAI_PATH}
          alt={t("auth.signin.kai_alt")}
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 50vw"
          className="object-cover object-[50%_30%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,5,26,0.5)_0%,transparent_40%,rgba(8,5,26,0.7)_100%)]"
        />
        <Link href="/" className="absolute start-8 top-8 flex items-center gap-2">
          <BrandMark tone="aurora" height={24} />
          <span className="font-heading text-xl font-bold text-[#F5EEE6]">
            {BRAND.name}
          </span>
        </Link>
        <KaiQuote className="absolute bottom-12 end-8 start-8" />
      </section>

      <section className="relative flex min-h-dvh flex-col bg-[#08051A] text-[color:var(--day-ink)] md:bg-[color:var(--day-bg)] md:px-6">
        {/* Phone: the same night path, cropped to Kai, above the form. */}
        <div className="relative h-[54svh] min-h-[320px] max-h-[500px] overflow-hidden md:hidden">
          <Image
            src={KAI_PATH}
            alt={t("auth.signin.kai_alt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[30%_8%] rtl:-scale-x-100"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,5,26,0.7)_0%,rgba(8,5,26,0)_30%,rgba(8,5,26,0)_55%,rgba(8,5,26,0.75)_100%)]"
          />
          <KaiQuote className="absolute bottom-16 end-6 start-[42%] text-end" compact />
        </div>

        {/* Back sits on the start side, as in the assessment flow, so its
            arrow points out the way the visitor came in. */}
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-[max(env(safe-area-inset-top),1.5rem)] md:static md:px-0">
          <Link
            href="/"
            className="-ms-2 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-[#F5EEE6]/80 transition-colors duration-150 hover:text-[#F5EEE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C660] md:text-[color:var(--day-ink-3)] md:hover:text-[color:var(--day-ink)] md:focus-visible:ring-[#6D5BA8]"
          >
            <span className="inline-flex rotate-180 rtl:rotate-0">
              <WayArrow size={15} />
            </span>
            {t("auth.signin.back")}
          </Link>
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <BrandMark tone="aurora" height={20} />
            <span className="font-heading text-lg font-bold text-[#F5EEE6]">
              {BRAND.name}
            </span>
          </Link>
        </header>

        {/* The form is the dawn: on phones it rises over the night scene
            with a curved, gold-lit horizon for its top edge. */}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="relative -mt-12 flex flex-1 flex-col bg-[color:var(--day-bg)] px-6 pb-[max(env(safe-area-inset-bottom),2.5rem)] pt-4 md:mt-0 md:items-center md:justify-center md:bg-transparent md:px-0 md:py-16"
        >
          <Horizon />
          <div className="relative w-full max-w-sm self-center">
            <h1 className="font-heading text-[2rem] font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              {t("auth.signin.title")}
            </h1>
            <p className="mb-7 mt-2 text-[15px] leading-relaxed text-[color:var(--day-ink-2)] md:mb-8 md:mt-3">
              {t("auth.signin.subtitle")}
            </p>

            <OtpSignIn variant="daybreak" onSignedIn={() => router.replace("/home")} />

            <p className="mt-8 border-t border-[color:var(--day-line)] pt-6 text-sm text-[color:var(--day-ink-2)]">
              {t("auth.signin.new_here")}{" "}
              <Link
                href="/start"
                className="font-semibold text-[#6D5BA8] underline decoration-[#6D5BA8]/30 underline-offset-4 transition-colors duration-150 hover:decoration-[#6D5BA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5BA8]"
              >
                {t("auth.signin.start")}
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function KaiQuote({ className, compact = false }: { className: string; compact?: boolean }) {
  const { t } = useLocale();
  return (
    <figure className={className}>
      <blockquote
        className={`font-hand text-balance leading-snug text-[#F5EEE6] [text-shadow:0_2px_16px_rgba(8,5,26,0.6)] ${
          compact ? "text-[1.35rem]" : "max-w-[18ch] text-3xl"
        }`}
      >
        {t("auth.signin.kai_quote")}
      </blockquote>
      <figcaption className="mt-1.5 text-sm text-[#F5EEE6]/60">
        {t("auth.signin.kai_name")}
      </figcaption>
    </figure>
  );
}

/**
 * The phone layout's top edge: a shallow curve of the day colour rising
 * over the night scene, with a thin gold line glowing along it.
 */
function Horizon() {
  const curve = "M0 40 Q200 0 400 40";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 -top-[39px] h-10 w-full md:hidden"
    >
      <path d={`${curve} Z`} fill="var(--day-bg)" />
      <path
        d={curve}
        fill="none"
        stroke="#F4C660"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className="[filter:drop-shadow(0_0_6px_rgba(244,198,96,0.75))]"
      />
    </svg>
  );
}
