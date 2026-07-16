"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { LoadingIcon, type LoadingIconId } from "@/components/kai/chat/loading-icons";
import { detectIntent } from "@/lib/kai/intent";
import type { StringKey } from "@/lib/i18n/strings";

interface Stage {
  /** Elapsed milliseconds at which this stage takes over. */
  atMs: number;
  key: StringKey;
  icon: LoadingIconId;
}

/**
 * Progressive loading ladders. Each escalates through 3 contextual messages
 * and lands on the shared "needs a little more thought" reassurance if the
 * response is still in flight. The base (general) ladder uses the exact
 * 0-2-5-10s cadence from the brief; the intent ladders stretch a little wider
 * because they gate the heavier artifact answers (which take longer).
 */
const GENERAL: Stage[] = [
  { atMs: 0, key: "kai.loading.thinking", icon: "think" },
  { atMs: 2000, key: "kai.loading.connecting", icon: "compass" },
  { atMs: 5000, key: "kai.loading.preparing", icon: "assemble" },
  { atMs: 10000, key: "kai.loading.more_thought", icon: "think" },
];
const PLAN: Stage[] = [
  { atMs: 0, key: "kai.loading.plan_1", icon: "steps" },
  { atMs: 4000, key: "kai.loading.plan_2", icon: "assemble" },
  { atMs: 8000, key: "kai.loading.plan_3", icon: "sparkle" },
  { atMs: 12000, key: "kai.loading.more_thought", icon: "think" },
];
const FAMILY: Stage[] = [
  { atMs: 0, key: "kai.loading.family_1", icon: "people" },
  { atMs: 4000, key: "kai.loading.family_2", icon: "chat" },
  { atMs: 8000, key: "kai.loading.family_3", icon: "assemble" },
  { atMs: 12000, key: "kai.loading.more_thought", icon: "think" },
];
const RECOMMENDATION: Stage[] = [
  { atMs: 0, key: "kai.loading.rec_1", icon: "sparkle" },
  { atMs: 4000, key: "kai.loading.rec_2", icon: "search" },
  { atMs: 8000, key: "kai.loading.rec_3", icon: "sparkle" },
  { atMs: 12000, key: "kai.loading.more_thought", icon: "think" },
];

/** Pick the ladder from the pending user message's detected intent. Falls
 *  back to the general cadence for an opening turn or an unmatched message. */
function ladderFor(message: string | undefined): Stage[] {
  if (!message) return GENERAL;
  switch (detectIntent(message)) {
    case "family_conversation":
      return FAMILY;
    case "action_plan":
    case "study_plan":
      return PLAN;
    case "resource_recommendation":
      return RECOMMENDATION;
    default:
      return GENERAL;
  }
}

const TICK_MS = 300;

/**
 * Shown while waiting on Gemini. The Kai orb sits to the left (unchanged),
 * paired with a small contextual status that advances by ELAPSED TIME and a
 * matching animated icon — so Kai reads as actively working with the learner,
 * not as a server spinner. All of it unmounts the moment the reply lands.
 */
export function LoadingMessage({ pendingMessage }: { pendingMessage?: string }) {
  const { t } = useLocale();
  const stages = useMemo(() => ladderFor(pendingMessage), [pendingMessage]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      let next = 0;
      for (let i = 0; i < stages.length; i += 1) {
        if (elapsed >= stages[i].atMs) next = i;
      }
      setIndex(next);
      if (next === stages.length - 1) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [stages]);

  const stage = stages[index] ?? stages[0];

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className="kai-writing-avatar" aria-hidden="true">
        <span className="kai-writing-avatar__ring" />
        <span className="kai-writing-avatar__core" />
        <span className="kai-writing-avatar__satellite kai-writing-avatar__satellite--a" />
        <span className="kai-writing-avatar__satellite kai-writing-avatar__satellite--b" />
      </span>
      <div className="rounded-story-alt flex items-center gap-2 border border-[color:var(--day-line)] bg-[color:var(--day-card,#fffcf6)] px-3.5 py-2.5 shadow-[0_8px_20px_rgba(43,36,28,0.06)]">
        <LoadingIcon id={stage.icon} />
        <span
          key={stage.key}
          className="kai-load-textin text-[11.5px] font-semibold text-[color:var(--day-ink-3,#675d4e)]"
        >
          {t(stage.key)}
        </span>
      </div>
    </div>
  );
}
