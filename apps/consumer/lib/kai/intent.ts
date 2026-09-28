/**
 * Per-message intent detection — distinct from `KaiConversationGoal`
 * (chat-types.ts), which is set once when a conversation starts.
 * `KaiMessageIntent` can change every turn: "explain my result" one
 * message, "how do I convince my family" the next.
 *
 * This is a fast local heuristic, not a second Gemini call — it only
 * biases the prompt with a hint about which blocks likely fit (see
 * chat-prompt.ts's buildContextPrompt). Gemini still decides the final
 * shape and self-reports its own `intent` in the structured response;
 * chat-server.ts's `normalizeIntent` falls back to this heuristic's
 * guess only if Gemini's self-report is missing or invalid.
 *
 * Matches keywords in both English and Arabic regardless of the app's
 * current locale — the learner can type in either language independent
 * of the UI's default (same rule the chat system prompt already
 * follows for its own replies).
 */
export type KaiMessageIntent =
  | "explain_result"
  | "family_conversation"
  | "resource_recommendation"
  | "fact_lookup"
  | "action_plan"
  | "career_comparison"
  | "university_guidance"
  | "study_plan"
  | "challenge_result"
  | "confidence_building"
  | "next_step"
  | "general_question";

export const KAI_MESSAGE_INTENTS: readonly KaiMessageIntent[] = [
  "explain_result",
  "family_conversation",
  "resource_recommendation",
  "fact_lookup",
  "action_plan",
  "career_comparison",
  "university_guidance",
  "study_plan",
  "challenge_result",
  "confidence_building",
  "next_step",
  "general_question",
];

/**
 * Checked in order — first match wins. More specific/high-signal
 * intents (family, resources, study plan) come before generic ones
 * so e.g. "study plan" doesn't fall through to the broader "action_plan"
 * pattern (which also matches bare "plan").
 */
const INTENT_PATTERNS: ReadonlyArray<{ intent: KaiMessageIntent; pattern: RegExp }> = [
  {
    intent: "family_conversation",
    pattern:
      /(family|parents?|my mom|my dad|convince them|don't understand|explain to my parents|عائلت[يى]|أهل[يى]|والد[يى]|والدت[يى]|أقنع|يقتنع|ما بيفهم|رفض أهل)/i,
  },
  {
    intent: "fact_lookup",
    pattern:
      /(how much|what (?:does|do|is|are) .* cost|costs?|tuition|fees?|visa requirements?|scholarships?|application deadlines?|salary|salaries|pay range|employment rate|current|latest|official (?:figures|data|requirements)|كم (?:تبلغ|تكلف)|تكلفة|رسوم|مصاريف|متطلبات التأشيرة|تأشيرة|منح|موعد التقديم|آخر موعد|راتب|رواتب|أحدث|حالي[ًاا]|بيانات رسمية)/i,
  },
  {
    intent: "resource_recommendation",
    pattern:
      /(recommend|suggest|video|course|book|article|podcast|resource|watch|read (a|some)|أوص[يى]|اقترح|فيديو|دورة|كتاب|مقال|مصادر|شاهد|اقرأ)/i,
  },
  {
    intent: "study_plan",
    pattern: /(study plan|study schedule|how (do|should) i study|revision plan|exam prep|خطة دراس|جدول دراس|كيف أدرس|التحضير للامتحان)/i,
  },
  {
    intent: "action_plan",
    pattern: /(\d+[\s-]?day plan|action plan|roadmap|build me a plan|what steps|game plan|خطة|خطوات|برنامج عمل|ماذا أفعل)/i,
  },
  {
    intent: "career_comparison",
    pattern: /(compare|\bvs\.?\b|versus|which is better|difference between|should i choose|قارن|مقارنة|أيهما أفضل|الفرق بين)/i,
  },
  {
    intent: "university_guidance",
    pattern: /(universit(?:y|ies)|college|which major|admission|apply to|degree program|جامع|تخصص|القبول|التقديم على|شهادة جامعية)/i,
  },
  {
    intent: "challenge_result",
    pattern: /(i disagree|that'?s wrong|doesn'?t sound like me|not accurate|i don'?t think that'?s|لا أتفق|هذا غير صحيح|لا أعتقد|لا يشبهني)/i,
  },
  {
    intent: "confidence_building",
    pattern: /(nervous|scared|worried|not good enough|lack confidence|self[\s-]?doubt|impostor|قلق|خائف|متردد|الثقة بنفسي|لست جيدًا كفاية)/i,
  },
  {
    intent: "next_step",
    pattern: /(next step|what now|where do i start|what should i do next|الخطوة التالية|ماذا الآن|من أين أبدأ)/i,
  },
  {
    intent: "explain_result",
    pattern: /(explain (my|this)|why (did|does)|what does (this|it) mean|my (result|cluster|compass|archetype)|اشرح|لماذا|ماذا يعني|نتيجت[يى]|بوصلت[يى])/i,
  },
];

export function detectIntent(message: string): KaiMessageIntent {
  const trimmed = message.trim();
  if (!trimmed) return "general_question";

  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(trimmed)) return intent;
  }

  return "general_question";
}

export function shouldGroundIntent(intent: KaiMessageIntent | undefined): boolean {
  return intent === "fact_lookup";
}
