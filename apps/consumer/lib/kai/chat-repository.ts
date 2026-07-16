import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ValidatedChatRequest } from "@/lib/kai/chat-server";
import type { KaiChatResult } from "@/lib/kai/chat-stream";
import type {
  KaiConversation,
  KaiConversationGoal,
  KaiMessage,
  KaiMessageBlock,
  KaiMessageStatus,
} from "@/lib/kai/chat-types";
import type { KaiMessageIntent } from "@/lib/kai/intent";

interface RepositoryError {
  code?: string;
  message?: string;
}

interface MessageRow {
  id: string;
  thread_id: string;
  request_id: string;
  role: "user" | "kai";
  status: KaiMessageStatus;
  text: string;
  blocks: KaiMessageBlock[] | null;
  quick_replies: string[] | null;
  intent: KaiMessageIntent | null;
  error_code: string | null;
  assistant_message_id: string | null;
  response_meta: Record<string, unknown> | null;
  created_at: string;
}

interface ThreadRow {
  id: string;
  goal: KaiConversationGoal;
  title: string | null;
  summary: string;
  created_at: string;
  updated_at: string;
}

export function isKaiRepositoryUnavailable(
  error: RepositoryError | null,
): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

function messageFromRow(row: MessageRow): KaiMessage {
  return {
    id: row.id,
    role: row.role,
    createdAt: row.created_at,
    text: row.text,
    requestId: row.request_id,
    status: row.status,
    errorCode: row.error_code ?? undefined,
    assistantMessageId: row.assistant_message_id ?? undefined,
    blocks: row.blocks ?? undefined,
    quickReplies: row.quick_replies ?? undefined,
    intent: row.intent ?? undefined,
  };
}

function cachedResult(row: MessageRow, summary: string): KaiChatResult {
  const meta = row.response_meta ?? {};
  return {
    message: messageFromRow(row),
    summary,
    source: meta.source === "fallback" ? "fallback" : "gemini",
    memoryUpdates: Array.isArray(meta.memoryUpdates)
      ? (meta.memoryUpdates as KaiChatResult["memoryUpdates"])
      : undefined,
    personSummary:
      typeof meta.personSummary === "string" ? meta.personSummary : undefined,
  };
}

export async function prepareKaiRun(
  supabase: SupabaseClient,
  userId: string,
  input: ValidatedChatRequest,
): Promise<{ available: boolean; cached?: KaiChatResult }> {
  if (!input.threadId || !input.requestId || !input.assistantMessageId) {
    return { available: false };
  }

  const { data: cached, error: cachedError } = await supabase
    .from("kai_messages")
    .select("*")
    .eq("thread_id", input.threadId)
    .eq("request_id", input.requestId)
    .eq("role", "kai")
    .eq("status", "complete")
    .maybeSingle();
  if (cachedError) {
    if (isKaiRepositoryUnavailable(cachedError)) return { available: false };
    throw new Error(cachedError.message);
  }
  if (cached) {
    const { data: thread } = await supabase
      .from("kai_threads")
      .select("summary")
      .eq("id", input.threadId)
      .maybeSingle();
    return {
      available: true,
      cached: cachedResult(cached as MessageRow, thread?.summary ?? ""),
    };
  }

  const now = new Date().toISOString();
  const { error: threadError } = await supabase.from("kai_threads").upsert(
    {
      id: input.threadId,
      user_id: userId,
      goal: input.context.conversation.goal,
      title: input.threadTitle || null,
      summary: input.context.conversation.summary,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (threadError) {
    if (isKaiRepositoryUnavailable(threadError)) return { available: false };
    throw new Error(threadError.message);
  }

  if (input.kind === "reply" && input.userMessageId && input.message) {
    const { error } = await supabase.from("kai_messages").upsert(
      {
        id: input.userMessageId,
        thread_id: input.threadId,
        user_id: userId,
        request_id: input.requestId,
        assistant_message_id: input.assistantMessageId,
        role: "user",
        status: "pending",
        text: input.message,
        created_at: now,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
  }

  const { error: pendingError } = await supabase.from("kai_messages").upsert(
    {
      id: input.assistantMessageId,
      thread_id: input.threadId,
      user_id: userId,
      request_id: input.requestId,
      role: "kai",
      status: "pending",
      text: "",
      created_at: now,
    },
    { onConflict: "id" },
  );
  if (pendingError) throw new Error(pendingError.message);
  return { available: true };
}

export async function completeKaiRun(
  supabase: SupabaseClient,
  input: ValidatedChatRequest,
  result: KaiChatResult,
): Promise<void> {
  if (!input.threadId || !input.requestId || !input.assistantMessageId) return;
  const now = new Date().toISOString();
  await supabase
    .from("kai_threads")
    .update({ summary: result.summary ?? "", updated_at: now })
    .eq("id", input.threadId);
  if (input.userMessageId) {
    await supabase
      .from("kai_messages")
      .update({ status: "complete", completed_at: now, error_code: null })
      .eq("id", input.userMessageId)
      .eq("request_id", input.requestId);
  }
  const { error } = await supabase
    .from("kai_messages")
    .update({
      status: "complete",
      text: result.message.text,
      blocks: result.message.blocks ?? null,
      quick_replies: result.message.quickReplies ?? null,
      intent: result.message.intent ?? null,
      error_code: null,
      response_meta: {
        source: result.source,
        memoryUpdates: result.memoryUpdates,
        personSummary: result.personSummary,
      },
      completed_at: now,
    })
    .eq("id", input.assistantMessageId)
    .eq("request_id", input.requestId);
  if (error && !isKaiRepositoryUnavailable(error))
    throw new Error(error.message);
}

export async function failKaiRun(
  supabase: SupabaseClient,
  input: ValidatedChatRequest,
  errorCode: string,
): Promise<void> {
  if (!input.threadId || !input.requestId) return;
  const now = new Date().toISOString();
  await supabase
    .from("kai_messages")
    .update({ status: "failed", error_code: errorCode, completed_at: now })
    .eq("thread_id", input.threadId)
    .eq("request_id", input.requestId);
}

export async function listKaiThreads(
  supabase: SupabaseClient,
): Promise<{ available: boolean; threads: KaiConversation[] }> {
  const { data: threadRows, error } = await supabase
    .from("kai_threads")
    .select("id,goal,title,summary,created_at,updated_at")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) {
    if (isKaiRepositoryUnavailable(error))
      return { available: false, threads: [] };
    throw new Error(error.message);
  }
  if (!threadRows?.length) return { available: true, threads: [] };

  const ids = threadRows.map((thread) => thread.id as string);
  const { data: messageRows, error: messageError } = await supabase
    .from("kai_messages")
    .select("*")
    .in("thread_id", ids)
    .order("created_at", { ascending: true });
  if (messageError) throw new Error(messageError.message);

  const messagesByThread = new Map<string, KaiMessage[]>();
  for (const row of (messageRows ?? []) as MessageRow[]) {
    if (row.role === "kai" && row.status !== "complete") continue;
    const messages = messagesByThread.get(row.thread_id) ?? [];
    messages.push(messageFromRow(row));
    messagesByThread.set(row.thread_id, messages);
  }

  return {
    available: true,
    threads: (threadRows as ThreadRow[]).map((thread) => ({
      id: thread.id,
      goal: thread.goal,
      title: thread.title ?? undefined,
      summary: thread.summary,
      messages: messagesByThread.get(thread.id) ?? [],
      createdAt: thread.created_at,
      lastOpened: thread.updated_at,
    })),
  };
}
