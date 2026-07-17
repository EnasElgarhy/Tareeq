"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpSignIn } from "@/components/auth/OtpSignIn";
import { KaiOrb } from "@/components/marketing/KaiOrb";
import { WayArrow, WayCompass } from "@/components/marketing/WayIcons";

export function SignInScreen() {
  const router = useRouter();

  return (
    <main className="marketing-site surface-day grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#08051A] lg:block">
        <Image
          src="/marketing/daybreak/kai/kai-path.jpg"
          alt="Kai on a lantern-lit path at night, looking back toward the dawn"
          fill
          priority
          sizes="52vw"
          className="object-cover object-[50%_30%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,5,26,0.5)_0%,transparent_40%,rgba(8,5,26,0.58)_100%)]"
        />
        <Link
          href="/"
          className="absolute left-8 top-8 flex items-center gap-3"
        >
          <KaiOrb size={30} speed={18} />
          <span className="font-heading text-xl font-bold text-[#F5EEE6]">
            Tareeq
          </span>
        </Link>
        <div className="absolute bottom-10 left-8 right-8">
          <p className="font-hand max-w-sm text-3xl leading-snug text-[#F5EEE6]">
            Welcome back. The road remembers you.
          </p>
          <p className="mt-2 text-sm text-[#F5EEE6]/60">— Kai</p>
        </div>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center bg-[color:var(--day-bg)] px-6 py-24 text-[color:var(--day-ink)] sm:py-16">
        <Link
          href="/"
          className="absolute right-6 top-6 inline-flex items-center gap-2 text-sm text-[color:var(--day-ink-3)] transition-colors hover:text-[color:var(--day-ink)]"
        >
          <span className="inline-flex rotate-180">
            <WayArrow size={15} />
          </span>
          Back to site
        </Link>
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-2.5 lg:hidden"
        >
          <KaiOrb size={26} speed={18} />
          <span className="font-heading text-lg font-bold">Tareeq</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="w-full max-w-sm"
        >
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A4A21]">
            <span aria-hidden="true">✦</span>
            Sign in
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">
            Pick up where <span className="text-[#6D5BA8]">you left off.</span>
          </h1>
          <p className="mb-6 mt-3 text-[15px] leading-relaxed text-[color:var(--day-ink-2)]">
            Enter your email and we’ll send you a one-time verification code. No
            password needed.
          </p>

          <OtpSignIn
            variant="daybreak"
            onSignedIn={() => router.replace("/home")}
          />

          <div className="mt-6 flex items-start gap-3 rounded-story-alt border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-5 py-4">
            <span className="mt-0.5 text-[#7A4A21]">
              <WayCompass size={20} />
            </span>
            <div>
              <p className="text-sm leading-relaxed text-[color:var(--day-ink-2)]">
                New to Tareeq? Start with the assessment. Your account is linked
                to your results after verification.
              </p>
              <Link
                href="/start"
                className="mt-1 inline-flex font-semibold text-[#6D5BA8] transition-colors hover:text-[#7A4A21]"
              >
                Take the assessment
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
