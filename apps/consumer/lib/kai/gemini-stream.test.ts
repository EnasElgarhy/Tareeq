import { describe, expect, it } from "vitest";
import {
  extractPartialJsonString,
  mergeGeminiChunk,
  normalizeAbortTimeoutMs,
  readGeminiJson,
  readGeminiSse,
} from "@/lib/kai/gemini-stream";

describe("Gemini streaming helpers", () => {
  it("normalizes fractional deadlines for AbortSignal.timeout", () => {
    expect(normalizeAbortTimeoutMs(14_812.75)).toBe(14_812);
    expect(normalizeAbortTimeoutMs(0.5)).toBe(1);
  });

  it("extracts an unfinished escaped text field", () => {
    expect(extractPartialJsonString('{"text":"Hello\\nKai', "text")).toBe(
      "Hello\nKai",
    );
    expect(
      extractPartialJsonString('{"intent":"general","text":"مرحبا', "text"),
    ).toBe("مرحبا");
  });

  it("merges provider deltas and cumulative chunks", () => {
    expect(mergeGeminiChunk('{"text":"Hel', 'lo"}')).toBe('{"text":"Hello"}');
    expect(mergeGeminiChunk('{"text":"Hel', '{"text":"Hello')).toBe(
      '{"text":"Hello',
    );
  });

  it("emits partial text while collecting the final JSON", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"candidates":[{"content":{"parts":[{"text":"{\\"text\\":\\"Hello"}]}}]}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'data: {"candidates":[{"content":{"parts":[{"text":" Kai\\",\\"intent\\":\\"general_question\\"}"}]},"finishReason":"STOP"}]}\n\n',
          ),
        );
        controller.close();
      },
    });
    const seen: string[] = [];
    const result = await readGeminiSse(new Response(body), (text) =>
      seen.push(text),
    );
    expect(seen).toEqual(["Hello", "Hello Kai"]);
    expect(JSON.parse(result.raw)).toMatchObject({ text: "Hello Kai" });
    expect(result.finishReason).toBe("STOP");
  });

  it("collects and deduplicates grounded web sources from streamed candidates", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"candidates":[{"content":{"parts":[{"text":"{\\"text\\":\\"Tuition varies.\\"}"}]},"finishReason":"STOP","groundingMetadata":{"groundingChunks":[{"web":{"uri":"https://example.edu/fees","title":"Official fees"}},{"web":{"uri":"https://example.edu/fees","title":"Official fees"}},{"web":{"uri":"https://gov.example/visa","title":"Visa guidance"}}]}}]}\n\n',
          ),
        );
        controller.close();
      },
    });

    const result = await readGeminiSse(new Response(body), () => undefined);
    expect(result.sources).toEqual([
      { url: "https://example.edu/fees", title: "Official fees" },
      { url: "https://gov.example/visa", title: "Visa guidance" },
    ]);
  });

  it("reads grounded sources from a non-streaming Gemini response", async () => {
    const response = new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    text: "Public tuition varies by region.",
                    intent: "fact_lookup",
                  }),
                },
              ],
            },
            finishReason: "STOP",
            groundingMetadata: {
              groundingChunks: [
                {
                  web: {
                    uri: "https://education.example/fees",
                    title: "Official tuition guidance",
                  },
                },
              ],
            },
          },
        ],
      }),
    );
    const seen: string[] = [];
    const result = await readGeminiJson(response, (text) => seen.push(text));
    expect(seen).toEqual(["Public tuition varies by region."]);
    expect(result.sources).toEqual([
      {
        url: "https://education.example/fees",
        title: "Official tuition guidance",
      },
    ]);
  });
});
