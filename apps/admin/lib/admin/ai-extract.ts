import type { RuleCombinator, RuleOperator } from "@/lib/scoring/spec-types";

/**
 * AI import: turn admin-uploaded source text into a *draft* assessment the admin
 * reviews and edits before anything is saved.
 *
 * HARD INVARIANT: the AI sees ONLY document text (questions + scoring rubric).
 * It never sees a student's answers and never decides a winning profile — it
 * proposes the spec DATA; the deterministic engine does all scoring. The
 * extractor's signature enforces this (no answers parameter exists).
 */

const OPERATORS: RuleOperator[] = ["=", "!=", ">", "<", ">=", "<="];

export interface DraftCategory {
  code: string;
  name: { en: string; ar?: string };
}
export interface DraftOption {
  letter: string;
  text: { en: string; ar?: string };
  categoryCode: string | null;
  points: number;
}
export interface DraftQuestion {
  kind: "single" | "binary" | "select" | "text";
  title: { en: string; ar?: string };
  options: DraftOption[];
}
export interface DraftRuleCondition {
  cluster: string;
  operator: RuleOperator;
  value?: number;
  valueCategory?: string;
}
export interface DraftProfile {
  code: string;
  title: { en: string; ar?: string };
  description?: { en?: string; ar?: string };
  categoryCode: string | null;
}
export interface DraftRule {
  resultProfileCode: string;
  combinator: RuleCombinator;
  conditions: DraftRuleCondition[];
  priority: number;
}
export interface ExtractedDraft {
  categories: DraftCategory[];
  questions: DraftQuestion[];
  profiles: DraftProfile[];
  rules: DraftRule[];
  confidence: number;
  detectedLanguage: string | null;
}

// ── pure normaliser (testable) ────────────────────────────────────────────────

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function code(value: unknown): string {
  return str(value).toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 24);
}
function localized(value: unknown): { en: string; ar?: string } {
  const v = (value ?? {}) as Record<string, unknown>;
  const en = str(v.en);
  const ar = str(v.ar);
  return ar ? { en, ar } : { en };
}
function num(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Coerce arbitrary AI JSON into a clean `ExtractedDraft`, dropping entries that
 * can't be salvaged. Pure — never throws, always returns a usable draft.
 */
export function normalizeExtractedDraft(raw: unknown): ExtractedDraft {
  const root = (raw ?? {}) as Record<string, unknown>;
  const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const categories: DraftCategory[] = [];
  const seenCat = new Set<string>();
  for (const c of asArray(root.categories)) {
    const obj = (c ?? {}) as Record<string, unknown>;
    const cc = code(obj.code);
    const name = localized(obj.name);
    if (!cc || !name.en || seenCat.has(cc)) continue;
    seenCat.add(cc);
    categories.push({ code: cc, name });
  }
  const validCat = new Set(categories.map((c) => c.code));

  const questions: DraftQuestion[] = [];
  for (const q of asArray(root.questions)) {
    const obj = (q ?? {}) as Record<string, unknown>;
    const title = localized(obj.title);
    if (!title.en) continue;
    const rawKind = str(obj.kind).toLowerCase();
    const kind: DraftQuestion["kind"] =
      rawKind === "binary" || rawKind === "select" || rawKind === "text"
        ? rawKind
        : "single";
    const options: DraftOption[] = [];
    asArray(obj.options).forEach((o, i) => {
      const oo = (o ?? {}) as Record<string, unknown>;
      const text = localized(oo.text);
      if (!text.en) return;
      const cc = code(oo.categoryCode ?? oo.category ?? oo.cluster);
      options.push({
        letter: (str(oo.letter) || String.fromCharCode(65 + i)).toUpperCase().slice(0, 4),
        text,
        categoryCode: cc && validCat.has(cc) ? cc : null,
        points: Math.max(0, num(oo.points ?? oo.weight, 1)),
      });
    });
    questions.push({ kind, title, options: kind === "text" ? [] : options });
  }

  const profiles: DraftProfile[] = [];
  const seenProfile = new Set<string>();
  for (const p of asArray(root.profiles)) {
    const obj = (p ?? {}) as Record<string, unknown>;
    const pc = code(obj.code);
    const title = localized(obj.title ?? obj.name);
    if (!pc || !title.en || seenProfile.has(pc)) continue;
    seenProfile.add(pc);
    const descObj = (obj.description ?? {}) as Record<string, unknown>;
    const description = { en: str(descObj.en), ar: str(descObj.ar) };
    const cc = code(obj.categoryCode ?? obj.category);
    profiles.push({
      code: pc,
      title,
      description: description.en || description.ar ? description : undefined,
      categoryCode: cc && validCat.has(cc) ? cc : null,
    });
  }
  const validProfile = new Set(profiles.map((p) => p.code));

  const rules: DraftRule[] = [];
  asArray(root.rules).forEach((r, idx) => {
    const obj = (r ?? {}) as Record<string, unknown>;
    const target = code(obj.resultProfileCode ?? obj.profile ?? obj.profileCode);
    if (!validProfile.has(target)) return;
    const conditions: DraftRuleCondition[] = [];
    for (const c of asArray(obj.conditions)) {
      const co = (c ?? {}) as Record<string, unknown>;
      const cluster = code(co.cluster ?? co.category);
      if (!validCat.has(cluster)) continue;
      const operator = str(co.operator) as RuleOperator;
      if (!OPERATORS.includes(operator)) continue;
      const vc = code(co.valueCategory);
      if (vc && validCat.has(vc)) {
        conditions.push({ cluster, operator, valueCategory: vc });
      } else {
        conditions.push({ cluster, operator, value: num(co.value, 0) });
      }
    }
    if (conditions.length === 0) return;
    const combinator: RuleCombinator = str(obj.combinator).toUpperCase() === "OR" ? "OR" : "AND";
    rules.push({ resultProfileCode: target, combinator, conditions, priority: num(obj.priority, idx + 1) });
  });

  return {
    categories,
    questions,
    profiles,
    rules,
    confidence: Math.min(1, Math.max(0, num(root.confidence, 0.5))),
    detectedLanguage: str(root.detectedLanguage) || null,
  };
}

/**
 * Recover the common direct-score shape when extraction returns scored
 * categories but omits the matching outcomes. Conditional-rule assessments
 * are never changed by this fallback.
 */
export function withDirectScoreProfileFallback(
  draft: ExtractedDraft,
): ExtractedDraft {
  if (draft.profiles.length > 0 || draft.rules.length > 0) return draft;

  const scoredCategories = new Set(
    draft.questions.flatMap((question) =>
      question.options.flatMap((option) =>
        option.categoryCode ? [option.categoryCode] : [],
      ),
    ),
  );
  const profiles = draft.categories
    .filter((category) => scoredCategories.has(category.code))
    .map((category) => ({
      code: category.code,
      title: category.name,
      categoryCode: category.code,
    }));

  return profiles.length > 0
    ? { ...draft, profiles, confidence: Math.min(draft.confidence, 0.5) }
    : draft;
}

// ── Gemini extractor (server-only; document text in, draft out) ───────────────

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    detectedLanguage: { type: "string" },
    confidence: { type: "number" },
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          name: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
        },
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string" },
          title: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                letter: { type: "string" },
                text: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
                categoryCode: { type: "string" },
                points: { type: "number" },
              },
            },
          },
        },
      },
    },
    profiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          title: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
          description: { type: "object", properties: { en: { type: "string" }, ar: { type: "string" } } },
          categoryCode: { type: "string" },
        },
      },
    },
    rules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          resultProfileCode: { type: "string" },
          combinator: { type: "string" },
          priority: { type: "number" },
          conditions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cluster: { type: "string" },
                operator: { type: "string" },
                value: { type: "number" },
                valueCategory: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `You convert career-assessment source material into a structured assessment draft.
Output ONLY the schema: categories (scoring dimensions), questions (with answer options mapping to a category + points), result profiles, and rules.
You are NOT scoring anyone — you only structure the author's material. Preserve bilingual text (en/ar) when present; never invent translations.
Every explicitly named possible outcome, result, archetype, or profile in the source MUST appear in profiles.
When answers award points directly to named outcomes, create matching categories for those score dimensions and one profile per named outcome, with categoryCode pointing to its matching category.
Do not put a named outcome only in categories and omit it from profiles.
Use SHORT uppercase codes for categories and profiles (e.g. LEAD, TECH).`;

