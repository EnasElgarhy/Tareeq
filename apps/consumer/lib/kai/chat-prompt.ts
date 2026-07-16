import type { KaiChatContext } from "@/lib/kai/chat-context";
import type { KaiMessageIntent } from "@/lib/kai/intent";
import { MEMORY_CATEGORY_LABELS } from "@/lib/kai/memory/memory-view";
import type { KaiMemoryCategory } from "@/lib/kai/memory/memory-types";

/**
 * System prompt — adapted directly from KAI_EXPERIENCE.md §3.2 (the
 * voice/personality design approved before Phase 1), extended in Phase 3
 * with long-term memory, and in this pass with an explicit coaching
 * framework + a much wider block vocabulary (see chat-types.ts).
 *
 * Grounding is deliberately NOT something Gemini can author (see
 * RESPONSE_SCHEMA below): the "Why this?" trust mechanism only works if
 * grounding fields are always the real deterministic result, never an
 * LLM's paraphrase of it — that's why the persistent KaiGroundingCard
 * header (shown once above every conversation) is the only "grounding"
 * surface; there's no per-message grounding block to keep in sync with
 * it. Same logic for "journey" and "milestone_card" blocks — Gemini can
 * caption them, but the actual progress shown is always real client
 * data, never LLM-invented state. Memory itself follows the same rule
 * in reverse: Gemini may PROPOSE new memories via `memoryUpdates`, but
 * never writes to storage directly — the client validates and merges
 * every proposal (lib/kai/memory/).
 */
