import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TareeqWordmark } from "@/components/assessment/TareeqWordmark";

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-7 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex min-h-11 items-center justify-between">
        <TareeqWordmark />
        <span className="rounded-full border border-glass-border bg-glass px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-text-60">
          CORE v4
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center pb-4 pt-8">
        <div className="mb-5 inline-flex w-max items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-text-80">
          <span className="size-1.5 rounded-full bg-accent-orange shadow-[0_0_12px_var(--accent-orange)]" />
          Career Compass
        </div>

        <h1 className="max-w-[12ch] font-display text-[2.75rem] font-medium leading-[1.02] tracking-normal text-text-100">
          Find the work that{" "}
          <em className="bg-grad-warm bg-clip-text font-normal italic text-transparent">
            actually fits.
          </em>
        </h1>

        <p className="mt-5 max-w-[31ch] text-[1.05rem] leading-7 text-text-80">
          A mobile-first assessment for curiosity, energy, rewards, and the
          environments where you do your best work.
        </p>

        <div className="my-8 grid grid-cols-3 gap-3">
          {[
            ["44", "Prompts"],
            ["4", "Pillars"],
            ["8", "Clusters"],
          ].map(([number, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-glass-border bg-glass px-3 py-4"
            >
              <div className="font-display text-2xl font-semibold leading-none text-accent-orange">
                {number}
              </div>
              <div className="mt-1 text-[0.67rem] font-semibold uppercase tracking-[0.1em] text-text-60">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-glass-border bg-glass p-4">
          <div className="flex gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-grad-warm font-display text-xl font-bold shadow-[0_8px_24px_rgba(255,61,131,0.35)]">
              K
            </div>
            <p className="text-sm leading-6 text-text-80">
              <strong className="font-semibold text-text-100">
                Kai guides the flow.
              </strong>{" "}
              Choose what feels true. The Compass is built from your answers.
            </p>
          </div>
        </div>

        <Link
          href="/start"
          className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-grad-warm px-5 text-sm font-bold uppercase tracking-[0.04em] text-white shadow-[0_14px_40px_rgba(255,61,131,0.42)] transition active:scale-[0.99]"
        >
          Start the Assessment
          <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
        </Link>
      </section>
    </main>
  );
}
