import "server-only";

import { BRAND } from "@/lib/brand";
import { recipientsFrom, sendEmail } from "@/lib/email/send-email";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Who hears about a safeguarding_alert (28 Oct update, Part A.5): an email
 * to SAFEGUARDING_ALERT_TO, enas@mapmycore.com by default. It names the
 * student's account and conversation so the right person can open it, and
 * never quotes what the student wrote.
 */
const DEFAULT_RECIPIENT = "enas@mapmycore.com";

/**
 * One email per student and conversation every six hours: the first one
 * already sends someone to review that whole conversation, and repeats
 * (or a student scripting them) would bury other alerts. Every alert is
 * still logged (security review, 12 Nov 2026).
 */
const emailedRecently = createRateLimiter({ limit: 1, windowMs: 6 * 60 * 60_000 });

export interface SafeguardingAlert {
  userId: string;
  threadId?: string;
  requestId?: string;
  at: Date;
}

export function buildSafeguardingEmail(alert: SafeguardingAlert) {
  const when = alert.at.toISOString();
  const lines = [
    "Kai raised a safeguarding alert in a student conversation.",
    "Kai has already responded with care, encouraged the student to talk to a trusted adult, and shared the emergency number.",
    "",
    `Time (UTC): ${when}`,
    `Student account: ${alert.userId}`,
    `Conversation: ${alert.threadId ?? "unknown"}`,
    `Request: ${alert.requestId ?? "unknown"}`,
    "",
    "The conversation itself is not included in this email. Please review it in the admin panel and follow the safeguarding procedure.",
  ];
  return {
    subject: `${BRAND.name}: safeguarding alert from Kai`,
    text: lines.join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#222">${lines
      .map((line) => (line ? `<p style="margin:0 0 8px">${line}</p>` : "<br>"))
      .join("")}</div>`,
  };
}

/** Never throws: a failed email is logged loudly, and Kai's reply still goes out. */
export async function sendSafeguardingAlert(alert: SafeguardingAlert): Promise<void> {
  if (emailedRecently.isLimited(`${alert.userId}:${alert.threadId ?? ""}`)) {
    console.warn("[kai/core] safeguarding alert repeated; already emailed for this conversation", {
      userId: alert.userId,
      threadId: alert.threadId,
      requestId: alert.requestId,
    });
    return;
  }
  const to = recipientsFrom(process.env.SAFEGUARDING_ALERT_TO ?? DEFAULT_RECIPIENT);
  try {
    const result = await sendEmail({ to, ...buildSafeguardingEmail(alert) });
    if (!result.sent) {
      console.error("[kai/core] safeguarding alert email NOT sent", {
        reason: result.reason,
        threadId: alert.threadId,
      });
    }
  } catch (error) {
    console.error("[kai/core] safeguarding alert email failed", error);
  }
}
