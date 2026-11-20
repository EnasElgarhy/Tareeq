import { extractPartialJsonString } from "@/lib/kai/gemini-stream";

/**
 * Kai on Claude (Anthropic Messages API). The reply arrives as JSON in the
 * same shape the Gemini path returns, so the rest of the chat route does not
 * change. Two ways to get that JSON, by model:
 *  - a forced tool call, whose input is the reply: the fastest (measured about
 *    0.5 s to Kai's first word on Haiku 5.5);
 *  - structured output, for Sonnet 5.5, which rejects a forced tool choice.
 */

export const ANTHROPIC_MESSAGES_ENDPOINT = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";
export const DEFAULT_ANTHROPIC_KAI_MODEL = "claude-haiku-5-5";
/** The one tool Kai is made to call; its input is her structured reply. */
export const KAI_REPLY_TOOL = "kai_reply";

/** Sonnet 5.5 answers "tool_choice: type tool and any are not supported for this model". */
export function supportsForcedTool(model: string): boolean {
  return !model.startsWith("claude-sonnet-5");
}

export interface AnthropicStreamPayload {
  /** The reply as raw JSON text. */
  raw: string;
  /** In the Gemini vocabulary the route already checks: "STOP" or "MAX_TOKENS". */
  finishReason?: string;
}

type JsonSchema = Record<string, unknown>;

const TYPE_NAMES: Readonly<Record<string, string>> = {
  OBJECT: "object",
  ARRAY: "array",
  STRING: "string",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The reply schemas are written in Gemini's dialect (upper-case type names,
 * `nullable`). Claude takes JSON Schema and requires every object to be closed
 * (`additionalProperties: false`), so this returns the same schema in that form
 * without touching the originals.
 */
export function toJsonSchema(schema: unknown): JsonSchema {
  if (!isRecord(schema)) return {};
  const { type, nullable, properties, items, ...rest } = schema;
  const jsonType = typeof type === "string" ? (TYPE_NAMES[type] ?? type.toLowerCase()) : undefined;
  return {
    ...rest,
    ...(jsonType ? { type: nullable === true ? [jsonType, "null"] : jsonType } : {}),
    ...(isRecord(properties)
      ? {
          properties: Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [key, toJsonSchema(value)]),
          ),
        }
      : {}),
    ...(items !== undefined ? { items: toJsonSchema(items) } : {}),
    ...(jsonType === "object" ? { additionalProperties: false } : {}),
  };
}

interface AnthropicRequestInput {
  model: string;
  systemPrompt: string;
  prompt: string;
  /** The reply schema, in Gemini's dialect. */
  responseSchema: unknown;
  maxTokens: number;
}

/**
 * Kai answers a chat turn straight away: left on, the model reasons before
 * every reply, which measured 3 to 5 seconds before her first word instead of
 * about 1. Each model family names "off" differently and the API rejects the
 * other spelling; Opus 5.5 cannot switch it off at all, so nothing is sent.
 */
export function thinkingOff(model: string): { type: "between_tools" | "disabled" } | undefined {
  if (model.startsWith("claude-opus-5")) return undefined;
  return { type: model.startsWith("claude-sonnet-5") ? "between_tools" : "disabled" };
}

export function buildAnthropicRequest(input: AnthropicRequestInput) {
  const schema = toJsonSchema(input.responseSchema);
  return {
    model: input.model,
    max_tokens: input.maxTokens,
    stream: true,
    ...(thinkingOff(input.model) ? { thinking: thinkingOff(input.model) } : {}),
    // The system prompt is long and identical on every turn: cached, later
    // turns read it at a fraction of the price.
    system: [{ type: "text", text: input.systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: input.prompt }],
    ...(supportsForcedTool(input.model)
      ? {
          tools: [
            {
              name: KAI_REPLY_TOOL,
              description: "Kai's reply to the student. Always call this exactly once.",
              input_schema: schema,
            },
          ],
          tool_choice: { type: "tool", name: KAI_REPLY_TOOL },
        }
      : { output_config: { format: { type: "json_schema", schema } } }),
  };
}

interface AnthropicEvent {
  type?: string;
  delta?: { type?: string; text?: string; partial_json?: string; stop_reason?: string };
  error?: { type?: string; message?: string };
}

function finishReasonOf(stopReason: string): string {
  return stopReason === "max_tokens" ? "MAX_TOKENS" : "STOP";
}

/**
 * Reads the event stream of a structured reply. `onText` gets Kai's message
 * so far each time it grows, exactly as the Gemini reader does.
 */
export async function readAnthropicSse(
  response: Response,
  onText: (text: string) => void,
): Promise<AnthropicStreamPayload> {
  if (!response.body) return { raw: "" };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let raw = "";
  let finishReason: string | undefined;
  let lastText = "";

  const consumeLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data) return;
    let event: AnthropicEvent;
    try {
      event = JSON.parse(data) as AnthropicEvent;
    } catch {
      // A malformed event is skipped; the final JSON validation catches a broken reply.
      return;
    }
    if (event.type === "error") {
      throw new Error(`Anthropic stream error: ${event.error?.type ?? "unknown"}`);
    }
    // The reply JSON comes as tool input (forced tool) or as text (structured
    // output); a request uses one of the two, never both.
    const delta = event.type === "content_block_delta" ? event.delta : undefined;
    const piece =
      delta?.type === "input_json_delta"
        ? delta.partial_json
        : delta?.type === "text_delta"
          ? delta.text
          : undefined;
    if (piece !== undefined) {
      raw += piece;
      const text = extractPartialJsonString(raw, "text");
      if (text && text !== lastText) {
        lastText = text;
        onText(text);
      }
    }
    if (event.type === "message_delta" && event.delta?.stop_reason) {
      finishReason = finishReasonOf(event.delta.stop_reason);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
    if (done) break;
  }
  if (buffer) consumeLine(buffer);
  return { raw, finishReason };
}
