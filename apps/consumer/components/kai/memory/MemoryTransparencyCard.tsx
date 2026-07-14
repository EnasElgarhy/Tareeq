"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KaiSignal } from "@/components/kai/KaiSignal";
import { trackEvent } from "@/lib/analytics/track";
import { clearAllMemory, forgetMemoryItem, readMemory } from "@/lib/kai/memory/memory";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import { groupMemoryItems } from "@/lib/kai/memory/memory-view";

/**
 * "What Kai knows about you" — the transparency half of the memory
 * system. Every item shown here is exactly what's stored (no hidden
 * memory exists anywhere else); every item can be forgotten
 * individually, and everything can be cleared at once. Kai should never
 * feel creepy — the user stays in control.
 */
export function MemoryTransparencyCard() {
  const { t } = useLocale();
  const [memory, setMemory] = useState<KaiMemoryProfile | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    void readMemory().then(setMemory);
  }, []);

  async function handleForget(id: string) {
    const next = await forgetMemoryItem(id);
    setMemory(next);
    trackEvent("kai_memory_deleted", { scope: "single" });
  }

  async function handleClearAll() {
    await clearAllMemory();
    setMemory({ items: [], personSummary: "", updatedAt: new Date().toISOString() });
    setConfirmingClear(false);
    trackEvent("kai_memory_deleted", { scope: "all" });
  }

  if (!memory) return null;

  const groups = groupMemoryItems(memory.items, t);

  return (
    <section className="rounded-[20px] border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-card,#fffcf6)] p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <KaiSignal mood="listening" size={30} />
        <div>
          <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{t("kai.memory.section_title")}</p>
          <p className="text-[10.5px] text-[color:var(--day-ink-3,#675d4e)]">{t("kai.memory.section_subtitle")}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">{t("kai.memory.empty")}</p>
      ) : (
        <div className="grid gap-2.5">
          {groups.map((group) => (
            <div key={group.category}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--day-ink-3,#675d4e)]">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full border border-[color:var(--day-line,rgba(43,36,28,0.1))] bg-[color:var(--day-inset,#efe7da)] py-1 pl-2.5 pr-1.5 text-[11px] font-semibold text-[color:var(--day-ink-2,#5c5142)]"
                  >
                    {item.value}
                    <button
                      type="button"
                      onClick={() => handleForget(item.id)}
                      aria-label={t("kai.memory.forget_item")}
                      className="grid size-4 place-items-center rounded-full text-[color:var(--day-ink-3,#675d4e)] transition hover:bg-[color:var(--day-line-strong,rgba(43,36,28,0.2))]"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.length > 0 ? (
        confirmingClear ? (
          <div className="mt-3 rounded-[14px] border border-error/25 bg-error/[0.05] p-2.5">
            <p className="text-[11.5px] font-bold text-[color:var(--day-ink,#2a2118)]">{t("kai.memory.clear_confirm_title")}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
              {t("kai.memory.clear_confirm_body")}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearAll}
                className="btn-v2 btn-v2--ghost-on-light"
                data-size="sm"
              >
                {t("kai.memory.clear_confirm_cta")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="text-[11px] font-semibold text-[color:var(--day-ink-3,#675d4e)] hover:text-[color:var(--day-ink,#2a2118)]"
              >
                {t("kai.memory.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="mt-3 text-[11px] font-semibold text-[color:var(--day-ink-3,#675d4e)] underline transition hover:text-[color:var(--day-ink,#2a2118)]"
          >
            {t("kai.memory.clear_all")}
          </button>
        )
      ) : null}
    </section>
  );
}
