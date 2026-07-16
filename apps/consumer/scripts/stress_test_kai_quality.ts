import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { KaiChatContext } from "../lib/kai/chat-context";
import type { KaiMessageBlock } from "../lib/kai/chat-types";
import { readKaiChatStream, type KaiChatResult } from "../lib/kai/chat-stream";
import type { KaiMessageIntent } from "../lib/kai/intent";
import { getMissingRequiredBlocks } from "../lib/kai/required-blocks";

try {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
} catch {
  loadEnvFile(resolve(process.cwd(), "../../.env.local"));
}

const BASE_URL = process.env.KAI_QUALITY_BASE_URL || "http://localhost:3000";
const REPORT_PATH = resolve(
  process.cwd(),
  "docs/kai-audit/KAI_QUALITY_STRESS_TEST.md",
);

type BlockType = KaiMessageBlock["type"];

interface QualityCase {
  id: string;
  locale: "en" | "ar";
  prompt: string;
  expectedIntent: KaiMessageIntent;
  expectedAnyBlocks?: BlockType[];
  evidencePattern?: RegExp;
  expectsLocationClarification?: boolean;
}

interface CheckResult {
  name: string;
  pass: boolean;
}

interface JudgeScore {
  directness: number;
  relevance: number;
  specificity: number;
  actionability: number;
  epistemicCare: number;
  naturalness: number;
  note: string;
}

interface CaseResult {
  test: QualityCase;
  result: KaiChatResult;
  checks: CheckResult[];
  deterministicScore: number;
  judge?: JudgeScore;
  combinedScore?: number;
  transportError?: string;
}

