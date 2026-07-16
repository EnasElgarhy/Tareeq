"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { History, MessageSquarePlus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useKaiChat } from "@/components/kai/chat/KaiChatProvider";
import { trackEvent } from "@/lib/analytics/track";
import type { KaiConversationGoal } from "@/lib/kai/chat-types";
import {
  daysSince,
  markSeenNow,
  readLastSeenAt,
} from "@/lib/kai/proactive/last-seen";
import { buildProactiveContext } from "@/lib/kai/proactive/proactive-context";
import { deriveNextMilestone } from "@/lib/profile/activity";

const VALID_GOALS: readonly string[] = [
  "explain_results",
  "find_majors",
  "compare_careers",
  "build_plan",
  "explain_to_parents",
  "challenge_result",
];

function parseGoal(requested: string | null): KaiConversationGoal | null {
  return requested && VALID_GOALS.includes(requested)
    ? (requested as KaiConversationGoal)
    : null;
}

export function KaiChatScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authState,
    kaiContext,
    snapshot,
    hydrated,
    memory,
    threads,
    conversation,
    isTyping,
    streamingText,
    error,
    startConversation,
    startWithPrompt,
    sendMessage,
    retryLastMessage,
    selectThread,
    newConversation,
  } = useKaiChat();
  const [daysSinceLastSeen, setDaysSinceLastSeen] = useState<number | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const consumedLaunchRef = useRef<string | null>(null);

  useEffect(() => {
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
        ? buildProactiveContext({
            now: new Date(),
            kaiContext,
            snapshot,
            memory,
            conversation,
            daysSinceLastSeen,
          })
        : null,
    [kaiContext, snapshot, memory, conversation, daysSinceLastSeen],
  );
  const resumeTopicMoment =
    proactiveContext?.primaryMoment?.kind === "resume_topic"
      ? proactiveContext.primaryMoment
      : null;

  useEffect(() => {
    if (!hydrated || !kaiContext) return;
    const launchKey = searchParams.toString();
    const prompt = searchParams.get("prompt")?.trim() || null;
    const goal = parseGoal(searchParams.get("goal"));
    if ((!prompt && !goal) || consumedLaunchRef.current === launchKey) return;
    consumedLaunchRef.current = launchKey;

    if (prompt) {
      if (startWithPrompt(prompt)) router.replace("/kai", { scroll: false });
      return;
    }
    if (goal) {
      if (!conversation || conversation.goal !== goal) startConversation(goal);
      router.replace("/kai", { scroll: false });
    }
  }, [
    hydrated,
    kaiContext,
    searchParams,
    conversation,
    router,
    startConversation,
    startWithPrompt,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.messages.length, isTyping]);

  function handleSend(text: string, viaQuickReply: boolean) {
    sendMessage(text, viaQuickReply);
  }

  function handleResumeContinue() {
    trackEvent("kai_resume_clicked", {});
    handleSend(t("kai.memory.resume_cta"), true);
  }

  if (authState === "loading" || !hydrated) return null;

  if (authState === "signed-out" || !kaiContext) {
    return (
      <section className="daybreak-reveal grid flex-1 place-items-center px-2 py-8 text-center">
        <div className="rounded-story relative grid w-full max-w-[520px] justify-items-center gap-4 overflow-hidden border border-[#413664] bg-[#221248] px-6 py-10 text-[#FFFCF6] shadow-[0_24px_60px_rgba(34,18,72,0.22)]">
          <span
            className="absolute inset-x-0 top-0 h-1 bg-[#F2C94C]"
            aria-hidden="true"
          />
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
          <span
            className="absolute inset-x-0 top-0 h-1 bg-[#F2C94C]"
            aria-hidden="true"
          />
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
  const hasFailedMessage = Boolean(
    conversation?.messages.some(
      (message) => message.role === "user" && message.status === "failed",
    ),
  );

  return (
    <div className="daybreak-chat daybreak-reveal mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-4 pb-1">
      <header className="flex min-h-[76px] items-center gap-3 border-b border-[color:var(--day-line)] px-1 pb-4 pt-1">
        <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-[#413664] bg-[#221248] p-[3px] shadow-[0_8px_20px_rgba(34,18,72,0.16)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kai/kai-poster.png"
            alt="Kai"
            width={50}
            height={50}
            className="size-full rounded-[14px] object-cover"
            style={{ objectPosition: "50% 26%" }}
          />
          <span
            className="absolute bottom-1 end-1 size-2.5 rounded-full border-2 border-[#FFFCF6] bg-[#4F9A69]"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="daybreak-heading text-[22px] leading-tight text-[color:var(--day-ink)]">
            {t("profile.tab.kai")}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[color:var(--day-ink-2)]">
            {t("kai.chat.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {threads.length > 0 ? (
            <label
              className="relative grid size-10 cursor-pointer place-items-center rounded-full border border-[color:var(--day-line)] bg-white/70 text-[color:var(--day-ink-2)] transition hover:bg-white"
              title={t("kai.chat.history")}
            >
              <History size={17} aria-hidden="true" />
              <span className="sr-only">{t("kai.chat.history")}</span>
              <select
                value={conversation?.id ?? ""}
                onChange={(event) => selectThread(event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={t("kai.chat.history")}
              >
                {!conversation ? (
                  <option value="">{t("kai.chat.history")}</option>
                ) : null}
                {threads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.title || thread.goal.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            onClick={newConversation}
            className="grid size-10 place-items-center rounded-full border border-[color:var(--day-line)] bg-white/70 text-[color:var(--day-ink-2)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#413664]"
            title={t("kai.chat.new_conversation")}
            aria-label={t("kai.chat.new_conversation")}
          >
            <MessageSquarePlus size={18} aria-hidden="true" />
          </button>
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
              onCtaClick={() =>
                trackEvent("kai_proactive_clicked", {
                  kind: resumeTopicMoment.kind,
                })
              }
              onAction={() => startConversation(resumeTopicMoment.goal)}
            />
          ) : null}

          <GoalPicker onSelect={startConversation} />

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
              onTap={() =>
                trackEvent("kai_locked_tool_clicked", {
                  tool: "deep_dive_interview",
                })
              }
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
          {conversation.messages.length === 0 && !isTyping && !error ? (
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
                        <img
                          src="/kai/kai-poster.png"
                          alt=""
                          width={24}
                          height={24}
                          className="size-full object-cover"
                          style={{ objectPosition: "50% 26%" }}
                        />
                      </span>
                      <span className="daybreak-eyebrow text-[color:var(--day-ink-3,#675d4e)]">
                        {t("profile.tab.kai")}
                      </span>
                    </header>
                    <KaiTextMessage
                      role={message.role}
                      text={message.text}
                      userName={kaiContext.user.displayName}
                    />
                    {message.blocks && memory ? (
                      <KaiMessageBlocks
                        blocks={message.blocks}
                        modules={snapshot?.modules ?? []}
                        memory={memory}
                        nextMilestone={nextMilestone}
                        onRecommendationOpen={(title) =>
                          trackEvent("kai_recommendation_clicked", { title })
                        }
                        onResumeContinue={handleResumeContinue}
                      />
                    ) : null}
                    {message.quickReplies ? (
                      <div className="mt-1 border-t border-[color:var(--day-line,rgba(43,36,28,0.08))] pt-3">
                        <p className="daybreak-eyebrow mb-2 text-[color:var(--day-ink-3,#675d4e)]">
                          {t("kai.chat.suggested_next")}
                        </p>
                        <QuickReplies
                          replies={message.quickReplies}
                          onSelect={(reply) => handleSend(reply, true)}
                        />
                      </div>
                    ) : null}
                  </article>
                ),
              )}
              {streamingText ? (
                <article className="grid gap-3" aria-live="polite">
                  <header className="flex items-center gap-2">
                    <span className="size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--day-line,rgba(43,36,28,0.1))]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/kai/kai-poster.png"
                        alt=""
                        width={24}
                        height={24}
                        className="size-full object-cover"
                        style={{ objectPosition: "50% 26%" }}
                      />
                    </span>
                    <span className="daybreak-eyebrow text-[color:var(--day-ink-3,#675d4e)]">
                      {t("profile.tab.kai")}
                    </span>
                  </header>
                  <KaiTextMessage
                    role="kai"
                    text={streamingText}
                    userName={kaiContext.user.displayName}
                  />
                </article>
              ) : isTyping ? (
                <LoadingMessage
                  pendingMessage={
                    [...conversation.messages]
                      .reverse()
                      .find((m) => m.role === "user")?.text
                  }
                />
              ) : null}
              {error || hasFailedMessage ? (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-3 border-t border-[color:var(--day-line)] pt-3"
                >
                  <p className="text-[12px] leading-snug text-[color:var(--day-ink-3)]">
                    {t("kai.chat.reply_failed")}
                  </p>
                  <button
                    type="button"
                    onClick={retryLastMessage}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-[color:var(--day-line)] bg-white px-3 text-[12px] font-bold text-[color:var(--day-ink)] transition hover:border-[#413664] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#413664]"
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    {t("kai.chat.retry")}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />

      {conversation ? (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-[color:var(--day-line)] bg-[color:var(--day-bg,#f4eee3)] px-4 pb-3 pt-3 md:-mx-5 md:px-5">
          <KaiChatInput
            onSend={(text) => handleSend(text, false)}
            disabled={isTyping}
          />
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