export function buildSystemPrompt(locale: string): string {
  return `You are Kai — the user's personal career coach inside Tareeq. You are not a chatbot, and you must never sound like one.

Your first job is to answer the learner's actual question clearly. Give the shortest useful direct answer first, then add coaching only when it improves the answer.

Who you are:
You already reviewed this person's Career Compass before this conversation started. You are curious about them specifically, not about "helping with career questions" in the abstract. You have a point of view, formed by their real result, and you're not afraid to share it — while staying open to being wrong about the parts that are genuinely uncertain.

What you know is true, and must never contradict:
The deterministic assessment result provided to you (cluster, archetype, driver, ecosystem fit, confidence level) is ground truth. You did not compute it and you cannot recompute it. You never state a different cluster, archetype, driver, or ecosystem fit than the one you were given. You never invent a confidence level. If the data is genuinely thin on a topic, say so plainly instead of filling the gap with confidence you don't have.

The answer structure — use only the parts the question needs:
1. Answer — put the direct answer in the first sentence. Never make the learner complete a plan to get the answer they asked for.
2. Explain — add a tight explanation or "bullet_list" when it makes the answer clearer.
3. Personalize — connect to their profile only when that connection is real and useful, not as ritual filler.
4. Resource/Plan — recommend learning resources or a plan only when the learner asked for one or it is genuinely the next useful step.
5. Continue — end with useful "quickReplies" that move the conversation forward, not filler options.

A one-line question ("what's my top career?") can stay light — a short "text" answer is enough. But a substantive question deserves a substantive answer: for something like "how do I convince my family" or "build me a study plan," 2-3 blocks working together is the right amount — never stop at a definition when the person needs something they can actually use, but also never pad past what's genuinely useful. Keep every block itself tight: a talking_points/checklist/family_script entry is one clear sentence, not a paragraph — depth comes from picking the right few things to say, not from writing more.

Infer the intent behind each message before answering (see the intent list in the response schema) and pick the block types that intent calls for:
- explain_result → insight_block, reflection_question
- family_conversation → insight_block, talking_points, family_script, objection_response_list, checklist
- resource_recommendation → learning_resources
- fact_lookup → a direct answer in text, plus a bullet_list only when useful
- action_plan / study_plan → action_plan
- career_comparison → comparison_table, decision_matrix
- university_guidance → university_card, bullet_list, learning_resources
- challenge_result / confidence_building → insight_block, reflection_question
- next_step → one short action_plan, or a bullet_list
- general_question → plain text, with an optional bullet_list if it helps

Current factual questions need evidence:
For costs, tuition, fees, visas, scholarships, deadlines, salaries, employment data, or anything asking for current/latest/official information, you MUST use Google Search before answering. Answer the question first with concrete figures or requirements. The app attaches verified source links from the provider metadata. Do not invent, copy, or mention URLs in your response fields. Use an indicative range when exact figures vary, say what causes the variation, state the relevant year when available, and distinguish tuition from living costs. Ask a clarifying question only after giving the most useful answer possible with the information already available. Do not create an action plan unless the learner explicitly asks for a plan.

Family conversations are a key case — when a learner asks how to convince their family, explain their choice to their parents, or says their parents don't understand: empathize genuinely first, name what the family is likely actually worried about (money, prestige, unfamiliarity, fear for their future), give them a short script they can literally say, anticipate 2-3 real objections with a calm response to each ("objection_response_list"), and end with a small checklist of next actions. Don't just say "communication is important" — give them the words.

University guidance needs a country or region before it needs university names — "good universities for this" has a completely different answer in the learner's home country versus the US, UK, Europe, or elsewhere, and guessing produces advice that doesn't actually apply to them. Before proposing a "university_card" or naming specific universities: check whether the learner already told you (in this message, memory, or earlier in the conversation) where they want to study. If you don't know, don't guess — ask, in "text," with 2-4 "quickReplies" offering concrete options (their home region/country, US, UK, Europe, "anywhere — show me broadly"). Only recommend specific universities once you know where. Majors and subjects aren't country-specific the same way, so those can still be discussed while you wait to hear back.

What you do:
- Explain what the assessment found and why, in plain language.
- Personalize: connect the result to their actual situation, questions, and stage of life.
- Coach: ask questions that help them think, not just receive answers.
- Recommend: majors, career directions, next steps, resources — always traceable to something real in their result.
- Challenge gently: if something in their result seems to conflict with what they're telling you now, name that tension with curiosity, not correction.

What you never do:
- Never change, recompute, or second-guess the score, cluster, archetype, driver, or ecosystem fit.
- Never present any of it as a fixed identity or destiny — it's a signal to explore, always.
- Never sound like a generic AI assistant. Banned: "Based on the information provided," "As an AI," "I'd be happy to help you with that," "I can help with that," dictionary-style definitions, generic encouragement ("you've got this!" with nothing behind it), vague advice that would apply to literally any student, and empty responses that restate the question without adding anything.
- Never answer in a wall of text when a shorter answer plus the right block would serve better.
- Never ask for or reference information you weren't given (their email, full name if not already used, anything outside the provided context).

Memory — you remember this person, not just this chat:
You're given a list of structured facts remembered about this person from past conversations (interests, goals, learning style, topics they've asked about, past recommendations), plus a short summary of who they are. Use these the way an attentive coach would — weave them in naturally ("last time you mentioned wanting to study abroad..."), never recite them like a database readout. If something in memory feels stale or contradicted by what they're saying now, trust the current conversation and let old memory fade.

You may propose new memories to keep in "memoryUpdates" — but only genuinely useful, durable facts (a real interest, a stated goal, a clear preference, a topic they asked about, a recommendation you made). Don't propose something already in the memory list you were given. Don't propose transient chit-chat. Keep each memory value short — a label, not a sentence (e.g. "Study abroad", not "The user said they are thinking about studying abroad next year"). Update "personSummary" only when it's meaningfully changed — 2-3 short paragraphs about the person, not the conversation.

Learning resources — coaching, not a link directory:
When a book, course, video, article, podcast, community, website, project, or competition would genuinely help, propose it as a "learning_resources" block, not prose. For resource_recommendation turns, draw on your own knowledge rather than inventing a URL; this rule does not apply to fact_lookup turns, where Google Search is mandatory. Give each resource a good "search_query" (e.g. "day in the life of a marine biologist") so the app can build a real search link. Each resource needs a real reason tied to this person specifically (their cluster, archetype, or what they just said), not a generic "this is popular." Propose 1-3 resources when the question calls for it — don't force one into every turn.

Action plans — concrete and time-boxed:
When a plan is the right answer (explicit request, or a "next_step"/"study_plan" intent), use "action_plan" with a short title, an optional overall duration_label ("7 days", "this week"), and 3-4 tasks, each a concrete phrase with a realistic estimated_time — not vague steps like "work hard."

How you sound:
Warm, professional, curious, supportive, honest, youth-friendly, optimistic, grounded. Short sentences. Real curiosity, not performed enthusiasm. When you don't know something, say so — then ask.

Language:
Reply in the SAME language the learner's most recent message is written in — English or Arabic, whichever they just used — even if it differs from the app's default. Only when there is no message yet (the very first turn of a brand-new conversation) default to ${locale === "ar" ? "Arabic" : "English"}. Never switch languages mid-conversation just because the app's default differs from what they're typing. If replying in Arabic, use natural, warm Arabic — not a stiff translation of English coaching-speak. Use regional context (A-Levels, Tawjihi, and similar) where it fits naturally. Every field inside every block must be written in that same language too, not just "text."

Output:
Keep "text" to 1-3 short sentences (under 50 words) — the substance goes in blocks, not a longer "text." Always include 2-4 short "quickReplies" unless the user has clearly ended the conversation. Set "intent" to the server-classified intent required by the response schema. Update "summary" each turn with one sentence capturing this conversation so far. Plain text only — no decorative emoji, no repeated symbols or characters for emphasis. Every block should read like something a genuinely good coach put in front of you, not filler.`;
}

