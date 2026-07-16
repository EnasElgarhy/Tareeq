"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trackEvent } from "@/lib/analytics/track";
import { buildKaiChatContext } from "@/lib/kai/chat-context";
import { mergeConversations, updateMessage } from "@/lib/kai/chat-state";
import {
  appendMessage,
  readActiveConversation,
  readConversations,
  recentMessages,
  replaceConversations,
  setActiveConversation,
  startConversation as createConversation,
  writeConversation,
} from "@/lib/kai/chat-storage";
import { readKaiChatStream } from "@/lib/kai/chat-stream";
import type {
  KaiConversation,
  KaiConversationGoal,
  KaiMessage,
} from "@/lib/kai/chat-types";
import { applyMemoryUpdates, readMemory } from "@/lib/kai/memory/memory";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import { useKaiProfile } from "@/lib/kai/useKaiProfile";

interface PendingRun {
  requestId: string;
  threadId: string;
  userMessageId?: string;
  draftText: string;
}

interface KaiChatContextValue extends ReturnType<typeof useKaiProfile> {
  hydrated: boolean;
  memory: KaiMemoryProfile | null;
  threads: KaiConversation[];
  conversation: KaiConversation | null;
  isTyping: boolean;
  streamingText: string;
  error: string | null;
  startConversation: (goal: KaiConversationGoal) => void;
  startWithPrompt: (text: string) => boolean;
  sendMessage: (text: string, viaQuickReply?: boolean) => void;
  retryLastMessage: () => void;
  selectThread: (threadId: string) => void;
  newConversation: () => void;
  refreshThreads: () => Promise<void>;
}

const KaiChatContext = createContext<KaiChatContextValue | null>(null);

function conversationTitle(
  goal: KaiConversationGoal,
  message?: string,
): string {
  const text = message?.trim();
  if (text) return text.length > 54 ? `${text.slice(0, 51)}...` : text;
  return goal.replaceAll("_", " ");
}

function upsertThread(
  threads: KaiConversation[],
  thread: KaiConversation,
): KaiConversation[] {
  const next = threads.filter((candidate) => candidate.id !== thread.id);
  next.push(thread);
  return next.sort((a, b) => b.lastOpened.localeCompare(a.lastOpened));
}

