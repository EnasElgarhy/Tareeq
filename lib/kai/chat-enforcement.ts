import type { KaiChatContext } from "@/lib/kai/chat-context";
import type { KaiMessageBlock } from "@/lib/kai/chat-types";
import type { KaiMessageIntent } from "@/lib/kai/intent";
import { extractBulletsFromText, extractDayPlanFromText, stripMarkdown } from "@/lib/kai/repair";
import { getMissingRequiredBlocks } from "@/lib/kai/required-blocks";

export type BlockType = KaiMessageBlock["type"];

function repairId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface RepairInput {
  text: string;
  blocks: KaiMessageBlock[] | undefined;
  intent: KaiMessageIntent;
  locale: string;
}

export interface RepairResult {
  text: string;
  blocks: KaiMessageBlock[] | undefined;
  /** Required types this pass could not safely extract from prose —
   * empty once the contract is satisfied. The caller escalates to a
   * stricter retry, then a deterministic fallback, for whatever
   * remains here. */
  stillMissing: BlockType[];
}

/**
 * Deterministic repair — converts prose into the required block shape
 * wherever the pattern is safely extractable (a day-by-day plan, a
 * bullet list). Never invents structured data it can't verify: resource
 * metadata (title/author/difficulty/time) and a family's specific
 * talking points aren't recoverable from arbitrary prose, so those
 * pass through in `stillMissing` for the caller to retry or fall back
 * on, rather than fabricating plausible-looking fake content.
 */
export function repairRequiredBlocks(input: RepairInput): RepairResult {
  const missing = getMissingRequiredBlocks(input.intent, input.blocks);
  if (missing.length === 0) {
    return { text: input.text, blocks: input.blocks, stillMissing: [] };
  }

  let text = stripMarkdown(input.text);
  const addedBlocks: KaiMessageBlock[] = [];
  const stillMissing: BlockType[] = [];

  for (const type of missing) {
    if (type === "action_plan") {
      const dayPlan = extractDayPlanFromText(text);
      if (dayPlan) {
        addedBlocks.push({
          type: "action_plan",
          title: input.locale === "ar" ? "خطتك" : "Your plan",
          tasks: dayPlan.tasks.map((task, i) => ({ id: repairId("repaired-task", i), text: task })),
        });
        text = dayPlan.leadIn || text;
        continue;
      }
    }

    if (type === "checklist" || type === "bullet_list") {
      const bullets = extractBulletsFromText(text);
      if (bullets) {
        addedBlocks.push(
          type === "checklist"
            ? {
                type: "checklist",
                title: input.locale === "ar" ? "الخطوات التالية" : "Next steps",
                items: bullets.items,
              }
            : { type: "bullet_list", items: bullets.items },
        );
        text = bullets.leadIn || text;
        continue;
      }
    }

    // talking_points / family_script / insight_block / learning_resources —
    // not safely extractable from arbitrary prose. Left for the caller.
    stillMissing.push(type);
  }

  return {
    text: text || input.text,
    blocks: addedBlocks.length > 0 ? [...(input.blocks ?? []), ...addedBlocks] : input.blocks,
    stillMissing,
  };
}

function clusterName(context: KaiChatContext): string {
  if (context.assessment?.primaryCluster) return context.assessment.primaryCluster;
  return context.user.locale === "ar" ? "مسارك" : "your direction";
}

/**
 * Last-resort, deterministic content for whatever's still missing after
 * repair and one stricter retry. Built from real context where it's
 * available (explain_result's insight_block uses the actual assessment
 * data, never invented) and deliberately generic-but-honest elsewhere
 * (a starter action_plan, generic talking points) rather than ever
 * fabricating specific resource metadata or a family script that
 * pretends to know details it doesn't.
 */