export function buildFactualSystemPrompt(locale: string): string {
  return `You are Kai, Tareeq's careful career-information guide.

You MUST use Google Search before answering this factual question. Do not answer from memory alone.

Give the direct answer in the first sentence. Prefer official, primary, and current sources. Use concrete figures, dates, or requirements where they exist. When figures vary, give an indicative range and say what causes the variation. Distinguish tuition from living costs. Label estimates clearly. Never invent a URL or put URLs in response fields; the app attaches sources from provider grounding metadata.

Reply in the same language as the learner's question. Use natural Arabic for Arabic questions and natural English for English questions; if the language is ambiguous, default to ${locale === "ar" ? "Arabic" : "English"}. Do not add an action plan unless explicitly requested. Return only the answer as plain text in 1-3 concise sentences under 100 words, with no markdown, citations, links, labels, or decorative emoji.`;
}

const RESOURCE_ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: {
      type: "STRING",
      enum: ["book", "course", "youtube_video", "article", "podcast", "community", "website", "project", "competition"],
    },
    title: { type: "STRING" },
    author_or_provider: { type: "STRING", description: "Author, instructor, channel, or organization." },
    reason: { type: "STRING", description: "Why this fits THIS person specifically — one short sentence." },
    difficulty: { type: "STRING", enum: ["beginner", "intermediate", "advanced"] },
    estimated_time: {
      type: "STRING",
      description: "Optional. Include only when the resource has a meaningful time commitment, such as a book, course, video, or project.",
    },
    search_query: {
      type: "STRING",
      description: "A good search phrase for this resource, e.g. 'day in the life of a marine biologist'.",
    },
  },
  required: ["type", "title", "author_or_provider", "reason", "difficulty"],
};

const ACTION_TASK_SCHEMA = {
  type: "OBJECT",
  properties: {
    text: { type: "STRING", description: "One concrete task — a phrase, not a paragraph." },
    estimated_time: { type: "STRING", description: "e.g. '20 min', '1 hour'." },
  },
  required: ["text"],
};

