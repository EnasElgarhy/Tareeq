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
    <section className="flex flex-1 flex-col gap-4 pb-4">
      <header className="pt-1">
        <h1 className="text-[26px] font-black leading-tight text-[color:var(--day-ink)]">{t("kai.plans.title")}</h1>
        <p className="mt-0.5 text-[13px] text-[color:var(--day-ink-2)]">{t("kai.plans.subtitle")}</p>
      </header>

      {plans.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 text-center">
          <span className="grid size-16 place-items-center rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-card)] text-violet shadow-[var(--day-shadow-card)]">
            <ActionPlanIcon size={26} />
          </span>
          <div className="grid gap-1.5">
            <h2 className="text-[18px] font-black text-[color:var(--day-ink)]">{t("kai.plans.empty_title")}</h2>
            <p className="mx-auto max-w-[32ch] text-[13px] leading-relaxed text-[color:var(--day-ink-2)]">
              {t("kai.plans.empty_description")}
            </p>
          </div>
          <Link href="/kai" className="btn-v2 btn-v2--primary" data-size="lg">
            {t("kai.plans.empty_cta")}
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {plans.map((plan) => {
            const { done, total } = completionOf(plan);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={plan.id}
                href={`/kai/plans/${plan.id}`}
                className="flex items-center gap-3 rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] transition active:scale-[0.99]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet/10 text-violet">
                  <ActionPlanIcon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">
                    {plan.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--day-ink-3,#675d4e)]">
                    {t("kai.plans.progress").replace("{completed}", String(done)).replace("{total}", String(total))}
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[color:var(--day-inset,#efe7da)]">
                    <div className="h-full rounded-full bg-violet transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[color:var(--day-ink-3,#675d4e)]" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
