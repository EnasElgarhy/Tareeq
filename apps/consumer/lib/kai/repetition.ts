/**
 * Degenerate-output detection for the Kai chat Gemini calls.
 *
 * Phase 1 audit (docs/kai-audit/) measured that gemini-2.5-flash, on complex
 * structured-output intents (action_plan, family_script, roadmap, comparison),
 * falls into a repetition loop — emitting long runs of a single character
 * (usually "\n") until it saturates maxOutputTokens (finishReason MAX_TOKENS)
 * and returns truncated, unparseable JSON. An identical retry re-hits the same
 * bad trajectory (measured), so the caller must CLASSIFY this rather than
 * blindly retry.
 *
 * Pure + deterministic so it can be unit-tested in isolation.
 */

export interface RepetitionVerdict {
  /** True when the output looks like a degenerate loop / cap saturation. */
  degenerate: boolean;
  /** Machine code for logging/analytics; null when not degenerate. */
  reason:
    | "max_tokens"
    | "repeated_char_run"
    | "low_unique_ratio"
    | "unbalanced_json"
    | null;
}

const OK: RepetitionVerdict = { degenerate: false, reason: null };

/** A single character (or CRLF/space) repeated this many times in a row is
 *  never legitimate JSON content — it is the classic loop signature. */
const MAX_REPEATED_RUN = 40;

/** Below this fraction of distinct characters, a long output is almost
 *  certainly a loop rather than real prose/JSON. */
const MIN_UNIQUE_RATIO = 0.02;

/** Only apply the ratio/brace heuristics to outputs long enough to be
 *  confidently degenerate (short outputs are just short answers). */
const LONG_OUTPUT_CHARS = 1500;

/**
 * Classify a raw Gemini text output BEFORE attempting JSON.parse.
 *
 * @param raw           the model's raw text part (may be "" / undefined)
 * @param finishReason  Gemini candidate finishReason (e.g. "STOP", "MAX_TOKENS")
 */
export function detectDegenerateOutput(
  raw: string | null | undefined,
  finishReason?: string | null,
): RepetitionVerdict {
  const text = typeof raw === "string" ? raw : "";

  // Hard signal: the model ran to the output cap. A completed answer stops on
  // its own ("STOP"); hitting MAX_TOKENS means it never closed the JSON.
  if (finishReason === "MAX_TOKENS") {
    return { degenerate: true, reason: "max_tokens" };
  }

  if (text.length === 0) return OK;

  // A long run of one repeated character (the observed "\n\n\n…" loop).
  if (hasLongRepeatedRun(text, MAX_REPEATED_RUN)) {
    return { degenerate: true, reason: "repeated_char_run" };
  }

  // For long outputs only. Check the specific signal first — JSON that never
  // closes its braces (truncated mid-structure) — then the fuzzier
  // low-diversity heuristic.
  if (text.length >= LONG_OUTPUT_CHARS) {
    if (!bracesBalanced(text)) {
      return { degenerate: true, reason: "unbalanced_json" };
    }
    if (uniqueCharRatio(text) < MIN_UNIQUE_RATIO) {
      return { degenerate: true, reason: "low_unique_ratio" };
    }
  }

  return OK;
}

function hasLongRepeatedRun(text: string, threshold: number): boolean {
  let runChar = "";
  let runLen = 0;
  for (const ch of text) {
    if (ch === runChar) {
      runLen += 1;
      if (runLen >= threshold) return true;
    } else {
      runChar = ch;
      runLen = 1;
    }
  }
  return false;
}

function uniqueCharRatio(text: string): number {
  const distinct = new Set(text).size;
  return distinct / text.length;
}

/** Cheap balance check ignoring braces inside strings — good enough to catch
 *  output truncated mid-object (far more opening than closing braces). */
function bracesBalanced(text: string): boolean {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
  }
  return depth === 0;
}