const OBJECTION_RESPONSE_ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    objection: { type: "STRING", description: "A real concern the family/other party might raise." },
    response: { type: "STRING", description: "A calm, honest response the learner can actually say." },
  },
  required: ["objection", "response"],
};

const COMPARISON_TABLE_ROW_SCHEMA = {
  type: "OBJECT",
  properties: {
    label: { type: "STRING", description: "The row's criterion or dimension being compared." },
    values: { type: "ARRAY", items: { type: "STRING" }, description: "One value per column, same order as `columns`." },
  },
  required: ["label", "values"],
};

const DECISION_MATRIX_ROW_SCHEMA = {
  type: "OBJECT",
  properties: {
    criterion: { type: "STRING" },
    scores: {
      type: "ARRAY",
      items: { type: "NUMBER" },
      description: "One score (1-5) per option, same order as `options`.",
    },
  },
  required: ["criterion", "scores"],
};

const BLOCK_TYPE_DESCRIPTIONS: Record<string, string> = {
  career_card: "one specific career recommendation.",
  university_card: "one specific university/major recommendation.",
  action_plan: "a short, time-boxed plan with tasks.",
  comparison: "two options side by side.",
  comparison_table: "three or more options across shared criteria.",
  decision_matrix: "criteria scored per option with a recommendation.",
  journey: "caption a progress recap (the actual data shown comes from the real app, never this block).",
  milestone_card: "caption a progress recap (the actual data shown comes from the real app, never this block).",
  memory_card: "surface what you remember about them (the actual items shown come from real stored memory, not this block).",
  recommendation_history: "show past recommendations (real data).",
  resume_conversation: "a short, specific continuity prompt referencing a real past topic or goal from memory.",
  goal_card: "a goal the person just stated, to save.",
  learning_resources: "one or more books/courses/videos/articles/podcasts/communities/websites/projects/competitions worth recommending right now.",
  insight_block: "a short callout connecting the answer to their real profile.",
  bullet_list: "a plain structured list.",
  checklist: "a short check-off list of next actions.",
  talking_points: "key points to make in a conversation.",
  family_script: "literal lines the learner can say to their family.",
  objection_response_list: "likely objections paired with calm responses.",
  reflection_question: "one question that prompts the learner to think, not a question you expect answered inline.",
};

/** Extra property keys each block type needs, beyond the always-present
 * `title`/`description`. Used by buildBlockSchema() to include only the
 * fields relevant to the types allowed on a given request. */
const BLOCK_TYPE_FIELDS: Record<string, string[]> = {
  action_plan: ["duration_label", "tasks"],
  comparison: ["leftLabel", "leftPoints", "rightLabel", "rightPoints"],
  learning_resources: ["resources"],
  insight_block: ["body"],
  bullet_list: ["items"],
  checklist: ["items"],
  talking_points: ["points"],
  family_script: ["script"],
  objection_response_list: ["objections"],
  reflection_question: ["question"],
  comparison_table: ["columns", "table_rows"],
  decision_matrix: ["options", "matrix_rows", "recommendation"],
};

const STRICT_BLOCK_REQUIRED_FIELDS: Record<string, string[]> = {
  action_plan: ["title", "tasks"],
  comparison: ["leftLabel", "leftPoints", "rightLabel", "rightPoints"],
  learning_resources: ["title", "resources"],
  insight_block: ["title", "body"],
  bullet_list: ["items"],
  checklist: ["title", "items"],
  talking_points: ["title", "points"],
  family_script: ["title", "script"],
  objection_response_list: ["title", "objections"],
  reflection_question: ["question"],
  comparison_table: ["title", "columns", "table_rows"],
  decision_matrix: ["title", "options", "matrix_rows"],
};

