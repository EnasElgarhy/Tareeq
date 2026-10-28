import "server-only";

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

/**
 * Transactional email through Amazon SES (the apps already run on AWS App
 * Runner, whose instance role signs the request). Configure with:
 *   EMAIL_FROM   - a verified SES sender, e.g. "Map My CORE <support@mapmycore.com>"
 *   SES_REGION   - optional; falls back to AWS_REGION
 * Without EMAIL_FROM nothing is sent and the caller is told so, which keeps
 * local development and staging quiet until SES is set up.
 */

export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export type SendResult =
  | { sent: true; messageId: string | null }
  | { sent: false; reason: "not_configured" | "no_recipients" | "failed"; error?: string };

let client: SESv2Client | null = null;

function sesClient(): SESv2Client {
  client ??= new SESv2Client({ region: process.env.SES_REGION ?? process.env.AWS_REGION });
  return client;
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) return { sent: false, reason: "not_configured" };
  const to = message.to.map((address) => address.trim()).filter(Boolean);
  if (to.length === 0) return { sent: false, reason: "no_recipients" };

  try {
    const result = await sesClient().send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: to },
        Content: {
          Simple: {
            Subject: { Data: message.subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: message.html, Charset: "UTF-8" },
              Text: { Data: message.text, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
    return { sent: true, messageId: result.MessageId ?? null };
  } catch (error) {
    return { sent: false, reason: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

/** Comma- or space-separated addresses from an environment variable. */
export function recipientsFrom(value: string | undefined): string[] {
  return (value ?? "").split(/[\s,]+/).filter((address) => address.includes("@"));
}
