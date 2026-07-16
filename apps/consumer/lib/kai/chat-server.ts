import type { KaiChatContext } from "@/lib/kai/chat-context";
import type {
  KaiActionTask,
  KaiComparisonBlock,
  KaiComparisonTableBlock,
  KaiDecisionMatrixRow,
  KaiMessage,
  KaiMessageBlock,
  KaiObjectionResponseItem,
} from "@/lib/kai/chat-types";
import { KAI_MESSAGE_INTENTS, type KaiMessageIntent } from "@/lib/kai/intent";
import type { KaiLearningResource } from "@/lib/kai/resource-types";

/**
 * Pure request/response handling for /api/kai/chat, kept out of route.ts —
 * a Next.js route module can only export route handlers and a small set
 * of config values, so anything meant to be unit-tested has to live here.
 */

export interface ChatRequestBody {
  kind?: "open" | "reply";
  context?: KaiChatContext;
  message?: string;
  threadId?: string;
  threadTitle?: string;
  requestId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
}

export interface ValidatedChatRequest {
  kind: "open" | "reply";
  context: KaiChatContext;
  message?: string;
  threadId?: string;
  threadTitle?: string;
  requestId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
}

const GOALS = new Set([
  "explain_results",
  "find_majors",
  "compare_careers",
  "build_plan",
  "explain_to_parents",
  "challenge_result",
]);

const BLOCK_TYPES = new Set([
  "career_card",
  "university_card",
  "action_plan",
  "comparison",
  "journey",
  "memory_card",
  "recommendation_history",
  "resume_conversation",
  "goal_card",
  "milestone_card",
  "learning_resources",
  "source_list",
  "insight_block",
  "bullet_list",
  "checklist",
  "talking_points",
  "family_script",
  "objection_response_list",
  "reflection_question",
  "comparison_table",
  "decision_matrix",
]);

const INTENT_SET = new Set<string>(KAI_MESSAGE_INTENTS);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESOURCE_TYPES = new Set([
  "book",
  "course",
  "youtube_video",
  "article",
  "podcast",
  "community",
  "website",
  "project",
  "competition",
]);

const RESOURCE_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

/** Validates one proposed resource. Defensively drops it (rather than
 * a partial/guessed fallback) if any required field is missing or the
 * wrong type — a resource card with a blank reason or difficulty isn't
 * "premium," it's broken. No url field exists here to strip: the schema
 * never offered Gemini one, so there's nothing for it to invent. */
function normalizeResource(value: unknown): KaiLearningResource | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;

  if (typeof raw.type !== "string" || !RESOURCE_TYPES.has(raw.type))
    return null;
  if (typeof raw.title !== "string" || !raw.title.trim()) return null;
  if (
    typeof raw.author_or_provider !== "string" ||
    !raw.author_or_provider.trim()
  )
    return null;
  if (typeof raw.reason !== "string" || !raw.reason.trim()) return null;
  if (
    typeof raw.difficulty !== "string" ||
    !RESOURCE_DIFFICULTIES.has(raw.difficulty)
  )
    return null;
  const searchQuery =
    typeof raw.search_query === "string" ? raw.search_query.trim() : "";
  const estimatedTime =
    typeof raw.estimated_time === "string" ? raw.estimated_time.trim() : "";

  return {
    type: raw.type as KaiLearningResource["type"],
    title: raw.title.trim(),
    authorOrProvider: raw.author_or_provider.trim(),
    reason: raw.reason.trim(),
    difficulty: raw.difficulty as KaiLearningResource["difficulty"],
    ...(estimatedTime ? { estimatedTime } : {}),
    ...(searchQuery ? { searchQuery } : {}),
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.trim().length > 0,
      )
    : [];
}

/** Generates a stable-enough id locally — never trusts an LLM-supplied
 * id, matching how resource-storage.ts always generates its own ids. */