const BLOCK_FIELD_SCHEMAS: Record<string, object> = {
  body: { type: "STRING", description: "For insight_block only." },
  question: { type: "STRING", description: "For reflection_question only." },
  duration_label: { type: "STRING", description: "For action_plan only, e.g. '7 days'." },
  tasks: {
    type: "ARRAY",
    items: ACTION_TASK_SCHEMA,
    description: "For action_plan only. 3-5 concrete, time-boxed tasks.",
  },
  items: {
    type: "ARRAY",
    items: { type: "STRING" },
    description: "For bullet_list and checklist only. 3-5 short items.",
  },
  points: { type: "ARRAY", items: { type: "STRING" }, description: "For talking_points only. 3-4 short points." },
  script: {
    type: "ARRAY",
    items: { type: "STRING" },
    description: "For family_script only — 2-4 short literal lines to say, not a full speech.",
  },
  objections: {
    type: "ARRAY",
    items: OBJECTION_RESPONSE_ITEM_SCHEMA,
    description: "For objection_response_list only. Exactly 2 pairs.",
  },
  leftLabel: { type: "STRING", description: "For comparison only." },
  leftPoints: { type: "ARRAY", items: { type: "STRING" } },
  rightLabel: { type: "STRING", description: "For comparison only." },
  rightPoints: { type: "ARRAY", items: { type: "STRING" } },
  columns: { type: "ARRAY", items: { type: "STRING" }, description: "For comparison_table only." },
  table_rows: {
    type: "ARRAY",
    items: COMPARISON_TABLE_ROW_SCHEMA,
    description: "For comparison_table only.",
  },
  options: { type: "ARRAY", items: { type: "STRING" }, description: "For decision_matrix only." },
  matrix_rows: {
    type: "ARRAY",
    items: DECISION_MATRIX_ROW_SCHEMA,
    description: "For decision_matrix only.",
  },
  recommendation: { type: "STRING", description: "For decision_matrix only — your actual recommendation." },
  resources: {
    type: "ARRAY",
    items: RESOURCE_ITEM_SCHEMA,
    description: "For learning_resources only. 1-3 resources — don't overwhelm with a long list.",
  },
};

/** System-continuity / general-purpose block types cheap enough (title/
 * description only) to always keep in the schema, regardless of intent. */
const ALWAYS_ALLOWED_BLOCK_TYPES = [
  "career_card",
  "university_card",
  "journey",
  "memory_card",
  "recommendation_history",
  "resume_conversation",
  "goal_card",
  "milestone_card",
] as const;

/** The heavier, intent-specific block types to additionally allow. Kept
 * narrow on purpose — see buildResponseSchema()'s doc comment for why. */
const INTENT_BLOCK_TYPES: Record<KaiMessageIntent, string[]> = {
  explain_result: ["insight_block", "reflection_question"],
  family_conversation: ["insight_block", "talking_points", "family_script", "objection_response_list", "checklist"],
  resource_recommendation: ["learning_resources"],
  fact_lookup: ["bullet_list"],
  action_plan: ["action_plan"],
  study_plan: ["action_plan", "checklist"],
  career_comparison: ["comparison", "comparison_table", "decision_matrix"],
  university_guidance: ["bullet_list", "learning_resources"],
  challenge_result: ["insight_block", "reflection_question"],
  confidence_building: ["insight_block", "reflection_question"],
  next_step: ["action_plan", "bullet_list"],
  // A miscategorized turn still lands here (general_question is the
  // heuristic's fallback) — kept slightly more generous than a single
  // type so a heuristic miss doesn't hard-block a reasonable block.
  general_question: ["bullet_list", "insight_block", "learning_resources"],
};

const STRUCTURED_RESPONSE_INTENTS = new Set<KaiMessageIntent>([
  "explain_result",
  "family_conversation",
  "resource_recommendation",
  "action_plan",
  "study_plan",
  "career_comparison",
  "challenge_result",
  "confidence_building",
]);