const CASES: QualityCase[] = [
  {
    id: "en-cost-spain",
    locale: "en",
    prompt:
      "How much does a public bachelor's degree in Spain cost for an international student, including living costs?",
    expectedIntent: "fact_lookup",
    evidencePattern: /(€|eur|euro|\d)/i,
  },
  {
    id: "en-visa-spain",
    locale: "en",
    prompt:
      "What are the current student visa requirements for a non-EU student going to Spain?",
    expectedIntent: "fact_lookup",
    evidencePattern: /(visa|proof|insurance|financial|consulate|application)/i,
  },
  {
    id: "en-explain-result",
    locale: "en",
    prompt: "Explain why my result points to Law and Diplomacy.",
    expectedIntent: "explain_result",
    expectedAnyBlocks: ["insight_block"],
  },
  {
    id: "en-family",
    locale: "en",
    prompt: "How do I explain to my parents that I want to explore diplomacy?",
    expectedIntent: "family_conversation",
  },
  {
    id: "en-resources",
    locale: "en",
    prompt:
      "Recommend two beginner resources to understand international relations.",
    expectedIntent: "resource_recommendation",
    expectedAnyBlocks: ["learning_resources"],
  },
  {
    id: "en-action-plan",
    locale: "en",
    prompt: "Build me a practical 7-day plan to explore a career in diplomacy.",
    expectedIntent: "action_plan",
    expectedAnyBlocks: ["action_plan"],
  },
  {
    id: "en-comparison",
    locale: "en",
    prompt: "Compare studying Law in Spain and Egypt again.",
    expectedIntent: "career_comparison",
    expectedAnyBlocks: ["comparison", "comparison_table", "decision_matrix"],
  },
  {
    id: "en-university-location",
    locale: "en",
    prompt: "Which universities are good for Law?",
    expectedIntent: "university_guidance",
    expectsLocationClarification: true,
  },
  {
    id: "en-next-step",
    locale: "en",
    prompt: "What should my next step be after seeing this result?",
    expectedIntent: "next_step",
  },
  {
    id: "ar-cost-spain",
    locale: "ar",
    prompt:
      "كم تبلغ تكلفة البكالوريوس في جامعة حكومية في إسبانيا للطالب الدولي مع المعيشة؟",
    expectedIntent: "fact_lookup",
    evidencePattern: /(€|يورو|\d)/i,
  },
  {
    id: "ar-lawyer-salary",
    locale: "ar",
    prompt: "ما متوسط راتب المحامي في إسبانيا حاليًا؟",
    expectedIntent: "fact_lookup",
    evidencePattern: /(€|يورو|\d)/i,
  },
  {
    id: "ar-explain-result",
    locale: "ar",
    prompt: "اشرح لي لماذا تشير نتيجتي إلى القانون والدبلوماسية.",
    expectedIntent: "explain_result",
    expectedAnyBlocks: ["insight_block"],
  },
  {
    id: "ar-family",
    locale: "ar",
    prompt: "كيف أقنع أهلي بأن أدرس العلاقات الدولية؟",
    expectedIntent: "family_conversation",
  },
  {
    id: "ar-resources",
    locale: "ar",
    prompt: "اقترح لي مصدرين مناسبين للمبتدئين لفهم الدبلوماسية.",
    expectedIntent: "resource_recommendation",
    expectedAnyBlocks: ["learning_resources"],
  },
  {
    id: "ar-action-plan",
    locale: "ar",
    prompt: "أعطني خطة عملية من 7 أيام لاستكشاف مجال القانون.",
    expectedIntent: "action_plan",
    expectedAnyBlocks: ["action_plan"],
  },
  {
    id: "ar-comparison",
    locale: "ar",
    prompt: "قارن لي بين دراسة القانون والعلاقات الدولية.",
    expectedIntent: "career_comparison",
    expectedAnyBlocks: ["comparison", "comparison_table", "decision_matrix"],
  },
  {
    id: "ar-confidence",
    locale: "ar",
    prompt: "أنا قلق ولست واثقًا أنني مناسب لمسار الدبلوماسية.",
    expectedIntent: "confidence_building",
    expectedAnyBlocks: ["insight_block", "reflection_question"],
  },
  {
    id: "ar-study-plan",
    locale: "ar",
    prompt: "أحتاج خطة دراسة لأسبوعين لامتحان التاريخ.",
    expectedIntent: "study_plan",
    expectedAnyBlocks: ["action_plan"],
  },
];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function contextFor(test: QualityCase): KaiChatContext {
  return {
    user: {
      displayName: test.locale === "ar" ? "سارة" : "Sara",
      locale: test.locale,
    },
    assessment: {
      primaryCluster:
        test.locale === "ar" ? "القانون والدبلوماسية" : "Law and Diplomacy",
      confidence: 74,
      archetype: test.locale === "ar" ? "المستكشف" : "Explorer",
      rewardDriver: test.locale === "ar" ? "الإتقان" : "Mastery",
      ecosystemFit:
        test.locale === "ar" ? "تعاون مرن" : "Flexible collaborator",
      topClusters:
        test.locale === "ar"
          ? ["القانون والدبلوماسية", "الأعمال", "الناس وعلم النفس"]
          : ["Law and Diplomacy", "Business", "People and Psychology"],
    },
    report: {
      headline:
        test.locale === "ar"
          ? "فضولك يتجه نحو القانون والدبلوماسية."
          : "Your curiosity points toward Law and Diplomacy.",
      summary:
        test.locale === "ar"
          ? "اتجاه يستحق الاختبار وليس هوية ثابتة."
          : "A direction to test, not a fixed identity.",
      recommendedMajors:
        test.locale === "ar"
          ? ["القانون", "العلاقات الدولية"]
          : ["Law", "International Relations"],
      recommendedCareers:
        test.locale === "ar" ? ["محامٍ", "دبلوماسي"] : ["Lawyer", "Diplomat"],
    },
    journey: {
      completedAssessments: ["CORE Compass"],
      lockedModules: ["Deep Dive Interview"],
    },
    conversation: {
      goal: "explain_results",
      summary: "",
      recentMessages: [],
    },
    memories: {
      items: [
        {
          category: "career_interest",
          value: test.locale === "ar" ? "الدراسة في الخارج" : "Studying abroad",
        },
      ],
      personSummary: "",
    },
  };
}

function blockTypes(result: KaiChatResult): BlockType[] {
  return (result.message.blocks ?? []).map((block) => block.type);
}

function visibleModelContent(result: KaiChatResult): string {
  const blocks = (result.message.blocks ?? []).filter(
    (block) => block.type !== "source_list",
  );
  return `${result.message.text}\n${JSON.stringify(blocks)}`;
}