export interface ExtractInput {
  /** The questions document text (CSV/markdown/plain). NEVER student answers. */
  questionsText: string;
  /** Optional scoring/rubric document text. */
  scoringText?: string;
}

async function requestExtraction(
  key: string,
  model: string,
  userContent: string,
  systemInstruction: string,
  temperature: number,
): Promise<ExtractedDraft> {
  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: EXTRACT_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[ai-extract] gemini ${response.status}: ${detail.slice(0, 300)}`);
    throw new Error(`Extraction failed (Gemini ${response.status}).`);
  }

  const data = await response.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p?.text)
    .filter((t: unknown): t is string => typeof t === "string")
    .join("");
  if (!text) throw new Error("Extraction returned no content.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Extraction returned malformed JSON.");
  }
  return normalizeExtractedDraft(parsed);
}

export async function extractAssessmentDraft(
  input: ExtractInput,
): Promise<ExtractedDraft> {
  const key = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const model = (process.env.GEMINI_MODEL ?? "").trim() || "gemini-2.5-flash";

  const userContent = [
    "QUESTIONS SOURCE:",
    input.questionsText.slice(0, 24000),
    input.scoringText ? "\n\nSCORING / RUBRIC SOURCE:" : "",
    input.scoringText ? input.scoringText.slice(0, 12000) : "",
  ].join("\n");

  const draft = await requestExtraction(key, model, userContent, SYSTEM, 0.2);
  if (
    draft.profiles.length > 0 ||
    draft.categories.length === 0 ||
    draft.questions.length === 0
  ) {
    return draft;
  }

  const repairInstruction = `${SYSTEM}
The previous extraction found questions and scoring categories but omitted every result profile. Re-read the source and ensure every named result is present in profiles. For direct-score assessments, create one profile per scored outcome and map it to the matching category.`;
  const repaired = await requestExtraction(
    key,
    model,
    userContent,
    repairInstruction,
    0,
  );

  return repaired.profiles.length > 0
    ? repaired
    : withDirectScoreProfileFallback(draft);
}
