import { describe, expect, test } from "vitest";
import {
  buildAnthropicRequest,
  KAI_REPLY_TOOL,
  readAnthropicSse,
  toJsonSchema,
} from "./anthropic-stream";
import { buildCoreResponseSchema } from "./core/core-prompt";

function sseResponse(events: object[], chunkSize = 37): Response {
  const body = events.map((event) => `event: x\ndata: ${JSON.stringify(event)}\n\n`).join("");
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Split mid-line on purpose: network chunks never respect event borders.
      for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize));
      controller.close();
    },
  });
  return new Response(stream);
}

const jsonDelta = (text: string) => ({
  type: "content_block_delta",
  index: 0,
  delta: { type: "text_delta", text },
});

describe("toJsonSchema", () => {
  test("turns Gemini type names into JSON Schema ones at every depth", () => {
    const schema = toJsonSchema({
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "Kai's message." },
        replies: { type: "ARRAY", items: { type: "STRING" } },
        flagged: { type: "BOOLEAN" },
      },
      required: ["text"],
    });

    expect(schema).toEqual({
      type: "object",
      properties: {
        text: { type: "string", description: "Kai's message." },
        replies: { type: "array", items: { type: "string" } },
        flagged: { type: "boolean" },
      },
      required: ["text"],
      additionalProperties: false,
    });
  });

  test("closes nested objects too, as Claude requires", () => {
    const schema = toJsonSchema({
      type: "ARRAY",
      items: { type: "OBJECT", properties: { tool: { type: "STRING" } } },
    });

    expect(schema).toEqual({
      type: "array",
      items: { type: "object", properties: { tool: { type: "string" } }, additionalProperties: false },
    });
  });

  test("writes a nullable field as a type that also allows null", () => {
    expect(toJsonSchema({ type: "STRING", nullable: true })).toEqual({ type: ["string", "null"] });
  });

  test("leaves the original schema untouched", () => {
    const original = buildCoreResponseSchema();
    const before = JSON.stringify(original);

    toJsonSchema(original);

    expect(JSON.stringify(original)).toBe(before);
  });

  test("converts the CORE reply schema with no Gemini type name left", () => {
    const converted = JSON.stringify(toJsonSchema(buildCoreResponseSchema()));

    expect(converted).not.toMatch(/"(OBJECT|ARRAY|STRING|BOOLEAN|NUMBER|INTEGER)"/);
  });
});

describe("buildAnthropicRequest", () => {
  const requestFor = (model: string) =>
    buildAnthropicRequest({
      model,
      systemPrompt: "You are Kai.",
      prompt: "Hello",
      responseSchema: buildCoreResponseSchema(),
      maxTokens: 1024,
    });

  test("makes Haiku call the reply tool, the fastest way to a structured reply", () => {
    const request = requestFor("claude-haiku-5-5");

    expect(request).toMatchObject({
      tool_choice: { type: "tool", name: KAI_REPLY_TOOL },
      tools: [{ name: KAI_REPLY_TOOL, input_schema: { type: "object" } }],
    });
    expect(request).not.toHaveProperty("output_config");
  });

  test("uses structured output on Sonnet 5.5, which rejects a forced tool call", () => {
    const request = requestFor("claude-sonnet-5-5");

    expect(request).toMatchObject({ output_config: { format: { type: "json_schema", schema: { type: "object" } } } });
    expect(request).not.toHaveProperty("tool_choice");
  });

  test("streams and caches the system prompt on every model", () => {
    const request = requestFor("claude-haiku-5-5");

    expect(request.system[0]?.cache_control).toEqual({ type: "ephemeral" });
    expect(request.stream).toBe(true);
  });

  test("turns thinking off in the way each model accepts, so Kai starts replying at once", () => {
    const requestFor = (model: string) =>
      buildAnthropicRequest({ model, systemPrompt: "s", prompt: "p", responseSchema: {}, maxTokens: 10 });

    expect(requestFor("claude-sonnet-5-5").thinking).toEqual({ type: "between_tools" });
    expect(requestFor("claude-haiku-5-5").thinking).toEqual({ type: "disabled" });
    expect(requestFor("claude-opus-5-5")).not.toHaveProperty("thinking");
  });
});

describe("readAnthropicSse", () => {
  test("rebuilds the reply JSON and reports Kai's message as it grows", async () => {
    const seen: string[] = [];
    const response = sseResponse([
      { type: "message_start", message: {} },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      jsonDelta('{"text": "مرحبا'),
      jsonDelta('، كيف'),
      jsonDelta(' حالك؟", "quickReplies": ["بخير"]}'),
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn" } },
      { type: "message_stop" },
    ]);

    const result = await readAnthropicSse(response, (text) => seen.push(text));

    expect(JSON.parse(result.raw)).toEqual({ text: "مرحبا، كيف حالك؟", quickReplies: ["بخير"] });
    expect(result.finishReason).toBe("STOP");
    expect(seen.at(-1)).toBe("مرحبا، كيف حالك؟");
    expect(seen.length).toBeGreaterThan(1);
  });

  test("reads a reply that arrives as the input of the forced tool call", async () => {
    const toolDelta = (partial_json: string) => ({
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json },
    });
    const seen: string[] = [];
    const response = sseResponse([
      { type: "content_block_start", index: 0, content_block: { type: "tool_use", name: KAI_REPLY_TOOL } },
      toolDelta('{"text": "Hello'),
      toolDelta(' Sara", "events": []}'),
      { type: "message_delta", delta: { stop_reason: "tool_use" } },
    ]);

    const result = await readAnthropicSse(response, (text) => seen.push(text));

    expect(JSON.parse(result.raw)).toEqual({ text: "Hello Sara", events: [] });
    expect(result.finishReason).toBe("STOP");
    expect(seen.at(-1)).toBe("Hello Sara");
  });

  test("reports a reply cut off by the token limit as MAX_TOKENS", async () => {
    const response = sseResponse([
      jsonDelta('{"text": "A long answer that never'),
      { type: "message_delta", delta: { stop_reason: "max_tokens" } },
    ]);

    const result = await readAnthropicSse(response, () => undefined);

    expect(result.finishReason).toBe("MAX_TOKENS");
  });

  test("throws when the provider sends an error event mid-stream", async () => {
    const response = sseResponse([
      jsonDelta('{"text": "Hi'),
      { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
    ]);

    await expect(readAnthropicSse(response, () => undefined)).rejects.toThrow("overloaded_error");
  });

  test("returns an empty reply when there is no body", async () => {
    const result = await readAnthropicSse(new Response(null), () => undefined);

    expect(result.raw).toBe("");
  });
});
