import { assessmentQuestions } from "@/lib/assessment/questions";
import { buildBaseReport } from "@/lib/results/framework";
import {
  RESULTS_SYSTEM_PROMPT,
  buildFineTunePayload,
  buildUserContent,
  normalizeProseFields,
} from "@/lib/results/prompt";
import { pickProvider } from "@/lib/results/providers";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import { computeScore } from "@/lib/scoring";

export const runtime = "nodejs";

const MAX_ANSWERS = 100;
const MAX_ANSWER_LEN = 500;
const MAX_NAME_LEN = 80;

// Best-effort per-IP rate limit on the *LLM call* (not the whole endpoint).
// In-memory + per-instance — fine for a single server / local dev; a
// production multi-instance deploy should use a shared store (e.g. Upstash).
const LLM_LIMIT = 12;
const LLM_WINDOW_MS = 60_000;
const llmHits = new Map<string, { count: number; resetAt: number }>();

type GenerateResultBody = {
  name?: string;
  email?: string;
  answers?: Record<string, string>;
};

function isAnswerRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.length > MAX_ANSWERS) return false;
  return entries.every(
    ([, entry]) => typeof entry === "string" && entry.length <= MAX_ANSWER_LEN,
  );
}

/** Trim, cap, and strip prompt-injection-ish markers from the learner name. */
function sanitizeName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const clean = raw.trim().slice(0, MAX_NAME_LEN).replace(/[<>{}[\]]/g, "");
  return clean || undefined;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  );
}

function isLlmRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = llmHits.get(ip);
  if (!entry || now > entry.resetAt) {
    llmHits.set(ip, { count: 1, resetAt: now + LLM_WINDOW_MS });
    if (llmHits.size > 5000) {
      for (const [key, value] of llmHits) {
        if (now > value.resetAt) llmHits.delete(key);
      }
    }
    return false;
  }
  entry.count += 1;
  return entry.count > LLM_LIMIT;
}

export async function POST(request: Request) {
  let body: GenerateResultBody;

  try {
    body = (await request.json()) as GenerateResultBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAnswerRecord(body.answers)) {
    return Response.json(
      { error: "answers must be a string record (max 100 entries)." },
      { status: 400 },
    );
  }

  const name = sanitizeName(body.name);

  // The deterministic engine is the source of truth: it produces the cluster,
  // the lists, AND a complete doc-compliant BASE report. The AI only rewrites
  // the prose on top of this; the lists/cluster/score are never AI-generated.
  const result = computeScore(body.answers, assessmentQuestions);
  const base = buildBaseReport({
    result,
    name,
    fallbackReason: "AI fine-tuning was not available.",
  });

  // Gate the (paid) LLM call, but still return the real deterministic report.
  if (isLlmRateLimited(clientIp(request))) {
    return Response.json({
      report: {
        ...base,
        fallbackReason:
          "Showing your compass from the scoring engine (generation rate limit reached).",
      } satisfies PersonalizedCompassReport,
    });
  }

  const provider = pickProvider();
  if (!provider) {
    return Response.json({
      report: {
        ...base,
        fallbackReason:
          "No results provider is configured (set GEMINI_API_KEY or ANTHROPIC_API_KEY).",
      } satisfies PersonalizedCompassReport,
    });
  }

  const payload = buildFineTunePayload(result, name, base, body.answers);
  const userContent = buildUserContent(payload);

  try {
    const { generated, model, source } = await provider.generate({
      system: RESULTS_SYSTEM_PROMPT,
      userContent,
    });

    const report: PersonalizedCompassReport = {
      ...base, // deterministic cluster, score, and ALL lists
      ...normalizeProseFields(generated, base), // AI-polished prose only
      generatedAt: new Date().toISOString(),
      source,
      model,
      fallbackReason: undefined,
    };

    return Response.json({ report });
  } catch (error) {
    // Full detail to the server log; only a sanitized message to the client.
    console.error("[results/generate] provider error:", error);
    const reason =
      error instanceof Error ? error.message : "Generation failed.";
    return Response.json({
      report: {
        ...base,
        fallbackReason: reason.slice(0, 200),
      } satisfies PersonalizedCompassReport,
    });
  }
}
