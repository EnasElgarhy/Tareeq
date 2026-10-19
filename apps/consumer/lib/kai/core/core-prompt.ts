import type { KaiChatRole } from "@/lib/kai/chat-types";
import type { CoreKaiContext } from "./core-context";
import { CORE_KAI_TOOLS } from "./core-events";
import { CORE_KAI_SYSTEM_PROMPT } from "./system-prompt";

/**
 * Kai for CORE students: the client's prompt verbatim, then only what the
 * app's JSON reply needs. The appendix adds no behaviour of its own; every
 * rule about what Kai says stays in the client's text above it.
 */
export const CORE_OUTPUT_FORMAT = `OUTPUT FORMAT
Your reply is read by the app as one JSON object matching the response schema. The fields only carry the reply; every rule above still applies to what goes in them.
- "text": your message to the student.
- "quickReplies": up to three short answers the student might tap next, in the student's language and voice. Leave it empty when none fit.
- "events": when the rules above tell you to call ${CORE_KAI_TOOLS.join(", ")}, put that call here with its fields. Otherwise leave it empty.
- "summary": one sentence summing up the conversation so far. The student does not see it.
Write plain text in every field, without markdown or emoji.`;

export function buildCoreSystemPrompt(): string {
  return `${CORE_KAI_SYSTEM_PROMPT}\n\n${CORE_OUTPUT_FORMAT}`;
}

const CORE_EVENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    tool: { type: "STRING", enum: [...CORE_KAI_TOOLS] },
    result: {
      type: "STRING",
      description: "record_disagreement: the result, by its name in the report.",
    },
    student_version: {
      type: "STRING",
      description: "record_disagreement: what the student says fits instead, in their words.",
    },
    reason: {
      type: "STRING",
      description: "record_disagreement: the reason, if the student gave one.",
    },
    shift: {
      type: "STRING",
      description: "record_shift_explanation: the shift, as named in PREVIOUS_SHIFTS.",
    },
    explanation: {
      type: "STRING",
      description: "record_shift_explanation: the student's explanation, in their words.",
    },
  },
  required: ["tool"],
};

export function buildCoreResponseSchema() {
  return {
    type: "OBJECT",
    properties: {
      text: { type: "STRING", description: "Kai's message to the student." },
      quickReplies: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Up to three short replies the student could tap next.",
      },
      events: {
        type: "ARRAY",
        items: CORE_EVENT_SCHEMA,
        description: "Tool calls the rules ask for in this turn, if any.",
      },
      summary: { type: "STRING", description: "One sentence summing up the conversation so far." },
    },
    required: ["text"],
  };
}

/**
 * Repetition-loop recovery: no arrays to loop on. The safeguarding flag stays,
 * so an alert is not lost when the normal schema fails.
 */
export function buildCoreRecoverySchema() {
  return {
    type: "OBJECT",
    properties: {
      text: { type: "STRING", description: "Kai's message to the student, as plain text." },
      safeguarding_alert: {
        type: "BOOLEAN",
        description: "True when the rules above say to call safeguarding_alert in this turn.",
      },
    },
    required: ["text"],
  };
}

export interface CoreTurnInput {
  payload: CoreKaiContext;
  conversationSummary: string;
  recentMessages: ReadonlyArray<{ role: KaiChatRole; text: string }>;
  kind: "open" | "reply";
  message?: string;
}

function turnInstruction(input: CoreTurnInput): string {
  if (input.kind === "open") {
    // Part A §3 of the Kai instructions: opened directly, Kai gives a short
    // welcome and one open question about the report.
    return input.payload.ENTRY_PROMPT
      ? "Write Kai's first message now."
      : "Write Kai's first message now: a short welcome and one open question about the report.";
  }
  const hasKaiSpoken = input.recentMessages.some((message) => message.role === "kai");
  const answering =
    input.payload.ENTRY_PROMPT && !hasKaiSpoken
      ? "\nThe student saw ENTRY_PROMPT in the report and is answering it."
      : "";
  return `The student just said: ${JSON.stringify(input.message ?? "")}${answering}\n\nWrite Kai's reply now.`;
}

/** The per-request user turn: the payload (spec §7.1), the conversation, the ask. */
export function buildCoreTurnPrompt(input: CoreTurnInput): string {
  const lines = ["CONTEXT", JSON.stringify(input.payload, null, 2)];
  if (input.conversationSummary) {
    lines.push("", `CONVERSATION SUMMARY: ${input.conversationSummary}`);
  }
  if (input.recentMessages.length > 0) {
    lines.push("", "RECENT TURNS");
    for (const message of input.recentMessages) {
      lines.push(`${message.role === "user" ? "Student" : "Kai"}: ${message.text}`);
    }
  }
  lines.push("", turnInstruction(input));
  return lines.join("\n");
}
