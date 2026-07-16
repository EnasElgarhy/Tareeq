import type { KaiMessage } from "@/lib/kai/chat-types";
import type { KaiMemoryUpdateCandidate } from "@/lib/kai/memory/memory-types";

export interface KaiChatResult {
  message: KaiMessage;
  summary?: string;
  source: "gemini" | "fallback";
  memoryUpdates?: KaiMemoryUpdateCandidate[];
  personSummary?: string;
  timings?: {
    firstTextMs?: number;
    modelMs: number;
    totalMs: number;
    attempts: number;
  };
}

export type KaiChatStreamEvent =
  | { type: "text"; text: string }
  | { type: "complete"; data: KaiChatResult }
  | { type: "error"; error: string; retryable: boolean };

function parseEvent(line: string): KaiChatStreamEvent | null {
  try {
    const value: unknown = JSON.parse(line);
    if (!value || typeof value !== "object") return null;
    const event = value as Partial<KaiChatStreamEvent>;
    if (event.type === "text" && typeof event.text === "string") {
      return { type: "text", text: event.text };
    }
    if (
      event.type === "complete" &&
      event.data &&
      typeof event.data === "object"
    ) {
      return event as Extract<KaiChatStreamEvent, { type: "complete" }>;
    }
    if (event.type === "error" && typeof event.error === "string") {
      return {
        type: "error",
        error: event.error,
        retryable: event.retryable !== false,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function readKaiChatStream(
  response: Response,
  onEvent: (event: KaiChatStreamEvent) => void,
): Promise<KaiChatResult> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      payload?.error || `Kai request failed (${response.status}).`,
    );
  }

  if (
    !response.body ||
    !response.headers.get("content-type")?.includes("application/x-ndjson")
  ) {
    const data = (await response.json()) as KaiChatResult;
    onEvent({ type: "complete", data });
    return data;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: KaiChatResult | null = null;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = parseEvent(line);
      if (!event) continue;
      onEvent(event);
      if (event.type === "complete") result = event.data;
      if (event.type === "error") throw new Error(event.error);
    }
    if (done) break;
  }

  if (buffer.trim()) {
    const event = parseEvent(buffer);
    if (event) {
      onEvent(event);
      if (event.type === "complete") result = event.data;
      if (event.type === "error") throw new Error(event.error);
    }
  }

  if (!result) throw new Error("Kai's response ended before it was complete.");
  return result;
}