function taskId(index: number): string {
  return `task-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeActionTasks(value: unknown): KaiActionTask[] {
  if (!Array.isArray(value)) return [];
  const tasks: KaiActionTask[] = [];
  value.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null) return;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.text !== "string" || !raw.text.trim()) return;
    const estimatedTime =
      typeof raw.estimated_time === "string" ? raw.estimated_time.trim() : "";
    tasks.push({
      id: taskId(index),
      text: raw.text.trim(),
      ...(estimatedTime ? { estimatedTime } : {}),
    });
  });
  return tasks;
}

function normalizeObjectionItems(value: unknown): KaiObjectionResponseItem[] {
  if (!Array.isArray(value)) return [];
  const items: KaiObjectionResponseItem[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.objection !== "string" || !raw.objection.trim()) continue;
    if (typeof raw.response !== "string" || !raw.response.trim()) continue;
    items.push({
      objection: raw.objection.trim(),
      response: raw.response.trim(),
    });
  }
  return items;
}

function normalizeComparisonTableRows(
  value: unknown,
): KaiComparisonTableBlock["rows"] {
  if (!Array.isArray(value)) return [];
  const rows: KaiComparisonTableBlock["rows"] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.label !== "string" || !raw.label.trim()) continue;
    const values = stringArray(raw.values);
    if (values.length === 0) continue;
    rows.push({ label: raw.label.trim(), values });
  }
  return rows;
}

function normalizeDecisionMatrixRows(value: unknown): KaiDecisionMatrixRow[] {
  if (!Array.isArray(value)) return [];
  const rows: KaiDecisionMatrixRow[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.criterion !== "string" || !raw.criterion.trim()) continue;
    const scores = Array.isArray(raw.scores)
      ? raw.scores.filter(
          (n): n is number => typeof n === "number" && Number.isFinite(n),
        )
      : [];
    if (scores.length === 0) continue;
    rows.push({ criterion: raw.criterion.trim(), scores });
  }
  return rows;
}

/** Falls back to the local heuristic's guess (see lib/kai/intent.ts)
 * when Gemini's self-reported "intent" is missing or not one of the
 * known values — never left undefined, so analytics/debugging always
 * has a value to key off. */
export function normalizeIntent(
  value: unknown,
  fallback: KaiMessageIntent = "general_question",
): KaiMessageIntent {
  return typeof value === "string" && INTENT_SET.has(value)
    ? (value as KaiMessageIntent)
    : fallback;
}

function isValidContext(value: unknown): value is KaiChatContext {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<KaiChatContext>;
  if (
    typeof candidate.user?.displayName !== "string" ||
    typeof candidate.user?.locale !== "string"
  ) {
    return false;
  }
  if (!candidate.conversation || !GOALS.has(candidate.conversation.goal))
    return false;
  if (typeof candidate.conversation.summary !== "string") return false;
  if (!Array.isArray(candidate.conversation.recentMessages)) return false;
  if (!candidate.memories || !Array.isArray(candidate.memories.items))
    return false;
  if (typeof candidate.memories.personSummary !== "string") return false;
  return true;
}

export function validateChatRequest(
  body: unknown,
): { ok: true; value: ValidatedChatRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be an object." };
  }
  const candidate = body as ChatRequestBody;

  if (candidate.kind !== "open" && candidate.kind !== "reply") {
    return { ok: false, error: "kind must be 'open' or 'reply'." };
  }
  if (!isValidContext(candidate.context)) {
    return { ok: false, error: "context is missing required fields." };
  }
  if (
    candidate.kind === "reply" &&
    (typeof candidate.message !== "string" || !candidate.message.trim())
  ) {
    return { ok: false, error: "message is required when kind is 'reply'." };
  }

  const persistenceIds = [
    candidate.threadId,
    candidate.requestId,
    candidate.assistantMessageId,
  ];
  const hasPersistenceIds =
    persistenceIds.some(Boolean) || Boolean(candidate.userMessageId);
  if (hasPersistenceIds) {
    if (
      persistenceIds.some(
        (id) => typeof id !== "string" || !UUID_PATTERN.test(id),
      )
    ) {
      return {
        ok: false,
        error: "threadId, requestId and assistantMessageId must be UUIDs.",
      };
    }
    if (
      candidate.kind === "reply" &&
      (typeof candidate.userMessageId !== "string" ||
        !UUID_PATTERN.test(candidate.userMessageId))
    ) {
      return {
        ok: false,
        error: "userMessageId must be a UUID for reply requests.",
      };
    }
  }

  return {
    ok: true,
    value: {
      kind: candidate.kind,
      context: candidate.context,
      message: candidate.message,
      threadId: candidate.threadId,
      threadTitle:
        typeof candidate.threadTitle === "string"
          ? candidate.threadTitle.trim().slice(0, 120)
          : undefined,
      requestId: candidate.requestId,
      userMessageId: candidate.userMessageId,
      assistantMessageId: candidate.assistantMessageId,
    },
  };
}

export function normalizeBlocks(value: unknown): KaiMessageBlock[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const blocks: KaiMessageBlock[] = [];

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.type !== "string" || !BLOCK_TYPES.has(raw.type)) continue;

    const title = typeof raw.title === "string" ? raw.title : "";
    const description =
      typeof raw.description === "string" ? raw.description : "";

    if (raw.type === "action_plan") {
      const tasks = normalizeActionTasks(raw.tasks);
      const durationLabel =
        typeof raw.duration_label === "string" ? raw.duration_label.trim() : "";
      if (tasks.length > 0) {
        blocks.push({
          type: "action_plan",
          title,
          tasks,
          ...(durationLabel ? { durationLabel } : {}),
        });
      }
    } else if (raw.type === "comparison") {
      const leftPoints = Array.isArray(raw.leftPoints)
        ? raw.leftPoints.filter((s): s is string => typeof s === "string")
        : [];
      const rightPoints = Array.isArray(raw.rightPoints)
        ? raw.rightPoints.filter((s): s is string => typeof s === "string")
        : [];
      if (
        typeof raw.leftLabel === "string" &&
        typeof raw.rightLabel === "string"
      ) {
        blocks.push({
          type: "comparison",
          leftLabel: raw.leftLabel,
          leftPoints,
          rightLabel: raw.rightLabel,
          rightPoints,
        });
      }
    } else if (raw.type === "journey") {
      blocks.push({ type: "journey", title: title || "Your journey" });
    } else if (raw.type === "career_card" || raw.type === "university_card") {
      if (title) blocks.push({ type: raw.type, title, description });
    } else if (raw.type === "memory_card") {
      blocks.push({
        type: "memory_card",
        title: title || "What I remember about you",
      });
    } else if (raw.type === "recommendation_history") {
      blocks.push({
        type: "recommendation_history",
        title: title || "What I've suggested so far",
      });
    } else if (raw.type === "resume_conversation") {
      if (title)
        blocks.push({ type: "resume_conversation", title, description });
    } else if (raw.type === "goal_card") {
      if (title) blocks.push({ type: "goal_card", title, description });
    } else if (raw.type === "milestone_card") {
      blocks.push({
        type: "milestone_card",
        title: title || "Your next milestone",
      });
    } else if (raw.type === "learning_resources") {
      const resources = Array.isArray(raw.resources)
        ? raw.resources
            .map(normalizeResource)
            .filter((r): r is KaiLearningResource => r !== null)
            .slice(0, 3)
        : [];
      if (resources.length > 0) {
        blocks.push({
          type: "learning_resources",
          title: title || "Worth checking out",
          resources,
        });
      }
    } else if (raw.type === "source_list") {
      // Source lists are created server-side from provider grounding metadata,
      // never accepted from the model's structured response.
      continue;
    } else if (raw.type === "insight_block") {
      const body = typeof raw.body === "string" ? raw.body.trim() : "";
      if (title && body) blocks.push({ type: "insight_block", title, body });
    } else if (raw.type === "bullet_list") {
      const items = stringArray(raw.items);
      if (items.length > 0)
        blocks.push({
          type: "bullet_list",
          ...(title ? { title } : {}),
          items,
        });
    } else if (raw.type === "checklist") {
      const items = stringArray(raw.items);
      if (title && items.length > 0)
        blocks.push({ type: "checklist", title, items });
    } else if (raw.type === "talking_points") {
      const points = stringArray(raw.points);
      if (title && points.length > 0)
        blocks.push({ type: "talking_points", title, points });
    } else if (raw.type === "family_script") {
      const script = stringArray(raw.script);
      if (title && script.length > 0)
        blocks.push({ type: "family_script", title, script });
    } else if (raw.type === "objection_response_list") {
      const items = normalizeObjectionItems(raw.objections);
      if (title && items.length > 0)
        blocks.push({ type: "objection_response_list", title, items });
    } else if (raw.type === "reflection_question") {
      const question =
        typeof raw.question === "string" ? raw.question.trim() : "";
      if (question) blocks.push({ type: "reflection_question", question });
    } else if (raw.type === "comparison_table") {
      const columns = stringArray(raw.columns);
      const rows = normalizeComparisonTableRows(raw.table_rows);
      if (title && columns.length > 0 && rows.length > 0) {
        blocks.push({ type: "comparison_table", title, columns, rows });
      }
    } else if (raw.type === "decision_matrix") {
      const options = stringArray(raw.options);
      const rows = normalizeDecisionMatrixRows(raw.matrix_rows);
      const recommendation =
        typeof raw.recommendation === "string" ? raw.recommendation.trim() : "";
      if (title && options.length > 0 && rows.length > 0) {
        blocks.push({
          type: "decision_matrix",
          title,
          options,
          rows,
          ...(recommendation ? { recommendation } : {}),
        });
      }
    }
  }

  return blocks.length > 0 ? blocks : undefined;
}

export function normalizeComparisonRecoveryBlock(
  value: unknown,
): KaiComparisonBlock | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const fields = [
    "leftLabel",
    "leftPoint1",
    "leftPoint2",
    "rightLabel",
    "rightPoint1",
    "rightPoint2",
  ] as const;
  if (
    fields.some(
      (field) => typeof raw[field] !== "string" || !raw[field].trim(),
    )
  ) {
    return null;
  }

  return {
    type: "comparison",
    leftLabel: (raw.leftLabel as string).trim(),
    leftPoints: [
      (raw.leftPoint1 as string).trim(),
      (raw.leftPoint2 as string).trim(),
    ],
    rightLabel: (raw.rightLabel as string).trim(),
    rightPoints: [
      (raw.rightPoint1 as string).trim(),
      (raw.rightPoint2 as string).trim(),
    ],
  };
}

const COMPARISON_QUICK_REPLIES = {
  en: [
    "Compare study requirements",
    "Compare career opportunities",
    "Which option fits my profile?",
  ],
  ar: [
    "قارن متطلبات الدراسة",
    "قارن الفرص المهنية",
    "أي خيار يناسب ملفي أكثر؟",
  ],
} as const;

export function normalizeQuickReplies(
  value: unknown,
  intent: KaiMessageIntent,
  locale: string,
): string[] | undefined {
  if (intent === "career_comparison") {
    return [...COMPARISON_QUICK_REPLIES[locale === "ar" ? "ar" : "en"]];
  }
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .filter((reply): reply is string => typeof reply === "string")
    .map((reply) => reply.trim())
    .filter(Boolean);
  const unique = [...new Set(normalized)].slice(0, 4);
  return unique.length > 0 ? unique : undefined;
}

export function fallbackMessage(locale: string): KaiMessage {
  const text =
    locale === "ar"
      ? "أواجه صعوبة في التفكير بوضوح الآن — هل يمكنك المحاولة مرة أخرى بعد قليل؟"
      : "I'm having trouble thinking clearly right now — mind trying that again in a moment?";
  return {
    id: `kai-fallback-${Date.now()}`,
    role: "kai",
    createdAt: new Date().toISOString(),
    text,
    quickReplies: locale === "ar" ? ["حاول مرة أخرى"] : ["Try again"],
  };
}
