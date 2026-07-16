"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionPlanIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { readPlans } from "@/lib/kai/plans/plan-storage";
import type { KaiPlan } from "@/lib/kai/plans/plan-types";

function completionOf(plan: KaiPlan): { done: number; total: number } {
  return { done: plan.tasks.filter((task) => task.status === "completed").length, total: plan.tasks.length };
}

/** Lists every saved action plan (lib/kai/plans/) with a progress bar
 * per plan — the real entry point that replaced the "coming soon"
 * Action Plans tile on the Kai landing screen. */
export function PlansListScreen() {
  const { t } = useLocale();
  const [plans, setPlans] = useState<KaiPlan[] | null>(null);

  useEffect(() => {
    setPlans(readPlans());
  }, []);

  if (!plans) return null;

  return (
    <section className="daybreak-reveal mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-5 pb-6">
      <header className="pt-1 lg:pt-2">
        <h1 className="daybreak-heading text-[30px] leading-tight text-[color:var(--day-ink)] lg:text-[38px]">
          {t("kai.plans.title")}
        </h1>
        <p className="mt-1 max-w-[58ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)] lg:text-[15px]">
          {t("kai.plans.subtitle")}
        </p>
      </header>

      {plans.length === 0 ? (
        <div className="rounded-story relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden border border-[#413664] bg-[#221248] px-6 py-10 text-center text-[#FFFCF6] shadow-[0_24px_60px_rgba(34,18,72,0.22)]">
          <span className="absolute inset-x-0 top-0 h-1 bg-[#F2C94C]" aria-hidden="true" />
          <span className="grid size-16 place-items-center rounded-full border border-[#6B5A91] bg-[#31205A] text-[#F2C94C]">
            <ActionPlanIcon size={26} />
          </span>
          <div className="grid gap-1.5">
            <h2 className="daybreak-heading text-[26px] leading-tight text-[#FFFCF6]">{t("kai.plans.empty_title")}</h2>
            <p className="mx-auto max-w-[34ch] text-[13px] leading-relaxed text-[#D8D0EA]">
              {t("kai.plans.empty_description")}
            </p>
          </div>
          <Link
            href="/kai"
            className="daybreak-inverse-action inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FFFCF6] px-5 text-[13px] font-bold text-[#221248] transition hover:bg-[#F2C94C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#221248]"
          >
            {t("kai.plans.empty_cta")}
            <ArrowRight size={18} className="rtl:rotate-180" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => {
            const { done, total } = completionOf(plan);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={plan.id}
                href={`/kai/plans/${plan.id}`}
                className="daybreak-story-card rounded-story flex min-h-[132px] items-start gap-3 p-4 active:scale-[0.99]"
              >
                <span className="daybreak-icon-tile size-11">
                  <ActionPlanIcon size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col self-stretch">
                  <p className="daybreak-heading text-[16px] leading-tight text-[color:var(--day-ink,#2a2118)]">
                    {plan.title}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[color:var(--day-ink-3,#675d4e)]">
                    {t("kai.plans.progress").replace("{completed}", String(done)).replace("{total}", String(total))}
                  </p>
                  <div className="mt-auto pt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--day-inset,#efe7da)]">
                      <div className="h-full rounded-full bg-[#6D5BA8] transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-[color:var(--day-ink-3,#675d4e)] rtl:rotate-180" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
