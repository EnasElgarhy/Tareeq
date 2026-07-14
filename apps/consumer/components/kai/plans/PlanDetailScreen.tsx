"use client";

import { CheckCircle2, ChevronLeft, Circle, CircleDot, Trash2 } from "lucide-react";
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
      <section className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
        <p className="text-[14px] font-bold text-[color:var(--day-ink,#2a2118)]">{t("kai.plans.not_found")}</p>
        <Link href="/kai/plans" className="btn-v2 btn-v2--primary" data-size="md">
          {t("nav.back")}
        </Link>
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
    <section className="flex flex-1 flex-col gap-4 pb-4">
      <header className="flex items-start gap-2 pt-1">
        <Link
          href="/kai/plans"
          aria-label={t("nav.back")}
          className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-[color:var(--day-line)] text-[color:var(--day-ink-2)]"
        >
          <ChevronLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-black leading-tight text-[color:var(--day-ink)]">{plan.title}</h1>
          {plan.durationLabel ? (
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3)]">
              {plan.durationLabel}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={t("kai.plans.delete_plan")}
          className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-[color:var(--day-line)] text-[color:var(--day-ink-3)] transition hover:bg-[color:var(--day-inset)] hover:text-error"
        >
          <Trash2 size={15} />
        </button>
      </header>

      <div>
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[color:var(--day-ink-3)]">
          <span>{t("kai.plans.progress").replace("{completed}", String(done)).replace("{total}", String(total))}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[color:var(--day-inset,#efe7da)]">
          <div className="h-full rounded-full bg-violet transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-2">
        {plan.tasks.map((task) => {
          const StatusIcon = STATUS_ICON[task.status];
          const statusKey = `kai.plans.task_status.${task.status}` as StringKey;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => handleToggle(task.id, task.status)}
              className="flex items-start gap-3 rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 text-start shadow-[0_8px_20px_rgba(43,36,28,0.05)] transition active:scale-[0.99]"
            >
              <StatusIcon
                size={20}
                className={`mt-0.5 shrink-0 ${task.status === "completed" ? "text-violet" : "text-[color:var(--day-ink-3,#675d4e)]"}`}
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
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
