"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionPlanIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { trackEvent } from "@/lib/analytics/track";
import type { KaiActionTask } from "@/lib/kai/chat-types";
import { createPlan } from "@/lib/kai/plans/plan-storage";

export function ActionPlanCard({
  title,
  durationLabel,
  tasks,
  onPlanSaved,
}: {
  title: string;
  durationLabel?: string;
  tasks: KaiActionTask[];
  onPlanSaved?: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  function handleSave() {
    if (savedPlanId) return savedPlanId;
    const plan = createPlan({ type: "action_plan", title: title || t("kai.chat.action_plan_fallback"), durationLabel, tasks });
    setSavedPlanId(plan.id);
    trackEvent("kai_plan_saved", { taskCount: plan.tasks.length });
    onPlanSaved?.();
    return plan.id;
  }

  function handleStart() {
    const planId = handleSave();
    router.push(`/kai/plans/${planId}`);
  }

  return (
    <div className="justify-self-start rounded-[18px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)] sm:max-w-[480px]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ background: "linear-gradient(135deg, rgba(157,127,240,0.14), rgba(110,72,228,0.06))" }}
        >
          <ActionPlanIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">
            {title || t("kai.chat.action_plan_fallback")}
          </p>
          {durationLabel ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--day-ink-3,#675d4e)]">
              {durationLabel}
            </p>
          ) : null}
        </div>
      </div>
      <ol className="grid gap-2">
        {tasks.map((task, index) => (
          <li
            key={task.id}
            className="flex items-start justify-between gap-2 rounded-[14px] bg-[color:var(--day-inset,#efe7da)] px-3 py-2.5 text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]"
          >
            <span className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-violet/15 text-[10px] font-black text-violet">
                {index + 1}
              </span>
              <span className="font-semibold text-[color:var(--day-ink,#2a2118)]">{task.text}</span>
            </span>
            {task.estimatedTime ? (
              <span className="shrink-0 rounded-full bg-[color:var(--day-card,#fffcf6)] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em] text-[color:var(--day-ink-3,#675d4e)]">
                {task.estimatedTime}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-2">
        {savedPlanId ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet">
            <CheckCircle2 size={14} />
            {t("kai.chat.action_plan_saved")}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-[color:var(--day-line,rgba(43,36,28,0.1))] px-3 py-1.5 text-[11px] font-bold text-[color:var(--day-ink-2,#5c5142)] transition hover:bg-[color:var(--day-inset,#efe7da)]"
          >
            {t("kai.chat.action_plan_save")}
          </button>
        )}
        <button
          type="button"
          onClick={handleStart}
          className="rounded-full bg-violet px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-violet/90"
        >
          {t("kai.chat.action_plan_start")}
        </button>
      </div>
    </div>
  );
}
