"use client";

import { CheckCircle2, ChevronLeft, Circle, CircleDot, ClipboardList, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { trackEvent } from "@/lib/analytics/track";
import { deletePlan, readPlan, updateTaskStatus } from "@/lib/kai/plans/plan-storage";
import type { KaiPlan, KaiPlanTaskStatus } from "@/lib/kai/plans/plan-types";
import type { StringKey } from "@/lib/i18n/strings";

const STATUS_CYCLE: Record<KaiPlanTaskStatus, KaiPlanTaskStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

const STATUS_ICON: Record<KaiPlanTaskStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CheckCircle2,
};

/** Detail view for one saved plan — tap a task to cycle its status
 * (not_started → in_progress → completed → back to not_started). */
export function PlanDetailScreen({ planId }: { planId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [plan, setPlan] = useState<KaiPlan | null | undefined>(undefined);

  useEffect(() => {
    setPlan(readPlan(planId) ?? null);
  }, [planId]);

  if (plan === undefined) return null;

  if (plan === null) {
    return (
      <section className="daybreak-reveal flex flex-1 flex-col items-center px-2 pt-14 lg:pt-20">
        <div className="rounded-story relative flex w-full max-w-[440px] flex-col items-center gap-4 overflow-hidden border border-[#413664] bg-[#221248] px-6 py-10 text-center text-[#FFFCF6] shadow-[0_24px_60px_rgba(34,18,72,0.22)]">
          <span className="absolute inset-x-0 top-0 h-1 bg-[#F2C94C]" aria-hidden="true" />
          <span className="grid size-14 place-items-center rounded-2xl bg-[#31205A] text-[#F2C94C]">
            <ClipboardList size={26} />
          </span>
          <p className="daybreak-heading text-[22px] leading-tight text-[#FFFCF6]">
            {t("kai.plans.not_found")}
          </p>
          <Link href="/kai/plans" className="daybreak-inverse-action inline-flex min-h-11 items-center justify-center rounded-full bg-[#FFFCF6] px-5 text-[13px] font-bold text-[#221248] hover:bg-[#F2C94C]">
            {t("nav.back")}
          </Link>
        </div>
      </section>
    );
  }

  const done = plan.tasks.filter((task) => task.status === "completed").length;
  const total = plan.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleToggle(taskId: string, currentStatus: KaiPlanTaskStatus) {
    if (!plan) return;
    const nextStatus = STATUS_CYCLE[currentStatus];
    const next = updateTaskStatus(plan.id, taskId, nextStatus);
    const updated = next.find((p) => p.id === plan.id) ?? null;
    setPlan(updated);
    if (nextStatus === "completed") trackEvent("kai_task_completed", { planId: plan.id });
  }

  function handleDelete() {
    if (!plan) return;
    if (!window.confirm(t("kai.plans.delete_confirm"))) return;
    deletePlan(plan.id);
    router.push("/kai/plans");
  }

  return (
    <section className="daybreak-reveal mx-auto flex w-full max-w-[780px] flex-1 flex-col gap-4 pb-6">
      <div className="rounded-story relative overflow-hidden border border-[#413664] bg-[#221248] p-4 text-[#FFFCF6] shadow-[0_22px_54px_rgba(34,18,72,0.2)] lg:p-5">
        <span className="absolute inset-y-0 start-0 w-1 bg-[#F2C94C]" aria-hidden="true" />
        <header className="flex items-start gap-3">
          <Link
            href="/kai/plans"
            aria-label={t("nav.back")}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[#665A80] bg-[#31205A] text-[#FFFCF6] transition hover:bg-[#41306A]"
          >
            <ChevronLeft size={17} className="rtl:rotate-180" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="daybreak-heading text-[24px] leading-tight text-[#FFFCF6] lg:text-[30px]">{plan.title}</h1>
            {plan.durationLabel ? (
              <p className="mt-1 text-[11px] font-bold uppercase text-[#F2C94C]">
                {plan.durationLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={t("kai.plans.delete_plan")}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[#665A80] bg-[#31205A] text-[#D8D0EA] transition hover:border-[#E07A6A] hover:text-[#FFD8D1]"
          >
            <Trash2 size={16} />
          </button>
        </header>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#D8D0EA]">
            <span>{t("kai.plans.progress").replace("{completed}", String(done)).replace("{total}", String(total))}</span>
            <span className="tabular-nums text-[#F2C94C]">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[#F2C94C] transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {plan.tasks.map((task) => {
          const StatusIcon = STATUS_ICON[task.status];
          const statusKey = `kai.plans.task_status.${task.status}` as StringKey;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => handleToggle(task.id, task.status)}
              className="daybreak-story-card rounded-story-alt flex min-h-[86px] items-start gap-3 p-4 text-start active:scale-[0.99]"
            >
              <StatusIcon
                size={20}
                className={`mt-0.5 shrink-0 ${task.status === "completed" ? "text-[#6D5BA8]" : "text-[color:var(--day-ink-3,#675d4e)]"}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] font-bold leading-snug ${
                    task.status === "completed"
                      ? "text-[color:var(--day-ink-3,#675d4e)] line-through"
                      : "text-[color:var(--day-ink,#2a2118)]"
                  }`}
                >
                  {task.text}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-[color:var(--day-ink-3,#675d4e)]">
                    {t(statusKey)}
                  </span>
                  {task.estimatedTime ? (
                    <span className="text-[10px] font-bold text-[color:var(--day-ink-3,#675d4e)]">· {task.estimatedTime}</span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