export function KaiChatProvider({ children }: { children: ReactNode }) {
  const profile = useKaiProfile();
  const [hydrated, setHydrated] = useState(false);
  const [memory, setMemory] = useState<KaiMemoryProfile | null>(null);
  const [threads, setThreads] = useState<KaiConversation[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [pendingRuns, setPendingRuns] = useState<Record<string, PendingRun>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const threadsRef = useRef<KaiConversation[]>([]);
  const activeThreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    const storedThreads = readConversations();
    const active = readActiveConversation();
    threadsRef.current = storedThreads;
    activeThreadIdRef.current = active?.id ?? null;
    setThreads(storedThreads);
    setActiveThreadId(active?.id ?? null);
    void readMemory().then(setMemory);
    setHydrated(true);
  }, []);

  const commitThread = useCallback(
    (thread: KaiConversation, activate = false) => {
      writeConversation(thread, activate);
      const next = upsertThread(threadsRef.current, thread);
      threadsRef.current = next;
      setThreads(next);
      if (activate) {
        activeThreadIdRef.current = thread.id;
        setActiveThreadId(thread.id);
      }
    },
    [],
  );

  const refreshThreads = useCallback(async () => {
    if (profile.authState !== "signed-in") return;
    try {
      const response = await fetch("/api/kai/threads", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        available?: boolean;
        threads?: KaiConversation[];
      };
      if (!data.available || !Array.isArray(data.threads)) return;
      const merged = mergeConversations(threadsRef.current, data.threads);
      threadsRef.current = merged;
      setThreads(merged);
      const active = activeThreadIdRef.current ?? merged[0]?.id ?? null;
      replaceConversations(merged, active);
      if (!activeThreadIdRef.current && active) {
        activeThreadIdRef.current = active;
        setActiveThreadId(active);
      }
    } catch {
      // Local storage remains the offline fallback; the next focus retries sync.
    }
  }, [profile.authState]);

  useEffect(() => {
    if (!hydrated || profile.authState !== "signed-in") return;
    void refreshThreads();
  }, [hydrated, profile.authState, refreshThreads]);

  useEffect(() => {
    if (profile.authState !== "signed-in") return;
    const handleFocus = () => void refreshThreads();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshThreads();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [profile.authState, refreshThreads]);

  const orphanPendingThreadIds = useMemo(
    () =>
      threads
        .filter(
          (thread) =>
            !pendingRuns[thread.id] &&
            thread.messages.some(
              (message) =>
                message.role === "user" && message.status === "pending",
            ),
        )
        .map((thread) => thread.id),
    [pendingRuns, threads],
  );

  useEffect(() => {
    if (orphanPendingThreadIds.length === 0) return;
    const reconcile = () => {
      void refreshThreads();
      const cutoff = Date.now() - 45_000;
      let changed = false;
      const next = threadsRef.current.map((thread) => {
        if (!orphanPendingThreadIds.includes(thread.id)) return thread;
        let threadChanged = false;
        const messages = thread.messages.map((message) => {
          if (
            message.role !== "user" ||
            message.status !== "pending" ||
            Date.parse(message.createdAt) > cutoff
          ) {
            return message;
          }
          changed = true;
          threadChanged = true;
          return {
            ...message,
            status: "failed" as const,
            errorCode: "request_interrupted",
          };
        });
        return threadChanged ? { ...thread, messages } : thread;
      });
      if (changed) {
        threadsRef.current = next;
        setThreads(next);
        replaceConversations(next, activeThreadIdRef.current);
      }
    };
    reconcile();
    const interval = window.setInterval(reconcile, 3_000);
    return () => window.clearInterval(interval);
  }, [orphanPendingThreadIds, refreshThreads]);

  const sendRequest = useCallback(
    async (input: {
      kind: "open" | "reply";
      conversation: KaiConversation;
      message?: string;
      userMessageId?: string;
      requestId?: string;
      assistantMessageId?: string;
    }) => {
      if (!profile.kaiContext) return;
      const requestId = input.requestId ?? crypto.randomUUID();
      const assistantMessageId =
        input.assistantMessageId ?? crypto.randomUUID();
      const threadId = input.conversation.id;

      setErrors((current) => {
        const next = { ...current };
        delete next[threadId];
        return next;
      });
      setPendingRuns((current) => ({
        ...current,
        [threadId]: {
          requestId,
          threadId,
          userMessageId: input.userMessageId,
          draftText: "",
        },
      }));

      try {
        const currentMemory = await readMemory();
        const chatContext = buildKaiChatContext({
          base: profile.kaiContext,
          goal: input.conversation.goal,
          summary: input.conversation.summary,
          messages: recentMessages(input.conversation),
          memory: currentMemory,
        });
        const response = await fetch("/api/kai/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: input.kind,
            context: chatContext,
            message: input.message,
            threadId,
            threadTitle: input.conversation.title,
            requestId,
            userMessageId: input.userMessageId,
            assistantMessageId,
          }),
        });
        const data = await readKaiChatStream(response, (event) => {
          if (event.type !== "text") return;
          setPendingRuns((current) => {
            const run = current[threadId];
            if (!run || run.requestId !== requestId) return current;
            return {
              ...current,
              [threadId]: { ...run, draftText: event.text },
            };
          });
        });

        let latest =
          threadsRef.current.find((thread) => thread.id === threadId) ??
          input.conversation;
        if (input.userMessageId) {
          latest = updateMessage(latest, input.userMessageId, {
            requestId,
            status: "complete",
            errorCode: undefined,
          });
        }
        const kaiMessage: KaiMessage = {
          ...data.message,
          id: assistantMessageId,
          requestId,
          status: "complete",
        };
        if (!latest.messages.some((message) => message.id === kaiMessage.id)) {
          latest = {
            ...latest,
            messages: [...latest.messages, kaiMessage],
            lastOpened: kaiMessage.createdAt,
          };
        }
        if (data.summary) latest = { ...latest, summary: data.summary };
        commitThread(latest);

        trackEvent("kai_message_received", {
          source: data.source,
          hasBlocks: Boolean(data.message.blocks?.length),
          durationMs: data.timings?.totalMs,
          attempts: data.timings?.attempts,
        });
        if (data.message.intent)
          trackEvent("kai_intent_detected", { intent: data.message.intent });
        if (
          data.message.blocks?.some((block) => block.type === "family_script")
        ) {
          trackEvent("kai_family_script_generated", {});
        }

        if (data.memoryUpdates?.length || data.personSummary) {
          const applied = await applyMemoryUpdates(
            data.memoryUpdates ?? [],
            data.personSummary,
          );
          setMemory(applied.profile);
          if (applied.created.length > 0) {
            trackEvent("kai_memory_created", { count: applied.created.length });
            for (const item of applied.created) {
              if (item.category === "goal") trackEvent("kai_goal_saved", {});
            }
          }
          if (applied.updated.length > 0) {
            trackEvent("kai_memory_updated", { count: applied.updated.length });
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Kai could not finish that reply.";
        const latest = threadsRef.current.find(
          (thread) => thread.id === threadId,
        );
        if (latest && input.userMessageId) {
          commitThread(
            updateMessage(latest, input.userMessageId, {
              requestId,
              status: "failed",
              errorCode: "request_failed",
            }),
          );
        }
        setErrors((current) => ({ ...current, [threadId]: message }));
        trackEvent("kai_message_failed", { reason: "request_failed" });
      } finally {
        setPendingRuns((current) => {
          if (current[threadId]?.requestId !== requestId) return current;
          const next = { ...current };
          delete next[threadId];
          return next;
        });
      }
    },
    [commitThread, profile.kaiContext],
  );

  const startConversation = useCallback(
    (goal: KaiConversationGoal) => {
      if (!profile.kaiContext) return;
      const conversation = {
        ...createConversation(goal),
        title: conversationTitle(goal),
      };
      commitThread(conversation, true);
      trackEvent("kai_chat_started", { goal });
      void sendRequest({ kind: "open", conversation });
    },
    [commitThread, profile.kaiContext, sendRequest],
  );

  const startWithPrompt = useCallback(
    (text: string) => {
      if (!profile.kaiContext) return false;
      const requestId = crypto.randomUUID();
      const assistantMessageId = crypto.randomUUID();
      const userMessage: KaiMessage = {
        id: crypto.randomUUID(),
        requestId,
        assistantMessageId,
        status: "pending",
        role: "user",
        createdAt: new Date().toISOString(),
        text,
      };
      const started = createConversation("build_plan");
      const conversation = appendMessage(
        { ...started, title: conversationTitle("build_plan", text) },
        userMessage,
      );
      commitThread(conversation, true);
      trackEvent("kai_chat_started", { goal: "build_plan" });
      trackEvent("kai_message_sent", {
        length: text.length,
        source: "home_prompt",
      });
      void sendRequest({
        kind: "reply",
        conversation,
        message: text,
        userMessageId: userMessage.id,
        requestId,
        assistantMessageId,
      });
      return true;
    },
    [commitThread, profile.kaiContext, sendRequest],
  );

  const sendMessage = useCallback(
    (text: string, viaQuickReply = false) => {
      const threadId = activeThreadIdRef.current;
      const conversation = threadsRef.current.find(
        (thread) => thread.id === threadId,
      );
      if (!conversation || pendingRuns[conversation.id]) return;
      const requestId = crypto.randomUUID();
      const assistantMessageId = crypto.randomUUID();
      const userMessage: KaiMessage = {
        id: crypto.randomUUID(),
        requestId,
        assistantMessageId,
        status: "pending",
        role: "user",
        createdAt: new Date().toISOString(),
        text,
      };
      const next = {
        ...conversation,
        title: conversation.title || conversationTitle(conversation.goal, text),
        messages: [...conversation.messages, userMessage],
        lastOpened: userMessage.createdAt,
      };
      commitThread(next);
      trackEvent(
        viaQuickReply ? "kai_quick_reply_clicked" : "kai_message_sent",
        {
          length: text.length,
        },
      );
      void sendRequest({
        kind: "reply",
        conversation: next,
        message: text,
        userMessageId: userMessage.id,
        requestId,
        assistantMessageId,
      });
    },
    [commitThread, pendingRuns, sendRequest],
  );

  const retryLastMessage = useCallback(() => {
    const threadId = activeThreadIdRef.current;
    const conversation = threadsRef.current.find(
      (thread) => thread.id === threadId,
    );
    if (!conversation || pendingRuns[conversation.id]) return;
    const failed = [...conversation.messages]
      .reverse()
      .find(
        (message) => message.role === "user" && message.status === "failed",
      );
    if (!failed) {
      void sendRequest({ kind: "open", conversation });
      return;
    }
    const requestId = failed.requestId ?? crypto.randomUUID();
    const assistantMessageId = failed.assistantMessageId ?? crypto.randomUUID();
    const next = updateMessage(conversation, failed.id, {
      requestId,
      assistantMessageId,
      status: "pending",
      errorCode: undefined,
    });
    commitThread(next);
    void sendRequest({
      kind: "reply",
      conversation: next,
      message: failed.text,
      userMessageId: failed.id,
      requestId,
      assistantMessageId,
    });
  }, [commitThread, pendingRuns, sendRequest]);

  const selectThread = useCallback((threadId: string) => {
    if (!threadsRef.current.some((thread) => thread.id === threadId)) return;
    setActiveConversation(threadId);
    activeThreadIdRef.current = threadId;
    setActiveThreadId(threadId);
  }, []);

  const newConversation = useCallback(() => {
    setActiveConversation(null);
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
  }, []);

  const conversation = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads],
  );
  const activeRun = activeThreadId ? pendingRuns[activeThreadId] : undefined;
  const hasStoredPending = Boolean(
    conversation?.messages.some(
      (message) => message.role === "user" && message.status === "pending",
    ),
  );

  const value = useMemo<KaiChatContextValue>(
    () => ({
      ...profile,
      hydrated,
      memory,
      threads,
      conversation,
      isTyping: Boolean(activeRun) || hasStoredPending,
      streamingText: activeRun?.draftText ?? "",
      error: activeThreadId ? (errors[activeThreadId] ?? null) : null,
      startConversation,
      startWithPrompt,
      sendMessage,
      retryLastMessage,
      selectThread,
      newConversation,
      refreshThreads,
    }),
    [
      profile,
      hydrated,
      memory,
      threads,
      conversation,
      activeRun,
      hasStoredPending,
      activeThreadId,
      errors,
      startConversation,
      startWithPrompt,
      sendMessage,
      retryLastMessage,
      selectThread,
      newConversation,
      refreshThreads,
    ],
  );

  return (
    <KaiChatContext.Provider value={value}>{children}</KaiChatContext.Provider>
  );
}

export function useKaiChat(): KaiChatContextValue {
  const context = useContext(KaiChatContext);
  if (!context)
    throw new Error("useKaiChat must be used inside KaiChatProvider.");
  return context;
}