function scoreCase(test: QualityCase, result: KaiChatResult): CaseResult {
  const types = blockTypes(result);
  const content = visibleModelContent(result);
  const quickReplyCount = result.message.quickReplies?.length ?? 0;
  const missingRequired = getMissingRequiredBlocks(
    test.expectedIntent,
    result.message.blocks,
  );
  const recoveredArtifact =
    result.timings?.recoveredViaSimplified === true &&
    (content.match(/(?:^|\s)[1-9١-٩][.)-]/gu)?.length ?? 0) >= 3;
  const hasArabic = /[\u0600-\u06ff]/u.test(content);
  const usedDeterministicStarterPlan = (result.message.blocks ?? []).some(
    (block) =>
      block.type === "action_plan" &&
      (block.title === "A starting point" || block.title === "نقطة انطلاق"),
  );
  const genericFallback =
    result.source === "fallback" ||
    usedDeterministicStarterPlan ||
    /trouble thinking clearly|mind trying that again|أواجه صعوبة في التفكير|Watch a "day in the life"|تحدث مع شخص يعمل بالفعل/i.test(
      content,
    );
  const checks: CheckResult[] = [
    { name: "gemini_completed", pass: result.source === "gemini" },
    {
      name: "intent_contract",
      pass: result.message.intent === test.expectedIntent,
    },
    {
      name: "language_match",
      pass: test.locale === "ar" ? hasArabic : !hasArabic,
    },
    { name: "no_generic_fallback", pass: !genericFallback },
    {
      name: "required_artifact",
      pass: missingRequired.length === 0 || recoveredArtifact,
    },
    {
      name: "quick_replies",
      pass: quickReplyCount >= 2 && quickReplyCount <= 4,
    },
    {
      name: "bounded_answer",
      pass: content.split(/\s+/).filter(Boolean).length <= 260,
    },
  ];

  if (test.expectedAnyBlocks) {
    checks.push({
      name: "useful_structure",
      pass:
        test.expectedAnyBlocks.some((type) => types.includes(type)) ||
        recoveredArtifact,
    });
  }

  if (test.expectedIntent === "fact_lookup") {
    checks.push(
      { name: "grounded_sources", pass: types.includes("source_list") },
      {
        name: "direct_evidence",
        pass: test.evidencePattern?.test(content) ?? true,
      },
      { name: "no_unsolicited_plan", pass: !types.includes("action_plan") },
    );
  }

  if (test.expectsLocationClarification) {
    checks.push({
      name: "asks_for_location",
      pass:
        !types.includes("university_card") &&
        /(country|region|where|location)/i.test(content),
    });
  }

  const deterministicScore = Math.round(
    (checks.filter((check) => check.pass).length / checks.length) * 100,
  );
  return { test, result, checks, deterministicScore };
}

