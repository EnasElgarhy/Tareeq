/**
 * Live audit of Kai's subject-guide behaviour (developer note, 17 Nov 2026).
 * Sends a few subject questions through the real prompt, context and model,
 * exactly as /api/kai/chat does, and prints each reply for review.
 *
 *   corepack pnpm exec tsx scripts/audit_kai_subject_guide.ts
 *
 * Needs GEMINI_API_KEY in .env.local. About one model call per case.
 */
import { readFileSync } from "node:fs";
import { SAMPLE_STUDENT } from "@/lib/core-v2/content/sample";
import { scoreCore } from "@/lib/core-v2/scoring";
import { runCoreKaiTurn, type CoreModelCall } from "@/lib/kai/core/core-turn";
import type { KaiChatContext } from "@/lib/kai/chat-context";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
const apiKey = env.GEMINI_API_KEY;
const model = env.GEMINI_MODEL || "gemini-2.5-flash";
if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env.local");

const callModel: CoreModelCall = async ({
  systemPrompt,
  prompt,
  responseSchema,
}) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    },
  );
  if (!response.ok)
    return {
      ok: false,
      reason: `http_${response.status}`,
      retryable: response.status >= 500,
    };
  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    return { ok: true, parsed: JSON.parse(text) };
  } catch {
    return { ok: false, reason: "unparseable", retryable: true };
  }
};

const result = scoreCore(SAMPLE_STUDENT);

const CASES: Array<{
  name: string;
  country: string;
  locale: "en" | "ar";
  message: string;
}> = [
  {
    name: "UAE, usual subjects for medicine",
    country: "United Arab Emirates",
    locale: "en",
    message:
      "I'm in grade 11 in the UAE Ministry system. What subjects do students usually take if they want to study medicine?",
  },
  {
    name: "UAE, prescriptive question",
    country: "United Arab Emirates",
    locale: "en",
    message:
      "I'm in grade 10, Ministry system. Should I take physics if I want to do engineering? Do I need it?",
  },
  {
    name: "Egypt, subject already chosen",
    country: "Egypt",
    locale: "en",
    message:
      "I'm in Thanaweya Amma, literary section (adabi). Is engineering impossible for me now?",
  },
  {
    name: "Saudi, Arabic",
    country: "Saudi Arabia",
    locale: "ar",
    message:
      "أنا في الصف الحادي عشر في السعودية، المسار العام. ما المسار الذي يأخذه الطلاب عادةً لدراسة علوم الحاسب؟",
  },
  {
    name: "Country not in the guide",
    country: "Jordan",
    locale: "en",
    message:
      "I live in Jordan, grade 11 Tawjihi. Which subjects do I need for data science?",
  },
  {
    name: "UAE, entry not yet researched",
    country: "United Arab Emirates",
    locale: "en",
    message:
      "I'm in grade 12 in the UAE, Ministry Advanced stream. What do students usually need for police academies or military colleges?",
  },
];

function context(locale: "en" | "ar"): KaiChatContext {
  return {
    user: { displayName: "Sara", locale },
    assessment: null,
    report: null,
    journey: { completedAssessments: [], lockedModules: [] },
    conversation: { goal: "find_majors", summary: "", recentMessages: [] },
    memories: { items: [], personSummary: "" },
  } as unknown as KaiChatContext;
}

async function main() {
  for (const testCase of CASES) {
    const turn = await runCoreKaiTurn({
      core: {
        result,
        previousResult: null,
        isFlagged: false,
        entryPromptId: null,
        profile: {
          gender: "female",
          ageBand: "13-17",
          academicStage: null,
          country: testCase.country,
        },
        priorDisagreements: [],
      },
      context: context(testCase.locale),
      kind: "reply",
      message: testCase.message,
      callModel,
    });
    const fromBlocks =
      turn.message.blocks
        ?.map((block) => ("text" in block ? block.text : ""))
        .join(" ") ?? "";
    const text = fromBlocks || turn.message.text || "";
    console.log(
      `\n=== ${testCase.name} (${turn.source}) ===\nQ: ${testCase.message}\nKai: ${text || JSON.stringify(turn.message).slice(0, 600)}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
