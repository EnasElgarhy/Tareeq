import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { Logo } from "@/components/primitives/Logo";

const STATS: ReadonlyArray<[string, string]> = [
  ["12 min", "to finish"],
  ["60", "questions"],
  ["1", "clear path"],
];

export default function MarketingPage() {
  return (
    <main className="surface-cream min-h-dvh">
      {/* Top nav */}
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 md:px-10 lg:px-16 lg:py-8"
      >
        <Logo asLink width={132} />
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/product"
            className="text-subhead text-ink/70 transition hover:text-ink"
          >
            Product
          </Link>
          <Link
            href="/research"
            className="text-subhead text-ink/70 transition hover:text-ink"
          >
            Research
          </Link>
          <Link
            href="/about"
            className="text-subhead text-ink/70 transition hover:text-ink"
          >
            About
          </Link>
        </div>
        <Link href="/start" className="md:ml-4">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </nav>

      {/* Hero — editorial composition: huge headline, single coral CTA */}
      <section
        aria-labelledby="hero-heading"
        className="mx-auto grid max-w-[1320px] gap-12 px-5 pb-16 pt-6 md:px-10 md:pb-24 md:pt-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-16 lg:pb-32"
      >
        <div className="flex flex-col justify-center">
          <Badge tone="brand" withDot className="mb-6 w-fit">
            CORE model · v4
          </Badge>

          <h1
            id="hero-heading"
            className="text-[clamp(2.5rem,1.4rem+5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.015em] text-ink"
          >
            Discover what
            <br />
            you&rsquo;re{" "}
            <span
              className="relative inline-block whitespace-nowrap text-coral"
              aria-hidden="false"
            >
              built for.
              <span
                aria-hidden="true"
                className="absolute -end-2 top-2 size-3 rounded-full bg-cyan-brand shadow-[0_0_18px_rgba(91,214,232,0.7)] md:size-4"
              />
            </span>
          </h1>

          <p className="mt-7 max-w-[44ch] text-[clamp(1.05rem,1rem+0.3vw,1.25rem)] leading-relaxed text-ink/72">
            12 minutes. 60 questions. One clear path. A career-discovery compass
            for youth in MENA, grounded in the CORE model.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/start">
              <Button
                variant="primary"
                size="xl"
                iconRight={<ArrowRight aria-hidden size={20} strokeWidth={2.4} />}
              >
                Take the assessment
              </Button>
            </Link>
            <p className="text-body-sm text-ink/56">
              Free <span aria-hidden="true">·</span> No login required to start
            </p>
          </div>

          {/* Stat row — editorial rhythm, not a card grid */}
          <dl className="mt-14 grid grid-cols-3 gap-x-6 gap-y-2 border-t border-mist pt-8 md:max-w-[36rem]">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <dt className="text-caption text-ink/56">{label}</dt>
                <dd className="mt-1 text-h2 text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Plum gradient poster — preview of the immersive surface */}
        <aside
          aria-hidden="true"
          className="surface-plum relative hidden h-[560px] w-full overflow-hidden rounded-xl shadow-xl lg:block"
        >
          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div className="flex items-start justify-between">
              <Logo tone="cream" width={120} />
              <Badge tone="on-dark" withDot>
                Live preview
              </Badge>
            </div>

            <div className="flex flex-col items-center gap-7 self-center">
              <div className="tareeq-avatar-card">
                <svg viewBox="0 0 80 80" aria-hidden="true">
                  <path
                    d="M40 8c14 0 26 11 26 26v8c0 11-9 22-26 22S14 53 14 42v-8C14 19 26 8 40 8Z"
                    fill="#F5EEE6"
                  />
                  <path
                    d="M14 32c0-14 12-24 26-24s26 10 26 24"
                    stroke="#1B0E3F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="32" cy="30" r="2.4" fill="#0F0824" />
                  <circle cx="48" cy="30" r="2.4" fill="#0F0824" />
                  <path
                    d="M32 47 Q40 52 48 47"
                    stroke="#0F0824"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="60" cy="50" r="2" fill="#5BD6E8" />
                </svg>
              </div>

              <div className="tareeq-bubble max-w-[320px]">
                <p className="tareeq-bubble__q">
                  When you finish something you&rsquo;re proud of, what
                  surprises you about how you did it?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-caption text-cream/60">
                Pillar · About you
              </p>
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-coral shadow-[0_0_14px_rgba(255,107,71,0.7)]" />
                <span className="text-body-sm text-cream/70 tabular-nums">
                  03 / 60
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Trust strip */}
      <section
        aria-labelledby="trust-heading"
        className="border-t border-mist bg-white/60"
      >
        <div className="mx-auto max-w-[1320px] px-5 py-10 md:px-10 lg:px-16">
          <h2
            id="trust-heading"
            className="text-caption text-ink/50"
          >
            Grounded in research
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-h3 text-ink">Built on the CORE model</p>
              <p className="mt-2 text-body text-ink/64">
                Curiosity, Output, Rewards, Environments — four pillars that map
                how you actually work, not how you self-describe.
              </p>
            </div>
            <div>
              <p className="text-h3 text-ink">For Gen Z, with parents in mind</p>
              <p className="mt-2 text-body text-ink/64">
                Share-native results for the student. Evidence-led full report
                for the family.
              </p>
            </div>
            <div>
              <p className="text-h3 text-ink">Arabic-first, mobile-first</p>
              <p className="mt-2 text-body text-ink/64">
                Designed for the phone, with full RTL and Arabic narration
                baked in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-mist">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-4 px-5 py-8 text-body-sm text-ink/56 md:flex-row md:items-center md:px-10 lg:px-16">
          <p>© Tareeq 2026 · A career compass for the next path.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-ink">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
