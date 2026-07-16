export interface GeminiStreamPayload {
  raw: string;
  finishReason?: string;
}

export function normalizeAbortTimeoutMs(timeoutMs: number): number {
  return Math.max(1, Math.floor(timeoutMs));
}

export function mergeGeminiChunk(current: string, chunk: string): string {
  if (!chunk) return current;
  if (chunk.startsWith(current)) return chunk;
  if (current.endsWith(chunk)) return current;
  return current + chunk;
}

/** Reads a JSON string field even while its closing quote has not arrived yet. */
export function extractPartialJsonString(input: string, field: string): string {
  const marker = new RegExp(`"${field}"\\s*:\\s*"`).exec(input);
  if (!marker) return "";
  let index = marker.index + marker[0].length;
  let result = "";

  while (index < input.length) {
    const char = input[index];
    if (char === '"') break;
    if (char !== "\\") {
      result += char;
      index += 1;
      continue;
    }

    const escaped = input[index + 1];
    if (!escaped) break;
    const simpleEscapes: Record<string, string> = {
      '"': '"',
      "\\": "\\",
      "/": "/",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
    };
    if (escaped === "u") {
      const hex = input.slice(index + 2, index + 6);
      if (!/^[0-9a-f]{4}$/i.test(hex)) break;
      result += String.fromCharCode(Number.parseInt(hex, 16));
      index += 6;
      continue;
    }
    result += simpleEscapes[escaped] ?? escaped;
    index += 2;
  }
  return result;
}

export async function readGeminiSse(
  response: Response,
  onText: (text: string) => void,
): Promise<GeminiStreamPayload> {
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
    if (!data || data === "[DONE]") return;
    try {
      const payload = JSON.parse(data) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
      };
      const candidate = payload.candidates?.[0];
      const chunk = candidate?.content?.parts?.[0]?.text;
      if (typeof chunk === "string") raw = mergeGeminiChunk(raw, chunk);
      if (candidate?.finishReason) finishReason = candidate.finishReason;
      const text = extractPartialJsonString(raw, "text");
      if (text && text !== lastText) {
        lastText = text;
        onText(text);
      }
    } catch {
      // A malformed provider event is ignored; the final JSON validation handles it.
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
