import "server-only";

import { BRAND } from "@/lib/brand";
import { recipientsFrom, sendEmail } from "@/lib/email/send-email";

/**
 * Who hears about a safeguarding_alert (28 Oct update, Part A.5): an email
 * to SAFEGUARDING_ALERT_TO, enas@mapmycore.com by default. It names the
 * student's account and conversation so the right person can open it, and
 * never quotes what the student wrote.
 */
const DEFAULT_RECIPIENT = "enas@mapmycore.com";

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