async function runCase(
  test: QualityCase,
  cookieHeader: string,
): Promise<CaseResult> {
  const response = await fetch(`${BASE_URL}/api/kai/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      kind: "reply",
      message: test.prompt,
      context: contextFor(test),
    }),
  });
  const result = await readKaiChatStream(response, () => undefined);
  return scoreCase(test, result);
}

function failedCase(test: QualityCase, error: unknown): CaseResult {
  const message = error instanceof Error ? error.message : String(error);
  const result: KaiChatResult = {
    message: {
      id: `quality-failure-${test.id}`,
      role: "kai",
      createdAt: new Date().toISOString(),
      text: `Quality test transport failure: ${message}`,
    },
    source: "fallback",
    timings: { modelMs: 0, totalMs: 15_000, attempts: 0 },
  };
  return { ...scoreCase(test, result), transportError: message };
}

async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<U>,
): Promise<U[]> {
  const results = new Array<U>(values.length);
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex++;
        results[index] = await worker(values[index]);
      }
    }),
  );
  return results;
}

function clampJudgeScore(value: unknown): number {
  return Math.min(5, Math.max(1, Math.round(Number(value) || 1)));
}

async function judgeBatch(
  batch: CaseResult[],
): Promise<Map<string, JudgeScore>> {
  const apiKey = requiredEnv("GEMINI_API_KEY");
  const model =
    process.env.GEMINI_EVAL_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3.1-flash-lite";
  const evaluationItems = batch.map(({ test, result }) => ({
    id: test.id,
    locale: test.locale,
    question: test.prompt,
    answer: result.message.text,
    blocks: (result.message.blocks ?? []).map((block) =>
      block.type === "source_list"
        ? {
            type: block.type,
            sources: block.sources.map((source) => source.title),
          }
        : block,
    ),
  }));
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Act as a strict bilingual career-coaching QA reviewer. Score each answer from 1 (poor) to 5 (excellent) on directness, relevance, specificity, appropriate actionability, epistemic care, and naturalness in its requested language. Actionability means the right amount for the question; do not penalize a factual answer for omitting a plan. Epistemic care means uncertainty and sources are handled responsibly, but do not claim to verify factual accuracy from source titles alone. Return one evaluation per id and one short diagnostic note.\n\n${JSON.stringify(evaluationItems)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          evaluations: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                directness: { type: "NUMBER" },
                relevance: { type: "NUMBER" },
                specificity: { type: "NUMBER" },
                actionability: { type: "NUMBER" },
                epistemic_care: { type: "NUMBER" },
                naturalness: { type: "NUMBER" },
                note: { type: "STRING" },
              },
              required: [
                "id",
                "directness",
                "relevance",
                "specificity",
                "actionability",
                "epistemic_care",
                "naturalness",
                "note",
              ],
            },
          },
        },
        required: ["evaluations"],
      },
    },
  };

  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (response.ok || response.status !== 503) break;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));
  }
  if (!response?.ok) {
    throw new Error(
      `Gemini judge failed (${response?.status ?? "no response"}).`,
    );
  }
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini judge returned no structured payload.");
  const parsed = JSON.parse(raw) as {
    evaluations?: Array<Record<string, unknown>>;
  };
  const scores = new Map<string, JudgeScore>();
  for (const evaluation of parsed.evaluations ?? []) {
    if (typeof evaluation.id !== "string") continue;
    scores.set(evaluation.id, {
      directness: clampJudgeScore(evaluation.directness),
      relevance: clampJudgeScore(evaluation.relevance),
      specificity: clampJudgeScore(evaluation.specificity),
      actionability: clampJudgeScore(evaluation.actionability),
      epistemicCare: clampJudgeScore(evaluation.epistemic_care),
      naturalness: clampJudgeScore(evaluation.naturalness),
      note: typeof evaluation.note === "string" ? evaluation.note.trim() : "",
    });
  }
  return scores;
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, index)];
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function semanticScore(score: JudgeScore): number {
  return Math.round(
    ((score.directness +
      score.relevance +
      score.specificity +
      score.actionability +
      score.epistemicCare +
      score.naturalness) /
      30) *
      100,
  );
}

function markdownReport(
  results: CaseResult[],
  judgeAvailable: boolean,
): string {
  const deterministic = average(
    results.map((result) => result.deterministicScore),
  );
  const semantic = average(
    results.flatMap((result) =>
      result.judge ? [semanticScore(result.judge)] : [],
    ),
  );
  const combined = average(
    results.map((result) => result.combinedScore ?? result.deterministicScore),
  );
  const factual = results.filter(
    (result) => result.test.expectedIntent === "fact_lookup",
  );
  const sourceCoverage = Math.round(
    (factual.filter((result) =>
      blockTypes(result.result).includes("source_list"),
    ).length /
      factual.length) *
      100,
  );
  const fallbackRate = Math.round(
    (results.filter((result) => result.result.source === "fallback").length /
      results.length) *
      100,
  );
  const recoveryRate = Math.round(
    (results.filter((result) => result.result.timings?.recoveredViaSimplified)
      .length /
      results.length) *
      100,
  );
  const intentAccuracy = Math.round(
    (results.filter(
      (result) => result.result.message.intent === result.test.expectedIntent,
    ).length /
      results.length) *
      100,
  );
  const localeAccuracy = Math.round(
    (results.filter(
      (result) =>
        result.checks.find((check) => check.name === "language_match")?.pass,
    ).length /
      results.length) *
      100,
  );
  const latencies = results.map(
    (result) => result.result.timings?.totalMs ?? 0,
  );
  const firstText = results
    .map((result) => result.result.timings?.firstTextMs)
    .filter((value): value is number => typeof value === "number");
  const pass =
    combined >= 85 &&
    sourceCoverage >= 90 &&
    fallbackRate === 0 &&
    recoveryRate <= 15 &&
    intentAccuracy === 100 &&
    localeAccuracy === 100 &&
    percentile(latencies, 95) < 15_000;
  const generatedAt = new Date().toISOString();

  const rows = results
    .map((result) => {
      const failedChecks = result.checks
        .filter((check) => !check.pass)
        .map((check) => check.name)
        .join(", ");
      const answer = result.result.message.text
        .replace(/\|/g, "\\|")
        .replace(/\s+/g, " ")
        .slice(0, 180);
      return `| ${result.test.id} | ${result.result.message.intent ?? "none"} | ${blockTypes(result.result).join(", ") || "text"} | ${result.deterministicScore} | ${result.judge ? semanticScore(result.judge) : "n/a"} | ${result.combinedScore ?? result.deterministicScore} | ${result.result.timings?.totalMs ?? 0} | ${failedChecks || "none"} | ${answer} |`;
    })
    .join("\n");

  const diagnostics = results
    .filter(
      (result) =>
        result.judge?.note || result.checks.some((check) => !check.pass),
    )
    .map((result) => {
      const failed = result.checks
        .filter((check) => !check.pass)
        .map((check) => check.name)
        .join(", ");
      return `- **${result.test.id}:** ${result.judge?.note || "No judge note."}${failed ? ` Failed checks: ${failed}.` : ""}`;
    })
    .join("\n");

  return `# Kai Quality Stress Test

Generated: ${generatedAt}

## Result

**${pass ? "PASS" : "FAIL"}** against the current quality gate.

| Metric | Result | Gate |
| --- | ---: | ---: |
| Cases | ${results.length} (${results.filter((result) => result.test.locale === "en").length} EN / ${results.filter((result) => result.test.locale === "ar").length} AR) | 18 |
| Combined quality | ${combined}% | >= 85% |
| Deterministic contract quality | ${deterministic}% | >= 90% target |
| Model-assisted rubric${judgeAvailable ? "" : " (unavailable)"} | ${judgeAvailable ? `${semantic}%` : "n/a"} | >= 80% target |
| Intent accuracy | ${intentAccuracy}% | 100% |
| Locale consistency | ${localeAccuracy}% | 100% |
| Factual source coverage | ${sourceCoverage}% | >= 90% |
| Fallback rate | ${fallbackRate}% | 0% |
| Text-only recovery rate | ${recoveryRate}% | <= 15% |
| Total latency p50 / p95 | ${percentile(latencies, 50)} ms / ${percentile(latencies, 95)} ms | p95 < 15,000 ms |
| First text p50 / p95 | ${percentile(firstText, 50)} ms / ${percentile(firstText, 95)} ms | observed |

The combined score weights deterministic contract checks at 60% and the separate rubric score at 40%. The rubric measures directness, relevance, specificity, appropriate actionability, epistemic care, and naturalness. It does not independently verify factual accuracy.

## Cases

| Case | Intent | Blocks | Contract | Rubric | Combined | Total ms | Failed checks | Answer preview |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${rows}

## Diagnostics

${diagnostics || "No failed checks or rubric diagnostics."}

## Method

- Exercised the real local \`/api/kai/chat\` endpoint with a confirmed disposable Supabase account.
- Ran ${results.length} independent prompts with concurrency 2 across factual, result explanation, family, resource, action-plan, comparison, university, confidence, next-step, and study-plan intents.
- Factual cases required provider-grounded source metadata and rejected unsolicited action plans.
- The disposable account was deleted after the run.
`;
}

async function main() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `kai-quality-${Date.now()}@example.com`;
  const password = `Kq-${randomUUID()}-9a!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(
      created.error?.message || "Could not create quality test user.",
    );
  }

  const userId = created.data.user.id;
  try {
    let authCookies: Array<{ name: string; value: string }> = [];
    const authClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => authCookies,
        setAll: (cookies) => {
          for (const cookie of cookies) {
            authCookies = authCookies.filter(
              (entry) => entry.name !== cookie.name,
            );
            authCookies.push({ name: cookie.name, value: cookie.value });
          }
        },
      },
    });
    const signedIn = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signedIn.error) throw new Error(signedIn.error.message);
    const cookieHeader = authCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    console.info(
      `Running ${CASES.length} Kai quality cases against ${BASE_URL}...`,
    );
    const results = await mapWithConcurrency(CASES, 2, async (test) => {
      let result: CaseResult;
      try {
        result = await runCase(test, cookieHeader);
      } catch (error) {
        result = failedCase(test, error);
      }
      console.info(
        `${test.id}: ${result.deterministicScore}% / ${result.result.timings?.totalMs ?? 0} ms`,
      );
      return result;
    });

    let judgeAvailable = !process.argv.includes("--skip-judge");
    if (judgeAvailable) {
      try {
        for (let index = 0; index < results.length; index += 6) {
          const scores = await judgeBatch(results.slice(index, index + 6));
          for (const result of results.slice(index, index + 6)) {
            result.judge = scores.get(result.test.id);
          }
        }
      } catch (error) {
        judgeAvailable = false;
        console.warn(
          "Rubric judge unavailable; deterministic metrics will still be reported.",
          error,
        );
      }
    }

    for (const result of results) {
      const semantic = result.judge ? semanticScore(result.judge) : undefined;
      result.combinedScore = semantic
        ? Math.round(result.deterministicScore * 0.6 + semantic * 0.4)
        : result.deterministicScore;
    }

    const report = markdownReport(results, judgeAvailable);
    await writeFile(REPORT_PATH, report, "utf8");
    console.info(`Quality report written to ${REPORT_PATH}`);
  } finally {
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error) {
      console.warn(
        "Failed to delete disposable quality user:",
        deleted.error.message,
      );
    } else {
      console.info("Disposable quality user deleted.");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
