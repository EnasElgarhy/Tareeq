"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ActionPlanIcon, DeepDiveIcon } from "@/components/brand/DomainIcons";
import { KaiGroundingCard } from "@/components/kai/KaiGroundingCard";
import { KaiLockedToolCard } from "@/components/kai/KaiLockedToolCard";
import { KaiSignal } from "@/components/kai/KaiSignal";
import { MemoryTransparencyCard } from "@/components/kai/memory/MemoryTransparencyCard";
import { ProactiveMomentCard } from "@/components/kai/ProactiveMomentCard";
import { GoalPicker } from "@/components/kai/chat/GoalPicker";
import { KaiChatInput } from "@/components/kai/chat/KaiChatInput";
import { KaiMessageBlocks } from "@/components/kai/chat/KaiMessageBlocks";
import { KaiTextMessage } from "@/components/kai/chat/KaiTextMessage";
import { LoadingMessage } from "@/components/kai/chat/LoadingMessage";
import { QuickReplies } from "@/components/kai/chat/QuickReplies";
import { SystemDivider } from "@/components/kai/chat/SystemDivider";
import { trackEvent } from "@/lib/analytics/track";
import { buildKaiChatContext } from "@/lib/kai/chat-context";
import {
  appendMessage,
  readActiveConversation,
  recentMessages,
  startConversation,
  touchConversation,
  updateSummary,
} from "@/lib/kai/chat-storage";
import type { KaiConversation, KaiConversationGoal, KaiMessage } from "@/lib/kai/chat-types";
import { applyMemoryUpdates, readMemory } from "@/lib/kai/memory/memory";
import type { KaiMemoryProfile, KaiMemoryUpdateCandidate } from "@/lib/kai/memory/memory-types";
import { daysSince, markSeenNow, readLastSeenAt } from "@/lib/kai/proactive/last-seen";
import { buildProactiveContext } from "@/lib/kai/proactive/proactive-context";
import { useKaiProfile } from "@/lib/kai/useKaiProfile";
import { deriveNextMilestone } from "@/lib/profile/activity";

const VALID_GOALS: readonly string[] = [
  "explain_results",
  "find_majors",
  "compare_careers",
  "build_plan",
  "explain_to_parents",
  "challenge_result",
];

/** Reads `?goal=` once — same plain window-read trick as ProfileScreen's
 * `?tab=`, so this route doesn't need a Suspense boundary either. */
function initialGoalFromLocation(): KaiConversationGoal | null {
  if (typeof window === "undefined") return null;
  const requested = new URLSearchParams(window.location.search).get("goal");
  return requested && VALID_GOALS.includes(requested) ? (requested as KaiConversationGoal) : null;
}

/** Reads `?prompt=` once — set by Home's Ask-Kai card (see
 * lib/home/feed.ts) when the user taps a specific recommendation
 * rather than a generic goal chip. `URLSearchParams.get()` already
 * decodes it, so no manual decodeURIComponent here. */
function initialPromptFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("prompt");
}

interface ChatApiResponse {
  message: KaiMessage;
  summary?: string;
  source: "gemini" | "fallback";
  memoryUpdates?: KaiMemoryUpdateCandidate[];
  personSummary?: string;
}

