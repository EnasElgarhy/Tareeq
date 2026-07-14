"use client";

import { Lightbulb } from "lucide-react";

/** The "Ground" step of the coaching framework — a short callout tying
 * the answer back to the learner's real profile. Distinct from the
 * persistent KaiGroundingCard header, which always shows the raw
 * deterministic result rather than a per-turn take on it. */
export function InsightBlockCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="justify-self-start rounded-[18px] border border-gold/25 bg-gold/[0.06] p-3.5 sm:max-w-[480px]">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
          <Lightbulb size={18} />
        </span>
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--day-ink-2,#5c5142)]">{body}</p>
    </div>
  );
}
