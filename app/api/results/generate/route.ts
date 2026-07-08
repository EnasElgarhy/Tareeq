import { assessmentQuestions } from "@/lib/assessment/questions";
import { trackEvent } from "@/lib/analytics/track";
import { computeScore } from "@/lib/scoring";
import {
  buildFallbackReport,
  createAnswerDigest,
  getClusterProfile,
  getEcosystemFit,
  getMultiCuriousClusters,
} from "@/lib/results/framework";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import { isLocale, type Locale } from "@/lib/i18n/locale";

export const runtime = "nodejs";

const ANTHROPIC_MESSAGES_ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

type GenerateResultBody = {
  name?: string;
  email?: string;
  answers?: Record<string, string>;
  locale?: string;
};

function isAnswerRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function extractJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("No JSON");
    return JSON.parse(text.slice(start, end + 1));
  }
}

function normalizeList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const list = value.filter(
    (entry): entry is string => typeof entry === "string",
  );
  return list.length > 0 ? list : fallback;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
      { error: "answers must be a string record." },
      { status: 400 },
    );
  }

  const locale: Locale = isLocale(body.locale) ? body.locale : "en";
  const result = computeScore(body.answers, assessmentQuestions);
  const fallback = buildFallbackReport({
    result,
    name: body.name,
    fallbackReason: "Claude generation was not available.",
    locale,
  });

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    trackEvent("results_generated", { source: "fallback", reason: "missing_api_key" });
    return Response.json({
      report: {
        ...fallback,
        model,
        fallbackReason: "ANTHROPIC_API_KEY is not configured.",
      } satisfies PersonalizedCompassReport,
    });
  }

  const ecosystemFit = getEcosystemFit(result);
  const multiCuriousCodes = getMultiCuriousClusters(result);
  const answerDigest = createAnswerDigest(body.answers, assessmentQuestions);
  // Cluster context sent to Claude stays in English regardless of the
  // target output language — it's reasoning input, not user-facing text;
  // the system prompt below separately instructs the output language.
  const topCluster = getClusterProfile(result.topCluster, "en");

  const promptPayload = {
    learner: {
      name: body.name || "the learner",
      // Do not send email to Claude. The app collects it for account/contact
      // continuity; generation only needs the learner's first-person context.
    },
    outputLanguage: locale === "ar" ? "Arabic" : "English",
    score: {
      topClusterCode: result.topCluster,
      topClusterName: topCluster.name,
      rawClusterScores: result.clusterRaw,
      modifierBonuses: result.clusterBonus,
      finalClusterScores: result.clusterFinal,
      clusterRanked: result.clusterRanked,
      confidencePercentage: result.confidencePercentage,
      confidenceLabel: result.confidenceLabel,
      isMultiCurious: multiCuriousCodes.length >= 3,
      multiCuriousClusters: multiCuriousCodes.map(
        (code) => getClusterProfile(code, "en").name,
      ),
      archetype: result.archetype,
      primaryDrivers:
        result.primaryDrivers.length > 0
          ? result.primaryDrivers.map((code) => result.driverNames[code])
          : ["Balanced"],
      secondaryDrivers: result.secondaryDrivers.map(
        (code) => result.driverNames[code],
      ),
      ecosystemFit,
      axes: result.axes,
    },
    answers: answerDigest,
    requiredOutputShape: {
      headline: "string",
      summary: "string",
      academicPath: "string",
      careerLandscape: "string",
      integration: "string",
      realityCheck: "string",
      nextSteps: "string",
      highSchoolSubjects: ["string"],
      universityMajors: ["string"],
      careerExamples: ["string"],
      nonObviousPaths: ["string"],
    },
  };

  trackEvent("ai_generation_started", { kind: "results_narrative", model });

  const response = await fetch(ANTHROPIC_MESSAGES_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2200,
      temperature: 0.35,
      system:
        `You generate CORE Assessment career guidance for Tareeq. Follow these rules exactly: provide guidance, not personality labels; never present the top cluster as a fixed destiny, diagnosis, or prescription; use language like 'your answers point to high curiosity for...' or 'your curiosity compass is pointing toward...'; write in Kai's voice; use direct second-person language; avoid hedge words, corporate speak, and inspirational cliches. Reveal information in this order: career families or job directions first, then university types/majors, then high-school subject choices. Include all guidance as exploration, not a single path. Include concrete school subjects, university majors, career families/job titles, less obvious paths, a reality check, and next steps. In the reality check, recommend watching YouTube searches such as 'day in the life of [role]' before choosing. Use regional school wording such as A-Levels, Tawjihi, Mathematics, Physics, Chemistry. Keep total narrative tight and useful for a 17-year-old in the Middle East. Write every field in the requested JSON shape — including every item in the school-subject, university-major, career, and less-obvious-path arrays — entirely in ${promptPayload.outputLanguage}${locale === "ar" ? ", using natural Modern Standard Arabic career and academic terminology (school-subject and regional-exam names like Tawjihi or A-Levels may stay as commonly written)" : ""}. Return only valid JSON with the requested shape.`,
      messages: [
        {
          role: "user",
          content: `Create a personalized CORE Assessment result from this JSON. Use the deterministic score as truth and use the answer digest only to add nuance. Do not describe the learner as a fixed personality type. Return only JSON.\n\n${JSON.stringify(
            promptPayload,
          )}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    trackEvent("ai_generation_failed", {
      kind: "results_narrative",
      model,
      status: response.status,
    });
    trackEvent("results_generated", { source: "fallback", reason: "claude_error" });
    return Response.json({
      report: {
        ...fallback,
        model,
        fallbackReason: `Claude API returned ${response.status}.`,
      } satisfies PersonalizedCompassReport,
    });
  }

  try {
    const data = await response.json();
    const text = data?.content?.find?.(
      (entry: { type?: string }) => entry.type === "text",
    )?.text;

    if (typeof text !== "string") throw new Error("Missing text content.");

    const generated = extractJsonObject(
      text,
    ) as Partial<PersonalizedCompassReport>;

    const report: PersonalizedCompassReport = {
      ...fallback,
      generatedAt: new Date().toISOString(),
      source: "claude",
      model,
      fallbackReason: undefined,
      headline: normalizeString(generated.headline, fallback.headline),
      summary: normalizeString(generated.summary, fallback.summary),
      academicPath: normalizeString(
        generated.academicPath,
        fallback.academicPath,
      ),
      careerLandscape: normalizeString(
        generated.careerLandscape,
        fallback.careerLandscape,
      ),
      integration: normalizeString(generated.integration, fallback.integration),
      realityCheck: normalizeString(
        generated.realityCheck,
        fallback.realityCheck,
      ),
      nextSteps: normalizeString(generated.nextSteps, fallback.nextSteps),
      highSchoolSubjects: normalizeList(
        generated.highSchoolSubjects,
        fallback.highSchoolSubjects,
      ),
      universityMajors: normalizeList(
        generated.universityMajors,
        fallback.universityMajors,
      ),
      careerExamples: normalizeList(
        generated.careerExamples,
        fallback.careerExamples,
      ),
      nonObviousPaths: normalizeList(
        generated.nonObviousPaths,
        fallback.nonObviousPaths,
      ),
    };

    trackEvent("ai_generation_completed", { kind: "results_narrative", model });
    trackEvent("results_generated", { source: "claude" });
    return Response.json({ report });
  } catch {
    trackEvent("ai_generation_failed", {
      kind: "results_narrative",
      model,
      reason: "unparseable_response",
    });
    trackEvent("results_generated", { source: "fallback", reason: "parse_error" });
    return Response.json({
      report: {
        ...fallback,
        model,
        fallbackReason: "Claude response could not be parsed.",
      } satisfies PersonalizedCompassReport,
    });
  }
}