export function KaiChatScreen() {
  const { t } = useLocale();
  const { authState, kaiContext, snapshot } = useKaiProfile();
  const [conversation, setConversation] = useState<KaiConversation | null>(null);
  const [memory, setMemory] = useState<KaiMemoryProfile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [daysSinceLastSeen, setDaysSinceLastSeen] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasExchangedRef = useRef(false);

  useEffect(() => {
    void readMemory().then(setMemory);
    // Read the PRIOR last-seen value before overwriting it with "now" —
    // Home already does this too; harmless to repeat for a direct deep
    // link straight into Kai.
    setDaysSinceLastSeen(daysSince(readLastSeenAt(), new Date()));
    markSeenNow();
  }, []);

  // The same proactive layer Home's Ask-Kai card reads — here it drives
  // an in-page "pick up where we left off" nudge before the goal picker,
  // shown only for the one moment kind not already covered by an
  // existing empty-state or the auto-resume-on-mount effect below.
  const proactiveContext = useMemo(
    () =>
      kaiContext && snapshot && memory
        ? buildProactiveContext({ now: new Date(), kaiContext, snapshot, memory, conversation, daysSinceLastSeen })
        : null,
    [kaiContext, snapshot, memory, conversation, daysSinceLastSeen],
  );
  const resumeTopicMoment =
    proactiveContext?.primaryMoment?.kind === "resume_topic" ? proactiveContext.primaryMoment : null;

  const callGemini = useCallback(
    async (kind: "open" | "reply", conv: KaiConversation, message?: string) => {
      if (!kaiContext) return;
      setIsTyping(true);

      // Read fresh rather than trusting `memory` state, so a merge from
      // the previous turn is never missed by a stale closure.
      const currentMemory = await readMemory();
      const chatContext = buildKaiChatContext({
        base: kaiContext,
        goal: conv.goal,
        summary: conv.summary,
        messages: recentMessages(conv),
        memory: currentMemory,
      });

      try {
        const response = await fetch("/api/kai/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, context: chatContext, message }),
        });
        const data = (await response.json()) as ChatApiResponse;

        setConversation((current) => {
          if (!current) return current;
          const withMessage = appendMessage(current, data.message);
          return data.summary ? updateSummary(withMessage, data.summary) : withMessage;
        });
        trackEvent("kai_message_received", {
          source: data.source,
          hasBlocks: Boolean(data.message.blocks?.length),
        });
        if (data.message.intent) {
          trackEvent("kai_intent_detected", { intent: data.message.intent });
        }
        if (data.message.blocks?.some((block) => block.type === "family_script")) {
          trackEvent("kai_family_script_generated", {});
        }
        hasExchangedRef.current = true;

        if (data.memoryUpdates?.length || data.personSummary) {
          const { profile, created, updated } = await applyMemoryUpdates(
            data.memoryUpdates ?? [],
            data.personSummary,
          );
          setMemory(profile);
          if (created.length > 0) {
            trackEvent("kai_memory_created", { count: created.length });
            for (const item of created) {
              if (item.category === "goal") trackEvent("kai_goal_saved", {});
            }
          }
          if (updated.length > 0) {
            trackEvent("kai_memory_updated", { count: updated.length });
          }
        }
      } finally {
        setIsTyping(false);
      }
    },
    [kaiContext],
  );

  const handleStart = useCallback(
    (goal: KaiConversationGoal) => {
      const conv = startConversation(goal);
      setConversation(conv);
      trackEvent("kai_chat_started", { goal });
      void callGemini("open", conv);
    },
    [callGemini],
  );

  // Starts a conversation with the picked recommendation as the actual
  // opening message (skips Kai's generic "open" line — she replies
  // directly to what was tapped, same as if the user had typed it).
  const handleStartWithPrompt = useCallback(
    (text: string) => {
      const conv = startConversation("build_plan");
      trackEvent("kai_chat_started", { goal: "build_plan" });
      const userMessage: KaiMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        createdAt: new Date().toISOString(),
        text,
      };
      const withMessage = appendMessage(conv, userMessage);
      setConversation(withMessage);
      trackEvent("kai_message_sent", { length: text.length });
      void callGemini("reply", withMessage, text);
    },
    [callGemini],
  );

  useEffect(() => {
    const existing = readActiveConversation();
    const goal = initialGoalFromLocation();
    const prompt = initialPromptFromLocation();

    // A specific recommendation was tapped (from Home's Ask-Kai card) —
    // always starts fresh with that exact text, same as a mismatched
    // goal chip below.
    if (prompt) {
      handleStartWithPrompt(prompt);
      return;
    }
    // A different action chip than the resumed conversation's own goal
    // means the user deliberately picked something new — start fresh for
    // it rather than silently resuming the old thread and ignoring the
    // tap. Memory (not the literal old transcript) carries continuity.
    if (existing && (!goal || goal === existing.goal)) {
      setConversation(touchConversation(existing));
      return;
    }
    if (goal) {
      handleStart(goal);
      return;
    }
    if (existing) {
      setConversation(touchConversation(existing));
    }
    // Run once on mount only — handleStart's identity can change with
    // kaiContext, but we only want the very first landing to auto-start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.messages.length, isTyping]);

  useEffect(() => {
    return () => {
      if (hasExchangedRef.current) trackEvent("kai_conversation_finished", {});
    };
  }, []);

  function handleSend(text: string, viaQuickReply: boolean) {
    if (!conversation) return;
    const userMessage: KaiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      createdAt: new Date().toISOString(),
      text,
    };
    const next = appendMessage(conversation, userMessage);
    setConversation(next);
    trackEvent(viaQuickReply ? "kai_quick_reply_clicked" : "kai_message_sent", { length: text.length });
    void callGemini("reply", next, text);
  }

  function handleResumeContinue() {
    trackEvent("kai_resume_clicked", {});
    handleSend(t("kai.memory.resume_cta"), true);
  }

  if (authState === "loading") return null;

  if (authState === "signed-out" || !kaiContext) {
    return (
      <section className="daybreak-reveal grid flex-1 place-items-center px-2 py-8 text-center">
        <div className="rounded-story relative grid w-full max-w-[520px] justify-items-center gap-4 overflow-hidden border border-[#413664] bg-[#221248] px-6 py-10 text-[#FFFCF6] shadow-[0_24px_60px_rgba(34,18,72,0.22)]">
          <span className="absolute inset-x-0 top-0 h-1 bg-[#F2C94C]" aria-hidden="true" />
          <KaiSignal mood="waiting" size={58} />
          <p className="daybreak-heading max-w-[24ch] text-[24px] leading-tight text-[#FFFCF6]">
            {t("kai.chat.signed_out")}
          </p>
          <Link
            href="/you"
            className="daybreak-inverse-action inline-flex min-h-11 items-center justify-center rounded-full bg-[#FFFCF6] px-5 text-[13px] font-bold text-[#221248] transition hover:bg-[#F2C94C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#221248]"
          >
            {t("kai.chat.signed_out_cta")}
          </Link>
        </div>
      </section>
    );
  }

  if (!kaiContext.assessment) {
    return (
      <section className="daybreak-reveal grid flex-1 place-items-center px-2 py-8 text-center">
        <div className="rounded-story relative grid w-full max-w-[520px] justify-items-center gap-4 overflow-hidden border border-[#413664] bg-[#221248] px-6 py-10 text-[#FFFCF6] shadow-[0_24px_60px_rgba(34,18,72,0.22)]">
          <span className="absolute inset-x-0 top-0 h-1 bg-[#F2C94C]" aria-hidden="true" />
          <KaiSignal mood="curious" size={58} />
          <p className="daybreak-heading max-w-[24ch] text-[24px] leading-tight text-[#FFFCF6]">
            {t("kai.chat.no_assessment")}
          </p>
          <Link
            href="/start"
            className="daybreak-inverse-action inline-flex min-h-11 items-center justify-center rounded-full bg-[#FFFCF6] px-5 text-[13px] font-bold text-[#221248] transition hover:bg-[#F2C94C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#221248]"
          >
            {t("kai.panel.empty_cta")}
          </Link>
        </div>
      </section>
    );
  }

  const nextMilestone = snapshot ? deriveNextMilestone(snapshot) : null;

  return (
    <div className="daybreak-chat daybreak-reveal mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-4 pb-1">
      {/* Persistent identity — always visible who this conversation is with,
          using our 3D Kai likeness (static image), consistent with the profile
          and Overview widget. */}
      <header className="rounded-story-alt relative flex items-center gap-3 overflow-hidden border border-[#413664] bg-[#221248] p-4 text-[#FFFCF6] shadow-[0_18px_42px_rgba(34,18,72,0.18)] lg:p-5">
        <span className="absolute inset-y-0 start-0 w-1 bg-[#F2C94C]" aria-hidden="true" />
        <span className="size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#F2C94C] ring-offset-2 ring-offset-[#221248]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kai/kai-poster.png"
            alt="Kai"
            width={48}
            height={48}
            className="size-full object-cover"
            style={{ objectPosition: "50% 26%" }}
          />
        </span>
        <div className="min-w-0">
          <p className="daybreak-heading text-[22px] leading-tight text-[#FFFCF6]">{t("profile.tab.kai")}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#D8D0EA]">{t("kai.chat.subtitle")}</p>
        </div>
      </header>

      <KaiGroundingCard
        assessment={kaiContext.assessment}
        onOpen={() => trackEvent("kai_grounding_opened", {})}
      />

      {!conversation ? (
        <>
          {resumeTopicMoment ? (
            <ProactiveMomentCard
              moment={resumeTopicMoment}
              eyebrowKey="kai.panel.todays_move"
              onCtaClick={() => trackEvent("kai_proactive_clicked", { kind: resumeTopicMoment.kind })}
              onAction={() => handleStart(resumeTopicMoment.goal)}
            />
          ) : null}

          <GoalPicker onSelect={handleStart} />

          <MemoryTransparencyCard />

          <div className="grid gap-2">
            <Link
              href="/kai/plans"
              className="daybreak-story-card rounded-story flex items-start gap-3 p-4 text-start active:scale-[0.99]"
            >
              <span className="daybreak-icon-tile size-10">
                <ActionPlanIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="daybreak-heading text-[15px] leading-tight text-[color:var(--day-ink,#2a2118)]">
                  {t("kai.panel.locked.action_plans.title")}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[color:var(--day-ink-3,#675d4e)]">
                  {t("kai.panel.locked.action_plans.body")}
                </p>
              </div>
            </Link>
            <KaiLockedToolCard
              icon={DeepDiveIcon}
              titleKey="kai.panel.locked.deep_dive.title"
              bodyKey="kai.panel.locked.deep_dive.body"
              onTap={() => trackEvent("kai_locked_tool_clicked", { tool: "deep_dive_interview" })}
            />
          </div>
        </>
      ) : (
        // flex-1 + justify-end: a short thread (the common case — one
        // question, one reply) hugs the composer at the bottom of the
        // screen instead of floating under the header with a dead gap
        // below it. A long thread simply fills this area and the outer
        // AppShell well scrolls, newest message still anchored above input.
        <div className="flex flex-1 flex-col justify-end gap-3">
          <SystemDivider label={t("kai.chat.conversation_started")} />
          {conversation.messages.length === 0 && !isTyping ? (
            <KaiConversationEmptyState />
          ) : (
            <div className="grid gap-6">
              {conversation.messages.map((message) =>
                message.role === "user" ? (
                  <KaiTextMessage
                    key={message.id}
                    role={message.role}
                    text={message.text}
                    userName={kaiContext.user.displayName}
                  />
                ) : (
                  // One Kai turn = one flowing answer surface: avatar + name
                  // once at the top, the reply and its sections beneath, and
                  // the suggested next questions pinned to the very bottom.
                  <article key={message.id} className="grid gap-3">
                    <header className="flex items-center gap-2">
                      <span className="size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--day-line,rgba(43,36,28,0.1))]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/kai/kai-poster.png" alt="" width={24} height={24} className="size-full object-cover" style={{ objectPosition: "50% 26%" }} />
                      </span>
                      <span className="daybreak-eyebrow text-[color:var(--day-ink-3,#675d4e)]">
                        {t("profile.tab.kai")}
                      </span>
                    </header>
                    <KaiTextMessage role={message.role} text={message.text} userName={kaiContext.user.displayName} />
                    {message.blocks && memory ? (
                      <KaiMessageBlocks
                        blocks={message.blocks}
                        modules={snapshot?.modules ?? []}
                        memory={memory}
                        nextMilestone={nextMilestone}
                        onRecommendationOpen={(title) => trackEvent("kai_recommendation_clicked", { title })}
                        onResumeContinue={handleResumeContinue}
                      />
                    ) : null}
                    {message.quickReplies ? (
                      <div className="mt-1 border-t border-[color:var(--day-line,rgba(43,36,28,0.08))] pt-3">
                        <p className="daybreak-eyebrow mb-2 text-[color:var(--day-ink-3,#675d4e)]">
                          {t("kai.chat.suggested_next")}
                        </p>
                        <QuickReplies replies={message.quickReplies} onSelect={(reply) => handleSend(reply, true)} />
                      </div>
                    ) : null}
                  </article>
                ),
              )}
              {isTyping ? (
                <LoadingMessage
                  pendingMessage={
                    [...conversation.messages]
                      .reverse()
                      .find((m) => m.role === "user")?.text
                  }
                />
              ) : null}
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />

      {conversation ? (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-[color:var(--day-line)] bg-[color:var(--day-bg,#f4eee3)] px-4 pb-3 pt-3 md:-mx-5 md:px-5">
          <KaiChatInput onSend={(text) => handleSend(text, false)} disabled={isTyping} />
        </div>
      ) : null}
    </div>
  );
}

/** Covers the brief instant a conversation exists but neither has a
 * message nor is actively fetching one yet (e.g. mid-hydration) — the
 * conversation-started divider alone previously left a bare gap here. */
function KaiConversationEmptyState() {
  const { t } = useLocale();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
      <KaiSignal mood="curious" size={40} />
      <p className="max-w-[26ch] text-[12px] leading-snug text-[color:var(--day-ink-3,#675d4e)]">
        {t("kai.chat.empty_conversation")}
      </p>
    </div>
  );
}