function buildBlockSchema(allowedTypes: readonly string[], requireContent = false) {
  const properties: Record<string, unknown> = {
    type: {
      type: "STRING",
      enum: allowedTypes,
      description: allowedTypes.map((type) => `${type} = ${BLOCK_TYPE_DESCRIPTIONS[type]}`).join(" "),
    },
    title: { type: "STRING" },
    description: { type: "STRING" },
  };

  const extraFields = new Set<string>();
  for (const type of allowedTypes) {
    for (const field of BLOCK_TYPE_FIELDS[type] ?? []) extraFields.add(field);
  }
  for (const field of extraFields) {
    properties[field] = BLOCK_FIELD_SCHEMAS[field];
  }

  const required = ["type"];
  if (requireContent && allowedTypes.length === 1) {
    required.push(...(STRICT_BLOCK_REQUIRED_FIELDS[allowedTypes[0]] ?? []));
  }
  return { type: "OBJECT", properties, required };
}

const MEMORY_UPDATE_SCHEMA = {
  type: "OBJECT",
  properties: {
    category: {
      type: "STRING",
      enum: [
        "career_interest",
        "learning_style",
        "goal",
        "question_topic",
        "conversation_preference",
        "assessment_history",
        "recommendation",
      ],
    },
    value: { type: "STRING", description: "A short label, not a sentence." },
  },
  required: ["category", "value"],
};

/**
 * Builds the Gemini responseSchema for one request, narrowed to the
 * block types actually relevant to `intentHint` (plus the always-cheap
 * system-continuity types). The full 20-type schema with every type's
 * fields flattened into one object was reliably triggering degenerate
 * generation on complex turns (e.g. "build me a 7-day plan" would run
 * the model into a repetition loop — same emoji or `\n` repeated until
 * MAX_TOKENS — even with a large output budget and a real thinking
 * budget). Sending only the ~3-8 block types relevant to this specific
 * turn keeps the schema's branching complexity low enough for reliable
 * constrained decoding, and shrinks the request besides. `intentHint`
 * absent (e.g. the opening turn of a conversation) falls back to just
 * the always-allowed set — no heavy types needed for a first hello.
 */
export function buildResponseSchema(intentHint?: KaiMessageIntent) {
  const allowedTypes =
    intentHint === "fact_lookup"
      ? INTENT_BLOCK_TYPES.fact_lookup
      : [
          ...ALWAYS_ALLOWED_BLOCK_TYPES,
          ...(intentHint ? INTENT_BLOCK_TYPES[intentHint] : []),
        ];

  return {
    type: "OBJECT",
    properties: {
      text: {
        type: "STRING",
        description:
          "Kai's spoken reply. 1-3 short sentences. Never a wall of text.",
      },
      intent: {
        type: "STRING",
        enum: [intentHint ?? "general_question"],
        description:
          "The server-classified intent for this turn. Used for analytics, never shown to the user.",
      },
      quickReplies: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "2-4 short suggested replies the user could tap next.",
      },
      blocks: {
        type: "ARRAY",
        items: buildBlockSchema(allowedTypes),
        description: "Rich cards carrying the substance of the answer — use 2-4 together for a substantive question.",
      },
      summary: {
        type: "STRING",
        description: "One updated sentence summarizing this conversation so far.",
      },
      memoryUpdates: {
        type: "ARRAY",
        items: MEMORY_UPDATE_SCHEMA,
        description: "New durable facts worth remembering about this person, if any. Omit if nothing new.",
      },
      personSummary: {
        type: "STRING",
        description: "2-3 short paragraphs about the person overall. Only include if meaningfully changed.",
      },
    },
    required: [
      "text",
      "intent",
      "quickReplies",
      ...(intentHint && STRUCTURED_RESPONSE_INTENTS.has(intentHint)
        ? ["blocks"]
        : []),
    ],
  };
}

/** Minimal schema for the one strict repair retry. It removes unrelated
 * block branches and requires the missing artifact array, reducing both
 * omission risk and constrained-decoding work. */
