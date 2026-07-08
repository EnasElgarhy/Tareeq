"use client";

import { MessageSquareText } from "lucide-react";

/** Key points the learner can make in a real conversation — e.g. with
 * their family. Distinct from FamilyScriptCard's literal lines: these
 * are the *ideas*, not word-for-word phrasing. */
export function TalkingPointsCard({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="justify-self-start rounded-[18px] border border-violet/25 bg-violet/[0.05] p-3.5 sm:max-w-[480px]">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet/12 text-violet">
          <MessageSquareText size={18} />
        </span>
        <p className="text-[13px] font-black leading-tight text-[color:var(--day-ink,#2a2118)]">{title}</p>
      </div>
      <ol className="grid gap-1.5">
        {points.map((point, index) => (
          <li key={point} className="flex items-start gap-2 text-[12px] leading-snug text-[color:var(--day-ink-2,#5c5142)]">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-violet/12 text-[9px] font-black text-violet">
              {index + 1}
            </span>
            {point}
          </li>
        ))}
      </ol>
    </div>
  );
}
