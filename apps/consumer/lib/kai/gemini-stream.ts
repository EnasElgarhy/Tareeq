export interface GeminiGroundingSource {
  title: string;
  url: string;
}

export interface GeminiStreamPayload {
  raw: string;
  finishReason?: string;
  sources?: GeminiGroundingSource[];
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
  groundingMetadata?: {
    groundingChunks?: Array<{
      web?: { uri?: string; title?: string };
    }>;
  };
}

function collectGroundingSources(
  candidate: GeminiCandidate | undefined,
  sourcesByUrl: Map<string, GeminiGroundingSource>,
) {
  for (const groundingChunk of candidate?.groundingMetadata?.groundingChunks ??
    []) {
    const url = groundingChunk.web?.uri?.trim();
    if (!url || sourcesByUrl.has(url) || !/^https?:\/\//i.test(url)) continue;
    const title = groundingChunk.web?.title?.trim() || new URL(url).hostname;
    sourcesByUrl.set(url, { title, url });
  }
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
  const sourcesByUrl = new Map<string, GeminiGroundingSource>();

  const consumeLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const payload = JSON.parse(data) as { candidates?: GeminiCandidate[] };
      const candidate = payload.candidates?.[0];
      const chunk = candidate?.content?.parts?.[0]?.text;
      if (typeof chunk === "string") raw = mergeGeminiChunk(raw, chunk);
      if (candidate?.finishReason) finishReason = candidate.finishReason;
      collectGroundingSources(candidate, sourcesByUrl);
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
  const sources = [...sourcesByUrl.values()].slice(0, 5);
  return {
    raw,
    finishReason,
    ...(sources.length > 0 ? { sources } : {}),
  };
}

/** Grounded calls use generateContent rather than streamGenerateContent:
 * Gemini currently includes groundingMetadata only on the non-streaming
 * response. The answer still emits once as soon as that response arrives. */
export async function readGeminiJson(
  response: Response,
  onText: (text: string) => void,
): Promise<GeminiStreamPayload> {
  const payload = (await response.json()) as {
    candidates?: GeminiCandidate[];
  };
  const candidate = payload.candidates?.[0];
  const raw =
    candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const text = extractPartialJsonString(raw, "text");
  if (text) onText(text);
  const sourcesByUrl = new Map<string, GeminiGroundingSource>();
  collectGroundingSources(candidate, sourcesByUrl);
  const sources = [...sourcesByUrl.values()].slice(0, 5);
  return {
    raw,
    finishReason: candidate?.finishReason,
    ...(sources.length > 0 ? { sources } : {}),
  };
}