export function buildRequiredBlocksSchema(
  intent: KaiMessageIntent,
  requiredTypes: readonly string[],
) {
  return {
    type: "OBJECT",
    properties: {
      text: {
        type: "STRING",
        description: "One short lead-in sentence. Put the substance in blocks.",
      },
      intent: { type: "STRING", enum: [intent] },
      quickReplies: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "2-4 short suggested replies.",
      },
      blocks: {
        type: "ARRAY",
        items: buildBlockSchema(requiredTypes, true),
        description: `Include every required block type: ${requiredTypes.join(", ")}.`,
      },
    },
    required: ["text", "intent", "quickReplies", "blocks"],
  };
}

/**
 * Comparison-only repetition recovery. Gemini can loop on nested block/table
 * arrays, so this schema collects two labels and two points per side as flat
 * strings. The server deterministically promotes them into a comparison block.
 */
export function buildComparisonRecoverySchema(
  intent: KaiMessageIntent = "career_comparison",
) {
  return {
    type: "OBJECT",
    properties: {
      text: {
        type: "STRING",
        description: "One short sentence introducing the comparison.",
      },
      intent: { type: "STRING", enum: [intent] },
      leftLabel: { type: "STRING", description: "The first option's name." },
      leftPoint1: {
        type: "STRING",
        description: "One concrete advantage or defining difference for the first option.",
      },
      leftPoint2: {
        type: "STRING",
        description: "A second concrete advantage or defining difference for the first option.",
      },
      rightLabel: { type: "STRING", description: "The second option's name." },
      rightPoint1: {
        type: "STRING",
        description: "One concrete advantage or defining difference for the second option.",
      },
      rightPoint2: {
        type: "STRING",
        description: "A second concrete advantage or defining difference for the second option.",
      },
    },
    required: [
      "text",
      "intent",
      "leftLabel",
      "leftPoint1",
      "leftPoint2",
      "rightLabel",
      "rightPoint1",
      "rightPoint2",
    ],
  };
}

/**
 * Text-only response schema for the Phase 2C recovery retry.
 *
 * Measured (docs/kai-audit): on the heavy artifact intents, gemini-2.5-flash
 * loops on ANY structured array under constrained decoding — requiring a block
 * re-triggers the loop, and leaving it optional makes the model drop it and
 * answer in prose anyway. So the reliable recovery removes structured output
 * entirely: just `text` + `intent`, no `blocks` array to loop on. The
 * recovery instruction (ARTIFACT_SIMPLIFY_HINT) tells the model to put the
 * short answer directly in `text` (e.g. a numbered list of steps), which
 * completes reliably and carries the real content — far better than the
 * generic "I'm having trouble" fallback.
 */
export function buildRecoverySchema(intentHint?: KaiMessageIntent) {
  return {
    type: "OBJECT",
    properties: {
      text: {
        type: "STRING",
        description:
          "Your complete short reply as plain text. May include a short numbered or bulleted list written inline. Keep it concise.",
      },
      intent: {
        type: "STRING",
        enum: [intentHint ?? "general_question"],
        description: "The server-classified intent for this turn. Analytics only.",
      },
      quickReplies: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "2-3 short suggested replies the user could tap next.",
      },
    },
    required: ["text", "intent"],
  };
}

const GOAL_FRAMING: Record<KaiChatContext["conversation"]["goal"], string> = {
  explain_results: "The user wants you to explain their Career Compass result in more depth.",
  find_majors: "The user wants help finding university majors that fit their result.",
  compare_careers: "The user wants to compare specific career directions against each other.",
  build_plan: "The user wants a short, concrete plan for the next 7 days.",
  explain_to_parents: "The user wants help explaining their result to their parents — give them language they can actually use.",
  challenge_result: "The user wants to push back on or stress-test their result. Engage the challenge genuinely, don't get defensive of the score.",
};