export function buildFallbackBlocks(
  missing: BlockType[],
  context: KaiChatContext,
): KaiMessageBlock[] {
  const ar = context.user.locale === "ar";
  const cluster = clusterName(context);
  const blocks: KaiMessageBlock[] = [];

  if (missing.includes("action_plan")) {
    blocks.push({
      type: "action_plan",
      title: ar ? "نقطة انطلاق" : "A starting point",
      tasks: [
        {
          id: "fallback-task-0",
          text: ar ? `شاهد فيديو "يوم في حياة" عن ${cluster}` : `Watch a "day in the life" video about ${cluster}`,
        },
        {
          id: "fallback-task-1",
          text: ar ? "تحدث مع شخص يعمل بالفعل في هذا المجال" : "Talk to one person already working in this field",
        },
        {
          id: "fallback-task-2",
          text: ar
            ? "اكتب ما يثير حماسك وما يقلقك بشأن هذا المسار"
            : "Write down what excites you and what worries you about this path",
        },
      ],
    });
  }

  if (missing.includes("learning_resources")) {
    blocks.push({
      type: "bullet_list",
      title: ar ? "كيف تبحث بنفسك" : "How to search for these yourself",
      items: ar
        ? [
            `ابحث في يوتيوب عن "يوم في حياة ${cluster}"`,
            "ابحث عن قنوات ومقالات موثوقة في هذا المجال",
            "اسأل معلمًا أو مرشدًا عن مصادر يوصي بها",
          ]
        : [
            `Search YouTube for "day in the life of ${cluster}"`,
            "Look for well-known channels or publications in this field",
            "Ask a teacher or mentor for a resource they'd personally recommend",
          ],
    });
  }

  if (missing.includes("talking_points")) {
    blocks.push({
      type: "talking_points",
      title: ar ? "نقاط للحديث" : "Points to make",
      points: ar
        ? ["أوضح أنك درست هذا القرار بجدية", "اربط اختيارك بنقاط قوتك الحقيقية", "اطلب دعمهم مع بقائك منفتحًا على أسئلتهم"]
        : [
            "Show that you've genuinely thought this through",
            "Connect the choice to your real strengths",
            "Ask for their support while staying open to their questions",
          ],
    });
  }

  if (missing.includes("checklist")) {
    blocks.push({
      type: "checklist",
      title: ar ? "قبل أن تتحدث معهم" : "Before you talk to them",
      items: ar
        ? ["اختر لحظة هادئة للحديث", "أحضر مثالًا واحدًا ملموسًا", "استمع فعليًا لمخاوفهم"]
        : ["Pick a calm moment to talk", "Bring one concrete example", "Actually listen to their concerns"],
    });
  }

  if (missing.includes("family_script")) {
    blocks.push({
      type: "family_script",
      title: ar ? "ما يمكنك قوله" : "What you can say",
      script: ar
        ? ["لقد فكرت في هذا كثيرًا، ولست أتخذ هذا القرار باستخفاف.", "أرغب في مشاركتكم بما دفعني لهذا الاختيار."]
        : [
            "I've thought about this a lot, and I'm not taking it lightly.",
            "I'd like to share what's actually drawing me to this.",
          ],
    });
  }

  if (missing.includes("insight_block")) {
    const confidence = context.assessment?.confidence;
    const body =
      confidence !== undefined
        ? ar
          ? `بوصلتك تشير إلى ${cluster} بثقة ${confidence}%، وهذا يعني أن إجاباتك أظهرت اهتمامًا حقيقيًا ومتسقًا بهذا الاتجاه.`
          : `Your compass points to ${cluster} with ${confidence}% confidence — your answers showed a real, consistent pull toward this direction.`
        : ar
          ? `بوصلتك تشير إلى ${cluster}، وهذا اتجاه يستحق الاستكشاف بجدية.`
          : `Your compass points to ${cluster} — a direction worth exploring seriously.`;
    blocks.push({
      type: "insight_block",
      title: ar ? "لماذا هذا مهم لك" : "Why this matters for you",
      body,
    });
  }

  return blocks;
}

export interface EnforcementAttempt {
  text: string;
  blocks: KaiMessageBlock[] | undefined;
  intent: KaiMessageIntent;
}

export interface EnforcementOutcome<TRaw> {
  text: string;
  blocks: KaiMessageBlock[] | undefined;
  /** Non-null exactly when the stricter retry ran AND succeeded — the
   * caller uses this (rather than a boolean flag) to pick which
   * attempt's quickReplies/summary/memoryUpdates to keep, without
   * re-deriving that decision from a separately captured variable. */
  retryRaw: TRaw | null;
}

/**
 * Runs repair, and — only if repair couldn't satisfy the contract —
 * calls `retryOnce` for one stricter attempt before falling back to
 * deterministic content for whatever's still missing. `retryOnce` stays
 * injected rather than importing the Gemini fetch directly, so this
 * orchestration is unit-testable without mocking network calls. `TRaw`
 * is the caller's own raw-response shape (route.ts's ParsedGeminiResponse)
 * — passed through opaquely so the caller can recover quickReplies/
 * summary/memoryUpdates from whichever attempt actually won, without a
 * mutable variable captured across the closure boundary.
 */
export async function enforceRequiredBlocks<TRaw>(
  initial: EnforcementAttempt,
  context: KaiChatContext,
  retryOnce: (stillMissing: BlockType[]) => Promise<(EnforcementAttempt & { raw: TRaw }) | null>,
): Promise<EnforcementOutcome<TRaw>> {
  const locale = context.user.locale;
  const firstRepair = repairRequiredBlocks({ ...initial, locale });
  if (firstRepair.stillMissing.length === 0) {
    return { text: firstRepair.text, blocks: firstRepair.blocks, retryRaw: null };
  }

  const retryResult = await retryOnce(firstRepair.stillMissing);
  if (!retryResult) {
    const fallback = buildFallbackBlocks(firstRepair.stillMissing, context);
    return {
      text: firstRepair.text,
      blocks: [...(firstRepair.blocks ?? []), ...fallback],
      retryRaw: null,
    };
  }

  const secondRepair = repairRequiredBlocks({ ...retryResult, locale });
  if (secondRepair.stillMissing.length === 0) {
    return { text: secondRepair.text, blocks: secondRepair.blocks, retryRaw: retryResult.raw };
  }

  const fallback = buildFallbackBlocks(secondRepair.stillMissing, context);
  return {
    text: secondRepair.text,
    blocks: [...(secondRepair.blocks ?? []), ...fallback],
    retryRaw: retryResult.raw,
  };
}
