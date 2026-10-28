import type { AttributionMetadata } from "@/lib/analytics/attribution";

/**
 * "Send CORE to your child" (For parents page): the start link a parent sends
 * on WhatsApp. It carries the parent's own utm tags, so the child's visit,
 * assessment and payment are credited to the post that brought the parent.
 * A parent with no tags (typed the address) is labelled as a WhatsApp share.
 */
export function childInviteUrl(origin: string, meta: AttributionMetadata): string {
  const tagged = Boolean(meta.src && meta.src !== "direct" && meta.medium !== "referral");
  const params = new URLSearchParams(
    tagged
      ? Object.entries({
          utm_source: meta.src,
          utm_medium: meta.medium,
          utm_campaign: meta.campaign,
          utm_content: meta.post,
        }).filter((entry): entry is [string, string] => Boolean(entry[1]))
      : [
          ["utm_source", "whatsapp"],
          ["utm_medium", "share"],
          ["utm_content", "parent-to-child"],
        ],
  );
  return `${origin.replace(/\/$/, "")}/?${params.toString()}`;
}

/** wa.me with the message and link filled in; the parent picks the chat. */
export function whatsappShareUrl(message: string, link: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`;
}