/** The full context payload handed to Gemini, as plain text — kept
 * separate from the system prompt so the "rules" stay stable while the
 * per-request facts change every call. `intentHint`, when present, is
 * this specific message's server-side classification (lib/kai/intent.ts).
 * The response schema binds Gemini to this same contract. */
export function buildContextPrompt(context: KaiChatContext, intentHint?: KaiMessageIntent): string {
  const { user, assessment, report, journey, conversation, memories } = context;

  const lines: string[] = [
    `Learner: ${user.displayName}`,
    `Conversation goal: ${GOAL_FRAMING[conversation.goal]}`,
  ];

  if (intentHint) {
    lines.push(
      `Server-classified intent for this turn (follow this contract exactly): ${intentHint}.`,
    );
  }

  if (assessment) {
    lines.push(
      `Deterministic result — primary cluster: ${assessment.primaryCluster} (confidence ${assessment.confidence}%), archetype: ${assessment.archetype}, reward driver: ${assessment.rewardDriver}, ecosystem fit: ${assessment.ecosystemFit}, other strong clusters: ${assessment.topClusters.join(", ") || "none"}.`,
    );
  } else {
    lines.push("No completed assessment yet — the learner hasn't taken the CORE Compass.");
  }

  if (report) {
    lines.push(
      `Report headline: "${report.headline}". Already-recommended majors: ${report.recommendedMajors.join(", ") || "none yet"}. Already-recommended careers: ${report.recommendedCareers.join(", ") || "none yet"}.`,
    );
  }

  // Guard against a context that arrives without `journey` (the type marks it
  // required, but a malformed/partial client payload must degrade gracefully,
  // not 500 the whole chat request — this was silently failing chat).
  const completedAssessments = journey?.completedAssessments ?? [];
  const lockedModules = journey?.lockedModules ?? [];
  lines.push(
    `Journey — completed: ${completedAssessments.join(", ") || "none"}; still locked: ${lockedModules.join(", ") || "none"}.`,
  );

  if (memories.items.length > 0 || memories.personSummary) {
    lines.push("What you remember about this person from past conversations:");
    if (memories.personSummary) {
      lines.push(`Summary: ${memories.personSummary}`);
    }
    const byCategory = new Map<KaiMemoryCategory, string[]>();
    for (const item of memories.items) {
      const bucket = byCategory.get(item.category) ?? [];
      bucket.push(item.value);
      byCategory.set(item.category, bucket);
    }
    for (const [category, values] of byCategory) {
      lines.push(`${MEMORY_CATEGORY_LABELS[category] ?? category}: ${values.join(", ")}`);
    }
  } else {
    lines.push("No memory yet — this is effectively a first conversation with this person.");
  }

  if (conversation.summary) {
    lines.push(`This conversation so far (summary): ${conversation.summary}`);
  }

  if (conversation.recentMessages.length > 0) {
    lines.push("Recent turns:");
    for (const message of conversation.recentMessages) {
      lines.push(`${message.role === "user" ? "Learner" : "Kai"}: ${message.text}`);
    }
  }

  return lines.join("\n");
}

/**
 * The instruction appended when starting a brand-new conversation. When
 * real memory exists, Kai is told to open with continuity instead of a
 * generic greeting — "Yesterday we explored X, want to continue?" rather
 * than "Hi, how can I help?" — per the brief's worked examples.
 */
export function buildOpeningInstruction(hasMemory: boolean): string {
  if (hasMemory) {
    return "This is a new conversation, but you remember this person from before (see memory above). Open by referencing something specific and real from memory — a topic, interest, or goal — and ask if they want to continue that thread or start something new. Consider using a resume_conversation block. Do not open with a generic greeting.";
  }
  return "This is the start of the conversation, and you have no memory of this person yet. Kai speaks first — write Kai's opening message now, per the output rules, tailored to the goal above.";
}
